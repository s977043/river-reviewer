# Runner CLI リファレンス

Runner CLI を使用して、River Reviewer のエージェントとスキルをローカルまたは CI で検証します。
軽量な Python ランナーが `schemas/output.schema.json` に従う構造化されたレビュー結果を出力します。
Python の例を実行する前に、`pip install jsonschema` で必要な依存関係をインストールしてください。

## `--reviewers` フラグ

`river run` の `--reviewers` フラグにはロール名のリスト（カンマ区切り）または特殊キーワード `auto` を指定できます。

### `auto` キーワード

`--reviewers auto` を指定すると、diff の内容を解析してレビュアーロールを自動選択します。`bug-hunter` は常に含まれ、以下のシグナルに基づいて追加ロールが加わります。

| シグナル                                                                                             | 追加されるロール   |
| ---------------------------------------------------------------------------------------------------- | ------------------ |
| config / schema / migration / infra ファイルが変更されている、またはリスク評価済みファイルが存在する | `security-scanner` |
| test ファイルが変更されている、または app ファイルが 3 件以上ある                                    | `test-gap`         |

シグナルが何もない場合は `bug-hunter` のみが使われます。

JSON 出力の `autoSelectedRoles` フィールドで選択されたロールを確認できます。

```json
{
  "autoSelectedRoles": ["bug-hunter", "security-scanner"]
}
```

## コマンド

- Agents: `npm run agents:validate` (または `node scripts/validate-agents.mjs`)
- Skills: `npm run skills:validate` (または `node scripts/validate-skills.mjs`)
- 構造化出力 (Python): `python scripts/rr_runner.py --input tests/fixtures/structured-output/sample_llm_response.json`

## 終了コード

- `0`: 検証が正常に完了した。
- `1`: スキーマチェックが通過しなかったか、スキーマエラーが発生した。

## 例

```bash
# すべてのエージェントを検証
npm run agents:validate

# すべてのスキルを検証
npm run skills:validate

# 構造化されたレビュー出力をビルド（artifacts/river-review-output.json に書き込み）
python scripts/rr_runner.py --input tests/fixtures/structured-output/sample_llm_response.json
```
