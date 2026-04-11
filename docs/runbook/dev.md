# 開発ランブック（ローカル）

## 前提

- Node.js 22.x
- npm

## 初期セットアップ

```bash
npm ci
```

## 日常の検証コマンド

```bash
npm run lint
npm test
npm run agents:validate
npm run skills:validate
npm run agent-skills:validate
```

## よくある詰まりどころ

- `npm run check:links` が失敗する場合:
  - `lychee` が未インストールの可能性。
  - ローカルでは `npm run check:links:local` で内部リンクのみ検証可能。
- Lint エラーが日本語文書で出る場合:
  - `npm run lint:text` の出力に従って文言を修正。

## 並行タスク（Git Worktree）

異なるコンテキストのタスクは物理的に分離して実行する。

```bash
# 作成
git worktree add -b <new-branch-name> ../<project>-worktrees/<feature-name> main
cd ../<project>-worktrees/<feature-name>
npm ci

# 作業・検証後にクリーンアップ（PRマージ確認後）
git worktree remove ../<project>-worktrees/<feature-name>
git branch -d <branch-name>
git worktree prune
```

## Windows（WSL）での注意事項

- `\\wsl.localhost\Ubuntu\...`のようなUNCパス経由では`husky`や`prettier`がCMD.EXEで実行されエラーになることがある
- Git操作やnpmスクリプトはWSLターミナル内（`/home/<user>/...`）で実行する
- やむをえない場合は`git commit --no-verify`を使用し、CIでの検証に委ねる

## PR 前チェック

```bash
npm run lint
npm test
```

変更範囲に応じて、次も実行:

```bash
npm run agents:validate
npm run skills:validate
```
