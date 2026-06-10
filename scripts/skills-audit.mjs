#!/usr/bin/env node
/**
 * skills-audit.mjs - スキル棚卸しと公式仕様ギャップ分析
 *
 * Issue #309: 現状の skills を機械的に走査し、公式仕様との違反・疑義を一覧化する
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSkillFile } from '../runners/core/skill-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const skillsDir = path.join(repoRoot, 'skills');
const reportPath = path.join(repoRoot, 'reports', 'skills-audit.md');

// name 制約チェック: kebab-case, 50文字以内, 先頭末尾ハイフン禁止
function validateName(name) {
  const errors = [];
  if (!name || typeof name !== 'string') {
    errors.push('name が未定義または空');
    return { valid: false, errors };
  }
  if (name.length > 50) {
    errors.push(`name が50文字超過 (${name.length}文字)`);
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    errors.push('name の先頭または末尾にハイフン');
  }
  if (/--/.test(name)) {
    errors.push('name に連続ハイフン');
  }
  // 許容: a-z, 0-9, ハイフン, スペース, 括弧 (name は人間可読タイトル)
  return { valid: errors.length === 0, errors };
}

// id 制約チェック: kebab-case
function validateId(id) {
  const errors = [];
  if (!id || typeof id !== 'string') {
    errors.push('id が未定義または空');
    return { valid: false, errors };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    errors.push('id が kebab-case でない');
  }
  return { valid: errors.length === 0, errors };
}

// description 制約チェック
function validateDescription(desc) {
  const errors = [];
  if (!desc || typeof desc !== 'string') {
    errors.push('description が未定義または空');
    return { valid: false, errors };
  }
  if (desc.length < 10) {
    errors.push(`description が短すぎる (${desc.length}文字)`);
  }
  return { valid: errors.length === 0, errors };
}

// ファイル行数チェック
async function countLines(content) {
  return content.split('\n').length;
}

// スキルファイルを再帰的に収集（テスト用ディレクトリは除外）
async function collectSkillFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // テスト用ディレクトリなどは除外
      const excludeDirs = ['fixtures', 'golden', 'prompt', 'references', 'scripts', 'assets'];
      if (!excludeDirs.includes(entry.name)) {
        await collectSkillFiles(fullPath, files);
      }
    } else {
      const isMarkdown = entry.name.endsWith('.md') || entry.name.endsWith('.mdx');
      const isIgnored = entry.name.startsWith('_') || entry.name === 'README.md';

      if (isMarkdown && !isIgnored) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

// スキルを検証
async function validateSkill(filePath) {
  const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  const fileName = path.basename(filePath, '.md');
  const result = {
    path: relativePath,
    fileName,
    priority: 'OK',
    issues: [],
    metadata: null,
    lineCount: 0,
  };

  try {
    const content = await fs.readFile(filePath, 'utf8');
    result.lineCount = await countLines(content);

    // parseSkillFile を使用 (自動補完ロジックを含む)
    const parsed = await parseSkillFile(filePath);

    if (!parsed.metadata || Object.keys(parsed.metadata).length === 0) {
      result.issues.push('メタデータが取得できないまたは空');
      result.priority = 'Blocker';
      return result;
    }

    result.metadata = parsed.metadata;

    // id チェック
    const idResult = validateId(parsed.metadata.id);
    if (!idResult.valid) {
      result.issues.push(...idResult.errors);
    }

    // name チェック
    const nameResult = validateName(parsed.metadata.name);
    if (!nameResult.valid) {
      result.issues.push(...nameResult.errors);
    }

    // description チェック
    const descResult = validateDescription(parsed.metadata.description);
    if (!descResult.valid) {
      result.issues.push(...descResult.errors);
    }

    // 行数チェック
    if (result.lineCount > 500) {
      result.issues.push(`行数が推奨上限超過 (${result.lineCount}行 > 500行)`);
    }

    // 必須フィールドチェック (補完後)
    const requiredFields = ['id', 'name', 'description', 'phase', 'severity'];
    for (const field of requiredFields) {
      if (!result.metadata[field]) {
        result.issues.push(`必須フィールド ${field} が未定義 (補完後)`);
      }
    }

    // 推奨フィールドチェック
    const recommendedFields = ['applyTo', 'tags'];
    for (const field of recommendedFields) {
      if (!result.metadata[field]) {
        result.issues.push(`推奨フィールド ${field} が未定義 (補完後)`);
      }
    }

    // 優先度決定
    if (result.issues.some((i) => i.includes('未定義または空') || i.includes('パースできない'))) {
      result.priority = 'Blocker';
    } else if (result.issues.length > 0) {
      result.priority = 'Warning';
    }
  } catch (err) {
    result.issues.push(`ファイル読み込みエラー: ${err.message}`);
    result.priority = 'Blocker';
  }

  return result;
}

// レポート生成
function generateReport(results) {
  const now = new Date().toISOString();
  const blockers = results.filter((r) => r.priority === 'Blocker');
  const warnings = results.filter((r) => r.priority === 'Warning');
  const ok = results.filter((r) => r.priority === 'OK');

  let md = `# Skills Audit Report

Generated: ${now}

## Summary

| Priority | Count |
|----------|-------|
| ❌ Blocker | ${blockers.length} |
| ⚠️ Warning | ${warnings.length} |
| ✅ OK | ${ok.length} |
| **Total** | **${results.length}** |

---

## Blockers (${blockers.length})

${blockers.length === 0 ? 'なし 🎉\n' : ''}
`;

  for (const r of blockers) {
    md += `### ${r.path}\n\n`;
    md += `- **行数**: ${r.lineCount}\n`;
    md += `- **Issues**:\n`;
    for (const issue of r.issues) {
      md += `  - ${issue}\n`;
    }
    md += '\n';
  }

  md += `---

## Warnings (${warnings.length})

`;

  for (const r of warnings) {
    md += `### ${r.path}\n\n`;
    md += `- **行数**: ${r.lineCount}\n`;
    if (r.metadata) {
      md += `- **id**: \`${r.metadata.id || '(未定義)'}\`\n`;
      md += `- **name**: ${r.metadata.name || '(未定義)'}\n`;
    }
    md += `- **Issues**:\n`;
    for (const issue of r.issues) {
      md += `  - ${issue}\n`;
    }
    md += '\n';
  }

  md += `---

## OK (${ok.length})

| ファイル | 行数 | id |
|----------|------|-----|
`;

  for (const r of ok) {
    const id = r.metadata?.id || '-';
    md += `| ${r.path} | ${r.lineCount} | \`${id}\` |\n`;
  }

  return md;
}

// メイン
async function main() {
  console.log('🔍 Skills Audit 開始...\n');

  // skills ディレクトリ配下を走査
  const phases = ['upstream', 'midstream', 'downstream', 'agent-skills'];
  const allFiles = [];

  for (const phase of phases) {
    const phaseDir = path.join(skillsDir, phase);
    try {
      await fs.access(phaseDir);
      const files = await collectSkillFiles(phaseDir);
      allFiles.push(...files);
      console.log(`📂 ${phase}: ${files.length} ファイル`);
    } catch {
      console.log(`⏭️  ${phase}: ディレクトリなし`);
    }
  }

  console.log(`\n📊 合計: ${allFiles.length} スキルファイル\n`);

  // 各スキルを検証
  const results = [];
  for (const file of allFiles) {
    const result = await validateSkill(file);
    results.push(result);
    const icon = result.priority === 'Blocker' ? '❌' : result.priority === 'Warning' ? '⚠️' : '✅';
    console.log(`${icon} ${result.path}`);
  }

  // レポート生成
  const report = generateReport(results);

  // reports ディレクトリ作成
  const reportsDir = path.dirname(reportPath);
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(reportPath, report, 'utf8');

  console.log(`\n📝 レポート生成完了: ${reportPath}`);

  // サマリー
  const blockers = results.filter((r) => r.priority === 'Blocker').length;
  const warnings = results.filter((r) => r.priority === 'Warning').length;
  console.log(
    `\n📊 結果: Blocker=${blockers}, Warning=${warnings}, OK=${results.length - blockers - warnings}`
  );

  if (blockers > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('❌ エラー:', err);
  process.exitCode = 1;
});
