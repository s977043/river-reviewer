# tests/helpers/

テスト間で重複していた一時ディレクトリ生成・git リポジトリ構築・CLI 起動・Riverbed Memory 初期化のヘルパーを集約する場所。

## 方針

- **既存の重複を吸収**することが目的。将来のための抽象化を先取りしない
- **Node 標準 API のみ**で実装する。外部依存（tmp, tempy 等）は追加しない
- 全ヘルパーは副作用を呼び出し側から制御できるよう、`withXxx(fn)` の callback 版と `createXxx() + cleanup()` の手動版を併記する

## 提供しているヘルパー

| ファイル        | 主な API                                                                           |
| --------------- | ---------------------------------------------------------------------------------- |
| `temp-dir.mjs`  | `createTempDir()`, `cleanupTempDir()`, `withTempDir(fn)`                           |
| `temp-repo.mjs` | `createTempGitRepo(opts)`, `createRepoWithSilentCatchChange()`, `runGit()`         |
| `cli.mjs`       | `runCliAsSubprocess(argv, opts)`, `runCliInProcess(argv, opts)`                    |
| `memory.mjs`    | `createTempMemory({ layout, entries })`, `makeMemoryEntry()`, `writeMemoryIndex()` |

## CLI ヘルパーの使い分け

| 状況                                                  | 使うヘルパー              |
| ----------------------------------------------------- | ------------------------- |
| 通常のアサーション（stdout/stderr/exit code）         | `runCliInProcess`（速い） |
| process 終了ロジック / ネイティブモジュール読込の検証 | `runCliAsSubprocess`      |

`runCliInProcess` は `src/cli.mjs` が `main()` を export している前提で動作する。初回呼び出し時に `cli.mjs` を動的 import し、その結果はモジュールスコープにキャッシュして後続のテストで再利用する。テスト間の副作用は `withProcessOverrides`（env/argv/cwd のスナップショット・復元）と `captureConsole`（console.\* の差し替え）で隔離する。

## 環境変数・CWD の扱い

`runCliInProcess` は内部で `process.env` / `process.argv` / `process.cwd` を一時的に差し替える。テスト終了時に必ず元の値に戻すので、呼び出し側が追加で cleanup する必要はない。

## stdio 差し替えに関する注意

`captureConsole` は `console.log` / `console.error` / `console.warn` / `console.info` のみを差し替える。`process.stdout.write` / `process.stderr.write` は**差し替えない**（node:test ランナー自身が TAP 出力に使っているため、ここを横取りすると後続のサブテストが silently drop される）。`src/cli.mjs` の出力はほぼ console 経由なので問題はないが、`src/lib/agent-skill-bridge.mjs` などで直接 `process.stderr.write` しているケースはキャプチャされず実 stderr に出る。テストのアサーションはこの点を前提に組むこと。

## 重複排除前の Before/After

```javascript
// Before: tests/riverbed-memory.test.mjs で独自定義
function tmpIndex() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rr-memory-'));
  return { dir, indexPath: path.join(dir, 'index.json') };
}
function cleanup(dir) {
  fs.rmSync(dir, { recursive: true });
}

// After: helpers から import
import { createTempMemory } from '../helpers/memory.mjs';
const { dir, indexPath, cleanup } = createTempMemory({ layout: 'flat' });
```
