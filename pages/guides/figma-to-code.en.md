# Figma → Code Implementation Workflow

## Overview

Translating Figma designs into code faithfully requires more than just a prompt. High-quality implementation depends on four elements working together:

| Element                | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| **Figma design rules** | Token, component, and variant naming and structural conventions     |
| **Code design rules**  | How to reference design tokens, component decomposition granularity |
| **Skills / Rules**     | Review patterns and guidelines passed to the LLM                    |
| **Staged flow**        | Strict ordering: read spec → plan → implement → review → fix        |

Without these, the most common problems are hardcoded token values, reimplementing existing components, and drift from the design specification.

## Integration with river-reviewer

river-reviewer ships two midstream skills that handle Figma → code quality checks.

### `rr-midstream-figma-design-drift-001`

Detects **hardcoded** design token values. Issues a warning when colors, font sizes, spacing, or other values are embedded directly rather than referenced through design system variables.

### `rr-midstream-figma-component-reuse-001`

Detects **reimplemented** components. Reports cases where an equivalent implementation already exists in the component library but has been redefined inline.

Both skills run automatically in the midstream phase (post-PR review). No explicit activation is needed.

## Recommended Workflow

````text
Step 1: Read the design specification via Figma MCP
        - Use get_design_context to retrieve component and token information
        - Use get_screenshot to verify visuals

Step 2: Build a component mapping table
        - List Figma component names ↔ code component names
        - Distinguish between existing components to reuse and new ones to create

Step 3: Output an implementation plan (do not write code yet)
        - Document file structure, dependencies, and token reference approach
        - Request a team review of the plan

Step 4: Implement one component at a time
        - Follow the mapping table for imports, props, and styles
        - Always reference design tokens through variables/constants

Step 5: Review with river-reviewer (detect token violations and reimplementations)
        - Opening a PR triggers the midstream phase automatically
        - Check results from `figma-design-drift` and `figma-component-reuse`

Step 6: Fix the diff
        - Resolve all Critical / Major findings before requesting re-review
        - Track Minor findings in a follow-up issue for the next sprint
```text

## Example Agent Prompts

### Discovery (Steps 1–2)

```text
Read the design specification from Figma at <URL> and extract:
1. A list of components used (Figma name / code name / whether new creation is needed)
2. The color tokens and spacing tokens present
3. A classification of which existing library components can be reused vs. newly created

Do not implement anything yet. Output as a mapping table.
```text

### Implementation (Step 4)

```text
Using the mapping table below, implement <ComponentName>:
- Figma spec: <URL>
- Design token import path: <path>
- Existing component import path: <path>

Constraints:
- Always use token variables for colors, fonts, and spacing
- Reuse existing components whenever they are available
- Implement only one component at a time
```text

### Fix (Step 6)

```text
river-reviewer returned the following findings:
<paste findings here>

Fix each finding according to this policy:
- Hardcoded token → replace with the corresponding design token variable
- Reimplementation → import and use the existing component instead

After fixing, report the list of changed locations.
```text

## Common Failure Patterns

| Cause | What happens | Mitigation |
| --- | --- | --- |
| Skipping Step 3 and jumping straight to code | Overall structure drifts without a plan | Never skip the planning phase |
| Manually reading tokens instead of using Figma MCP | Typos and misread token names | Use `get_design_context` for accurate values |
| Requesting multiple components in one prompt | Cross-component dependencies tangle and debugging becomes hard | Enforce one request = one component |
| Ignoring review findings before merging | Token violations ship to production | Treat Critical / Major as merge blockers |
| Not checking for existing components | Library bloats and consistency is lost | Always complete the mapping table in Step 2 |

## Related Pages

- [Adding a Skill (Quick Start)](/guides/add-new-skill) — How to add your own Figma check skill
- [Writing a Skill (How-to Guide)](/guides/write-a-skill) — Detailed guide on skill authoring
- [Agent Skills Catalog for PR/Quality Review](/guides/pr-review-agent-skills) — Full list of available skills
- [Skill Planner (LLM-based Skill Selection)](/guides/skill-planner) — How skills are selected automatically
````
