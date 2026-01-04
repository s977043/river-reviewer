---
description: "Run lint/typecheck/tests and summarize failures"
---

次をこの順で実行して、失敗したら原因と修正案を出して：

1. `npm run lint`
2. `npm run typecheck` (存在する場合)
3. `npm test`

成功したら、変更の要点とリスクを 3 点でまとめて：

- 後方互換性
- 性能への影響
- セキュリティ考慮
