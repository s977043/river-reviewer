# Dist Check Rebuild Guide

`runners/github-action/dist/` は `npm run build:action` により ncc で事前 bundle される。`test.yml` の `Action dist freshness` ジョブはこの dist が最新の src と一致することを検証する。

## 問題

このリポジトリでは、ncc bundle 出力が Node major version によって異なることが経験的に観測されている。ローカルと CI で Node major が異なると、同一 src からでも異なる bundle が生成され、`Action dist freshness` の false positive fail を引き起こす。

過去の rebuild コミット:

- `fc1c019 chore(action): rebuild dist after main updates`
- `#491 chore(action): rebuild github-action dist`

契機となった最近のセッション:

- `#528` 準備中にローカル Node 25 で rebuild したところ CI Node 22 と出力が食い違い、Node 22 で再度 rebuild し直した

## Node version の SSoT

リポジトリルートの `.nvmrc` が唯一の真実。現時点では `22.22.2` が pin されている。workflow 側の `node-version: 22.x` はこれを緩く参照しているだけ。

```bash
cat .nvmrc
# → 22.22.2
```

## ローカル rebuild 手順

### 1. Node を `.nvmrc` に合わせる

```bash
# nvm
nvm use              # .nvmrc を自動参照

# volta (.nvmrc を読む場合は自動、そうでなければ明示)
volta pin node@"$(cat .nvmrc)"

# asdf
asdf install nodejs "$(cat .nvmrc)"
asdf local nodejs "$(cat .nvmrc)"
```

nvm/volta/asdf いずれも使っていない場合、`node -v` で version を確認し、homebrew / fnm / 手動インストールで `.nvmrc` のバージョンに合わせる。

### 2. 依存を解決して rebuild

```bash
npm ci
npm run build:action
```

### 3. 差分を確認して commit

```bash
git diff --stat runners/github-action/dist/
git add runners/github-action/dist/
git commit -m "chore(action): rebuild github-action dist"
```

## いつ rebuild が必要か

以下のいずれかを触った場合:

- `runners/github-action/src/**`
- `runners/github-action/src/index.mjs` から import される `src/**` のモジュール
- `package.json` / `package-lock.json` の ncc 依存 (`@vercel/ncc` 自体の bump、または bundle 対象に入る dependency の bump)

## トラブルシューティング

| 症状                                                                            | 原因                             | 対応                                             |
| ------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------ |
| ローカルで `git diff --quiet runners/github-action/dist/` は通るのに CI で fail | ローカル Node が `.nvmrc` と違う | `nvm use` で揃えて再 build                       |
| rebuild しても差分が残り続ける                                                  | `node_modules` が stale          | `npm ci` で依存再解決後に `npm run build:action` |
| `index.mjs.map` のみの大量差分                                                  | sourcemap の決定論性問題         | Node を `.nvmrc` に揃えれば通常解消              |

## 関連

- CLAUDE.md § AI Misoperation Guards — "Match CI Node version for dist rebuilds"
- `.nvmrc` — リポジトリ Node version の SSoT
- `.github/workflows/test.yml` — `dist-check` ジョブ定義
- `runners/github-action/package.json` — `build:action` スクリプト
