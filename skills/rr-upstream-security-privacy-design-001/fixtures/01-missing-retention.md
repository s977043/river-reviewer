# Test Case: Missing Data Retention Policy

## Input Document

```markdown
# User Profile Service - Design Document

## Overview

This service manages user profiles including personal information.

## Data Model

| Field | Type   | Description        |
| ----- | ------ | ------------------ |
| id    | UUID   | User identifier    |
| email | string | User email address |
| name  | string | Full name          |
| phone | string | Phone number       |

## Storage

User profiles are stored in PostgreSQL database. We use AWS RDS in multiple regions.

## API

### DELETE /users/{id}

Deletes user profile from the database.

## Backup

Daily backups are performed automatically by AWS RDS.

## Logging

All API requests are logged to CloudWatch including user IDs.
```

## Expected Behavior

The skill should detect:

1. No data retention period defined for user profiles (PII)
2. No backup handling mentioned for user deletion
3. Data storage region not specified
4. Logs contain user IDs but no retention policy
