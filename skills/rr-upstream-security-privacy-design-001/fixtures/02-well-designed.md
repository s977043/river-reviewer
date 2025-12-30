# Test Case: Well-Designed Privacy (False Positive Test)

## Input Document

```markdown
# User Profile Service - Design Document

## Data Classification

This service handles PII. For detailed privacy requirements, see Privacy Impact Assessment.

## Data Retention

| Data Type    | Retention Period         | Deletion Trigger    |
| ------------ | ------------------------ | ------------------- |
| User Profile | 2 years after last login | Automatic purge job |

## Data Residency

- EU users: Data stored exclusively in eu-west-1 (Ireland)
- US users: Data stored in us-east-1 (Virginia)

Cross-border data transfer: EU user data is never transferred outside the EU.

## User Deletion (Right to Erasure)

When a user requests account deletion:

1. Profile is soft-deleted immediately
2. Within 30 days, data is purged from all backups

## Audit Logging

| Event          | Logged Data                     | Retention |
| -------------- | ------------------------------- | --------- |
| Profile access | user_id, accessor_id, timestamp | 1 year    |
```

## Expected Behavior

The skill should NOT flag this as it properly defines retention, residency, deletion, and audit logging.
