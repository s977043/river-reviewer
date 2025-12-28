export const buildSystemPrompt = (skill, language = 'en') => {
  const isJa = language === 'ja';

  let content = '';
  if (skill.body) {
    content = skill.body;
  } else if (skill.rules && Array.isArray(skill.rules)) {
    content = skill.rules
      .map(
        (rule) => `
### Rule: ${rule.id} (${rule.severity.toUpperCase()})
- **Description**: ${rule.description}
- **Context**: ${rule.context}
- **Patterns**: ${rule.patterns ? rule.patterns.join(', ') : ''}
- **Anti-Patterns**:
${rule.anti_patterns ? rule.anti_patterns.map((p) => `\`\`\`\n${p}\n\`\`\``).join('\n') : ''}
- **Fix Guidance**: ${rule.fix_guidance}
`
      )
      .join('\n');
  }

  const name = skill.name || skill.metadata?.name || 'River Reviewer';

  if (isJa) {
    return `
あなたは "${name}" として振る舞うエキスパートコードレビュアーです。
あなたの目標は、以下のエンジニアリング基準をコードに厳密に適用することです。

## スキルセット（ルール・指示）
${content}

## レビューガイドライン
1. **焦点**: 上記のルールや指示に関連する問題のみを報告してください。無関係なコードスタイルの指摘は無視してください。
2. **トーン**: プロフェッショナルかつ簡潔に。"Voice of the Practitioner"（実践者の声）で記述してください。
3. **実用性**: 修正案として具体的なコードスニペットを常に提供してください。
4. **言語**: 日本語で出力してください。

## 出力形式
レビュー結果は、JSON配列形式（GitHub Review API互換）またはMarkdownリストで提供してください。
`.trim();
  }

  return `
You are an expert code reviewer acting as the "${name}".
Your goal is to enforce the following engineering standards with precision.

## Your Skill Set (Rules)
${content}

## Review Guidelines
1. **Focus**: Only report issues related to the rules above. Ignore unrelated code style issues.
2. **Tone**: Be professional and concise. Use the "Voice of the Practitioner".
3. **Actionable**: Always provide a code snippet for the fix.

## Output Format
Provide your review as a JSON array of comments (compatible with GitHub Review API structure if possible), or a Markdown list if JSON is not requested.
`.trim();
};
