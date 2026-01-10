# River Reviewer Smoke Test Prompts

River Reviewer のルーティング機能と基本的なレビュー動作を確認するためのプロンプト集。

## 1. 一般的なコードレビュー (Default Fallback)

**目的**: 特定の専門領域に該当しない場合、デフォルトの `river-reviewer-code`（または相当）にフォールバックするか確認。

```text
以下の変更に対してコードレビューをお願いします。
可読性と保守性の観点で気になる点があれば指摘してください。

diff --git a/src/utils.ts b/src/utils.ts
index e69de29..d95f3ad 100644
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -1,3 +1,3 @@
 export function add(a, b) {
-  return a + b;
+  return a + b; // TODO: handling large numbers
 }
```

## 2. セキュリティレビュー (Routing to security)

**目的**: 「セキュリティ」「脆弱性」といったキーワードで `river-reviewer-security` へルーティングされるか確認。

```text
このPRのセキュリティレビューをお願いします。脆弱性がないか心配です。

diff --git a/src/auth.ts b/src/auth.ts
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/src/auth.ts
@@ -0,0 +1,5 @@
+import { db } from './db';
+
+export function login(username, password) {
+  // query without placeholders
+  return db.query(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`);
+}
```

## 3. アーキテクチャレビュー (Routing to architecture)

**目的**: 「設計」「アーキテクチャ」といったキーワードで `river-reviewer-architecture` へルーティングされるか確認。

```text
設計レビューをお願いします。モジュール構成と依存関係について意見が欲しいです。

diff --git a/src/modules/order/service.ts b/src/modules/order/service.ts
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/src/modules/order/service.ts
@@ -0,0 +1,5 @@
+import { PaymentService } from '../../infrastructure/payment'; // Direct dependency on infra?
+
+export class OrderService {
+  // ...
+}
```
