# Security & Privacy Design Review - User Prompt

Review the provided design document and identify security/privacy design gaps.

## Input

- Design document (RFC, ADR, specification, or architecture document)
- Context about the system being designed

## Task

1. Scan for signals indicating PII/personal data handling:
   - User data, customer information, profile data
   - Payment information, contact details
   - Authentication/authorization data
   - Behavioral data, logs with user identifiers

2. For each data handling scenario, check:
   - Is data retention period explicitly defined?
   - Is deletion process documented (including backups)?
   - Is data storage location/region specified?
   - Is audit logging designed for sensitive access?

3. Assess compliance considerations:
   - Cross-border data transfer implications
   - Right to deletion/erasure handling
   - Data minimization principles

4. For each finding:
   - Verify it is relevant to the actual document
   - Check against false-positive guards
   - Assess confidence level

## Output Format

```text
**Finding:** [Brief description of the missing/unclear element]
**Evidence:** [Specific section or quote from document]
**Impact:** [Privacy/compliance risk if not addressed]
**Fix:** [Concrete suggestion to address the gap]
**Severity:** [warning/major]
**Confidence:** [high/medium/low]
```

### Important Notes

- **DO NOT** flag documents that explicitly state they don't handle PII
- **DO NOT** make speculative findings about unmentioned features
- **DO NOT** provide legal advice (recommend legal consultation instead)
- **DO** lower Confidence when context is insufficient
- **DO** suggest specific additions with example text when possible
