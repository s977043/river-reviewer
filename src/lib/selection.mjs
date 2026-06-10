// Project-level skill selection (`selection` in .river-review.yaml).
// Design: docs/development/skill-pack-design.md §6.
//
// Resolution: union(packs, tag-matched skills, skills.include) minus
// skills.exclude, deduplicated. `--skill-set` on the CLI overrides the
// config selection entirely. minTier warns (but does not block) when an
// explicitly listed pack sits below the threshold — explicit listing is
// treated as an intentional choice.
import { loadPacks, loadAllSkillMetadata } from '../../runners/core/skill-loader.mjs';

const TIER_RANK = { experimental: 0, community: 1, official: 2 };

/** True when the selection declares anything that affects skill choice. */
export function hasSelection(selection) {
  if (!selection || typeof selection !== 'object') return false;
  return Boolean(
    selection.packs?.length || selection.tags?.length || selection.skills?.include?.length
  );
}

/**
 * Resolve a config `selection` block to a deduplicated skill id list.
 *
 * @param {{ packs?: string[], tags?: string[], skills?: { include?: string[], exclude?: string[] }, minTier?: string }} selection
 * @param {{ skillsDir?: string, warn?: (msg: string) => void }} [options]
 * @returns {Promise<string[]|null>} skill ids, or null when the selection is empty
 */
export async function resolveSelectionSkillIds(
  selection,
  { skillsDir, warn = (msg) => console.warn(msg) } = {}
) {
  if (!hasSelection(selection)) return null;
  const resolved = [];

  if (selection.packs?.length) {
    const loaderOptions = skillsDir ? { skillsDir } : {};
    const packs = await loadPacks(loaderOptions);
    for (const id of selection.packs) {
      const pack = packs.find((p) => p.id === id);
      if (!pack || !Array.isArray(pack.skills)) {
        const available = packs.map((p) => p.id).join(', ') || '(none)';
        throw new Error(`selection.packs: unknown pack "${id}". Available packs: ${available}.`);
      }
      if (
        selection.minTier &&
        TIER_RANK[pack.tier ?? 'experimental'] < TIER_RANK[selection.minTier]
      ) {
        warn(
          `⚠️  selection: pack "${id}" (tier: ${pack.tier ?? 'experimental'}) is below minTier ` +
            `"${selection.minTier}" but runs anyway because it was listed explicitly.`
        );
      }
      resolved.push(...pack.skills);
    }
  }

  if (selection.tags?.length) {
    const wanted = new Set(selection.tags);
    const loaderOptions = skillsDir ? { skillsDir } : {};
    const metas = await loadAllSkillMetadata(loaderOptions);
    for (const skill of metas) {
      const tags = skill.metadata?.tags ?? [];
      if (tags.some((t) => wanted.has(t))) resolved.push(skill.metadata.id);
    }
  }

  resolved.push(...(selection.skills?.include ?? []));

  const exclude = new Set(selection.skills?.exclude ?? []);
  const seen = new Set();
  return resolved.filter((id) => {
    if (typeof id !== 'string' || !id.length) return false;
    if (exclude.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
