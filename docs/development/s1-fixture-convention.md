# S1 Fixture Convention（skill 品質の最小規約）

> 出典: 2026-05-21〜25 retrospective。skill-pack-design.md §2 原則 3 が参照する規約の明文化です。

## 規約

skill を「テスト済みナレッジ」として扱うための最小条件を S1 と呼びます。

- **good fixture（happy-path）**: skill が検出すべき入力例。`*-should-detect` または `<NN>-happy.md` 形式で配置する
- **bad fixture（guard）**: skill が黙るべき入力例（false-positive canary）。`*-should-not-detect` または `<NN>-guard.md` 形式で配置する
- **golden output**: 期待される finding の要点（must_include トークン）。`npm run eval:fixtures` が照合する

配置場所は各 skill ディレクトリ配下の `fixtures/` または `eval/` とします。

## pack tier との関係

- `tier: official` の pack は、所属する全 skill が S1 を満たすことが機械条件である（`skills:validate` の validatePacks が fixtures/ または eval/ の存在を検査する）
- 内容の十分性（fixture がトリビアルでないか）は maintainer review で確認する（機械判定は必要条件にとどめる）

## 検証コマンド

```bash
npm run skills:validate   # pack 構造 + official tier の機械条件
npm run eval:fixtures     # fixture の回帰実行
```
