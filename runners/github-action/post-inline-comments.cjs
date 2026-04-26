const fs = require('fs');

const COMMENT_MARKER = '<!-- river-reviewer -->';
const SEVERITY_EMOJI = { critical: '🔴', major: '🟠', minor: '🟡', info: 'ℹ️' };
const MAX_INLINE_BODY = 65000;

/**
 * Format a finding body for an inline review comment.
 * If the finding has a suggestion, wrap it in a GitHub suggestion block.
 */
function formatInlineBody(issue) {
  const emoji = SEVERITY_EMOJI[issue.severity] || '🔵';
  const lines = [`${emoji} **[${issue.severity}]** ${issue.title}`];

  if (issue.message && issue.message !== issue.title) {
    lines.push('', issue.message);
  }

  if (Array.isArray(issue.evidence) && issue.evidence.length > 0) {
    lines.push('', `**Evidence:** ${issue.evidence.join('; ')}`);
  }

  if (issue.suggestion) {
    lines.push('', '**Suggested fix:**', '```suggestion', issue.suggestion, '```');
  }

  return lines.join('\n');
}

/**
 * Format a markdown summary from JSON findings for the top-level PR comment.
 */
function formatSummaryFromJson(data) {
  const issues = data.issues ?? [];
  const summary = data.summary ?? {};
  const counts = summary.issueCountBySeverity ?? {};

  const lines = [
    COMMENT_MARKER,
    '## River Reviewer',
    '',
  ];

  const total = issues.length;
  if (total === 0) {
    lines.push('✅ No issues found.');
    return lines.join('\n');
  }

  const countParts = [];
  if (counts.critical > 0) countParts.push(`🔴 ${counts.critical} critical`);
  if (counts.major > 0) countParts.push(`🟠 ${counts.major} major`);
  if (counts.minor > 0) countParts.push(`🟡 ${counts.minor} minor`);
  if (counts.info > 0) countParts.push(`ℹ️ ${counts.info} info`);
  lines.push(`**${total} finding${total === 1 ? '' : 's'}** — ${countParts.join(', ')}`);
  lines.push('');

  const inlineIssues = issues.filter((i) => i.file && i.line);
  const noLocationIssues = issues.filter((i) => !i.file || !i.line);

  if (inlineIssues.length > 0) {
    lines.push(`_Inline comments posted for ${inlineIssues.length} finding${inlineIssues.length === 1 ? '' : 's'} with line info._`);
    lines.push('');
  }

  if (noLocationIssues.length > 0) {
    lines.push('### Findings without line info', '');
    for (const issue of noLocationIssues) {
      const emoji = SEVERITY_EMOJI[issue.severity] || '🔵';
      lines.push(`- ${emoji} **${issue.title}**${issue.file ? ` (${issue.file})` : ''}`);
      if (issue.message && issue.message !== issue.title) {
        lines.push(`  ${issue.message}`);
      }
    }
  }

  if (summary.riskSummary?.aggregateAction) {
    lines.push('', `**Risk:** ${summary.riskSummary.aggregateAction}`);
  }

  return lines.join('\n');
}

module.exports = async function postInlineComments({ github, context, core }) {
  const jsonPath = process.env.RIVER_REVIEWER_JSON_PATH;
  if (!jsonPath || !fs.existsSync(jsonPath)) {
    core.setFailed('River Reviewer JSON output file not found; cannot post inline comments.');
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (err) {
    core.setFailed(`Failed to parse River Reviewer JSON: ${err.message}`);
    return;
  }

  const prNumber = context.payload.pull_request?.number;
  if (!prNumber) {
    core.setFailed('pull_request payload not found; cannot post inline comments.');
    return;
  }

  const { owner, repo } = context.repo;
  const commitId = context.payload.pull_request.head.sha;
  const issues = data.issues ?? [];

  // Separate findings with and without file+line info
  const locatedIssues = issues.filter((i) => i.file && i.line);
  const unlocatedIssues = issues.filter((i) => !i.file || !i.line);

  core.info(`Findings: ${issues.length} total, ${locatedIssues.length} with line info`);

  // Post inline review comments for located findings
  let inlinePosted = 0;
  let inlineFailed = 0;
  const inlineFailedIssues = [];

  for (const issue of locatedIssues) {
    const body = formatInlineBody(issue);
    if (body.length > MAX_INLINE_BODY) {
      core.warning(`Skipping inline comment for ${issue.file}:${issue.line} — body too long`);
      inlineFailedIssues.push(issue);
      inlineFailed++;
      continue;
    }
    try {
      await github.rest.pulls.createReviewComment({
        owner,
        repo,
        pull_number: prNumber,
        commit_id: commitId,
        path: issue.file,
        line: issue.line,
        side: 'RIGHT',
        body,
      });
      inlinePosted++;
    } catch (err) {
      // Line may not be in the diff — gracefully degrade to summary
      core.warning(`Could not post inline comment for ${issue.file}:${issue.line}: ${err.message}`);
      inlineFailedIssues.push(issue);
      inlineFailed++;
    }
  }

  core.info(`Inline comments: ${inlinePosted} posted, ${inlineFailed} failed (will appear in summary)`);

  // Build summary: findings without location + inline failures
  const summaryIssues = { ...data, issues: [...unlocatedIssues, ...inlineFailedIssues] };
  const summaryBody = formatSummaryFromJson(summaryIssues);

  // Post or update top-level summary comment
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  });

  const existing = comments.find(
    (c) => typeof c.body === 'string' && c.body.includes(COMMENT_MARKER)
  );

  if (existing) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body: summaryBody,
    });
    core.info(`Updated existing River Reviewer summary comment (${existing.id}).`);
  } else {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: summaryBody,
    });
    core.info('Created new River Reviewer summary comment.');
  }
};
