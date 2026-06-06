# .river ディレクトリについて

- `.river/rules.md`: プロジェクト固有のレビュールールを記載すると、River Review のプロンプトに自動注入されます。
- `.river/rules.d/*.md`: ルールを複数ファイルに分割したい場合に置くディレクトリ。`*.md` をファイル名のアルファベット順に読み込み、`rules.md` の後ろへ連結注入します（例: `domain.md` / `incidents.md` / `glossary.md`）。`rules.md` が無くても `rules.d/` だけで動作します。
- `.river/rules.template.md`: ルール記述用のテンプレート。必要なセクションを参考に `rules.md` を作成してください。

## 使い方

1. `cp .river/rules.template.md .river/rules.md`
2. 各セクションにプロジェクトの方針・禁止事項・推奨パターンを記述
3. `river run . --dry-run --debug` でルールが読み込まれているか確認

Tips:

- リポジトリの秘密情報は書かない（例示する場合はダミー値で）
- 運用で変更があれば `rules.md` を更新し、レビュー基準を共有する

## 過去インシデントを観点として注入する（rules.d/incidents.md）

過去の障害・再発させたくないバグを「レビュー観点」として能動的に注入したい場合は、`.river/rules.d/incidents.md` に記述します（自動連結注入されます）。これは Riverbed Memory の suppression（過去指摘の抑制）とは逆方向 ―― 過去インシデントを**思い出させる**ための仕組みです。

記述例:

```markdown
# 過去インシデント由来の再発防止観点

## INC-2025-08: 課金ステータスの逆遷移で二重請求

- 事象: `approved` から `pending` への逆遷移を許容し、請求処理が重複した。
- 影響パス: `app/Services/Billing/**`, `app/Models/Subscription*`
- レビュー観点: 課金ステータスの遷移が一方向か。逆遷移・再入を型/ガードで防いでいるか。

## INC-2025-11: 認可チェック漏れで他テナントのデータ参照

- 影響パス: `app/Http/Controllers/**`, `app/api/**`
- レビュー観点: 取得系 API に owner/admin の認可チェックがあるか。テナント境界を跨いでいないか。
```

対象パスに応じて観点を当てたい場合は、影響パスを `.river/risk-map.yaml` の `require_human_review` / `escalate` と組み合わせる（[examples/risk-map](../examples/risk-map/) 参照）。
