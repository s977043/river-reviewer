# The River Architecture

River Reviewer flows with your development process.

Conceptually, the flow has three major segments:

- **Upstream**: requirements, architecture, ADR, design
- **Midstream**: implementation, refactoring, CI integration
- **Downstream**: QA, test analysis, release checks

A fourth layer -- **Riverbed Memory** -- will store contextual decisions so that subsequent reviews can reuse them.

River Reviewer is a **context engineering framework**. It systematically selects, filters, and assembles context—skills, diffs, and memory—to maximize review quality within a bounded context window. Progressive disclosure ensures that only the necessary level of detail is loaded at each stage, preventing attention dilution.
