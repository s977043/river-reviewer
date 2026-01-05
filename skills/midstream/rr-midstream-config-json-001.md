---
id: rr-midstream-config-json-001
name: Configuration File Review
description: Review JSON/YAML configuration files for common issues and best practices.
version: 0.1.0
category: midstream
phase: midstream
applyTo:
  - '**/*.json'
  - '**/*.yml'
  - '**/*.yaml'
tags:
  - config
  - json
  - yaml
  - midstream
severity: minor
inputContext:
  - diff
outputKind:
  - findings
modelHint: cheap
---

## Goal

設定ファイル（JSON/YAML）の変更をレビューし、一般的な問題やベストプラクティス違反を検出する。

## Guidance

- スキーマ違反や構文エラーの可能性を指摘する
- 機密情報（API キー、パスワード、トークン）の直書きを検出する
- 廃止された設定項目や非推奨オプションの使用を指摘する
- 設定値の妥当性（範囲外の数値、無効な組み合わせ）を確認する
- 環境固有の設定が誤ってコミットされていないか確認する

## Non-goals

- `package-lock.json` や自動生成ファイルはレビュー対象外（ノイズ削減のため）
- `node_modules/` 内のファイルは対象外
- テスト用フィクスチャファイルの内容は厳密にチェックしない

## False-positive guards

- `.example` や `.sample` 接尾辞のファイルはダミー値を許容する
- テストディレクトリ内のファイルは緩和する
- 明示的にコメントで意図が説明されている場合は抑制する

## Output

標準フォーマット: `<file>:<line>: Finding: ... Evidence: ... Impact: ... Fix: ... Severity: ... Confidence: ...`
