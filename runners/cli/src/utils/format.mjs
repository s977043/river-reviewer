export function formatPlan(plan) {
  const selected = plan.selected.map(skill => skill.metadata?.id ?? skill.id);
  const skipped = plan.skipped.map(item => ({
    id: item.skill.metadata?.id ?? item.skill.id,
    reasons: item.reasons,
  }));

  return { selected, skipped };
}

export function formatComments(comments) {
  if (!comments || comments.length === 0) {
    return 'No findings.';
  }

  return comments
    .map(comment => `  - ${comment.file}:${comment.line}: ${comment.message}`)
    .join('\n');
}

export function formatSkillList(skills) {
  if (skills.length === 0) {
    return 'No skills matched';
  }

  return skills.join(', ');
}

export function formatSkipped(skipped) {
  if (skipped.length === 0) {
    return '';
  }

  const lines = skipped.map(item => `  - ${item.id}: ${item.reasons.join('; ')}`);
  return lines.join('\n');
}
