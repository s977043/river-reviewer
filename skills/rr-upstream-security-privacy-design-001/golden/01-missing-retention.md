# Expected Output: Missing Data Retention Policy

**Finding:** Data retention period undefined for user profiles
**Evidence:** Data Model defines PII fields (email, name, phone) but no retention period is specified
**Impact:** Without defined retention, PII may be kept indefinitely, violating data minimization principles
**Fix:** Add retention policy table specifying retention period for user profiles
**Severity:** warning
**Confidence:** high

**Finding:** Backup handling for deletion requests not addressed
**Evidence:** DELETE API and Backup section exist but no connection between them
**Impact:** Deleted user data may persist in backups indefinitely
**Fix:** Add backup purge policy: "Upon deletion request, user data is purged from backups within 30 days"
**Severity:** warning
**Confidence:** high

**Finding:** Data storage region not specified despite multi-region deployment
**Evidence:** "We use AWS RDS in multiple regions" - no specification of which data goes where
**Impact:** EU user data may be stored outside EU, potentially violating GDPR
**Fix:** Specify data residency constraints: "EU users' data is stored exclusively in eu-west-1"
**Severity:** warning
**Confidence:** high

**Finding:** Logs contain user IDs without retention policy
**Evidence:** "All API requests are logged to CloudWatch including user IDs"
**Impact:** PII in logs may be retained indefinitely
**Fix:** Define log retention: "Logs with user IDs are rotated after 14 days"
**Severity:** warning
**Confidence:** high
