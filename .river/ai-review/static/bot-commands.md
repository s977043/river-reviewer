# レビューBot PR コマンド運用（Static）

## 前提
- 本書ではボット名を `@river-review-bot` として記載する。
- 実運用で名称が変わる場合は置換し、未対応コマンドは削除する。

## 運用で使用するコマンド一覧
- `@river-review-bot review`: レビューを開始/再実行する。
- `@river-review-bot summarize`: PR 全体の要約を出力する。
- `@river-review-bot release`: リリースノート向けの要約を出力する。
- `@river-review-bot pause`: 当該 PR での自動レビューを停止する。
- `@river-review-bot resume`: 停止した自動レビューを再開する。
- `@river-review-bot ignore`: 当該 PR をレビュー対象外にする。
- `@river-review-bot help`: 利用可能なコマンドやヘルプを表示する。

注記: SaaS/OSS の実装差により、未対応のコマンドは無視される場合がある。ここにないコマンドは原則使用しない。

## River-Reviewer 連動ルール
- PR コメントで `@river-review-bot pause` が来たら River-Reviewer も自動レビューを停止する。
- `@river-review-bot resume` で River-Reviewer を再開する。
- PR 本文に `@river-review-bot ignore` がある場合は River-Reviewer も対象外にする。

## 誰が実行できるか
- **review / summarize / release**: PR 作成者とレビュアーが実行可。
- **pause / resume / ignore**: リポジトリの write 権限以上、またはレビュー担当者のみ実行可。
- **help**: 誰でも実行可。

## いつ使うか（推奨）
- **review**: 大きな変更が入ったタイミング、レビュー再実行が必要なとき。
- **summarize**: 大規模 PR やレビュー着手前の俯瞰確認。
- **release**: リリースノート作成や変更種別の整理が必要なとき。
- **pause**: 変更が頻繁でノイズが増える期間、または人手レビューを優先するとき。
- **resume**: 変更が落ち着いてから再開。
- **ignore**: 機械生成/検証用 PR など、レビュー価値が低いケース。

## 想定トラブルと対策
- **連打/二重実行**: 直近の実行が終わるまで次のコマンドを控える。連打が必要な場合は pause で停止して整理する。
- **ノイズ増大**: summarize を優先し、review の実行回数を制限する。
- **二重投稿**: PR イベントの重複でコメントが増えるため、再実行は手動に限定する。

## 運用例
- 大規模 PR で `@river-review-bot summarize` を先に実行し、レビュー合意後に必要なら `@river-review-bot review` を実行。
- PR が頻繁に更新される場合は `@river-review-bot pause` を入れてノイズを抑え、安定後に `@river-review-bot resume` する。
