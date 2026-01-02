Goal（成功条件を含む）:

- Stream Architecture 仕様に従い、skills/ を core/upstream/midstream/downstream に再編し、YAML Frontmatter（category, trigger.path_patterns 等）付きでロードできるようリファクタリングする。

Constraints / Assumptions:

- AGENTS.md に従い lint/test を実行する。
- gray-matter + @types/gray-matter を使用し、Frontmatter の category を優先して分類する。
- 新しい型定義（StreamCategory など）を src/types/skill.ts に追加する。
- @types/gray-matter は npm から取得できなかったため、型スタブを用意する必要があるかもしれない。

Key decisions:

- 未確定。

State:

- Done: gray-matter 型スタブを追加し、category/path_patterns を含む型・スキーマ・ローダーへ更新。スキルリポジトリを stream 別ディレクトリに再配置し、registry/README/テンプレート/ガイドを更新。
- Now: 変更箇所の整合性確認とテスト準備（skills:validate/test/lint）。
- Next: 検証コマンド実行、差分最終確認、コミット+PR 作成。

Open questions（必要なら UNCONFIRMED）:

- なし。

Working set（files / ids / commands）:

- src/types/skill.ts, src/lib/skillYamlSchema.mjs, schemas/skill.schema.json, runners/core/skill-loader.mjs（Stream Architecture 対応）
- skills/\*（ディレクトリ再編・frontmatter category 追加・community 移動）
- skills/registry.yaml, skills/README.md, pages/reference/skill-metadata.md, skills/\_template.md, agent-skills ガイド（構造/項目更新）
- README.md（community パス更新）
