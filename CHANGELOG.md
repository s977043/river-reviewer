# Changelog

## [0.20.1](https://github.com/s977043/river-reviewer/compare/v0.20.0...v0.20.1) (2026-04-26)


### Bug Fixes

* **guards:** correct rebase bash example and peerDeps check recommendation ([#684](https://github.com/s977043/river-reviewer/issues/684)) ([613f129](https://github.com/s977043/river-reviewer/commit/613f129fe512f2a614961011e713ccd93cf057fe))

## [0.20.0](https://github.com/s977043/river-reviewer/compare/v0.19.0...v0.20.0) (2026-04-26)


### Features

* **github:** add inline_comments input for per-line review comments ([#675](https://github.com/s977043/river-reviewer/issues/675)) ([45c63d2](https://github.com/s977043/river-reviewer/commit/45c63d255efe79678fdd028c8a970f6e1c78fe91))
* **node-api:** add concurrency limit to parallel skill execution ([#678](https://github.com/s977043/river-reviewer/issues/678)) ([dc238b8](https://github.com/s977043/river-reviewer/commit/dc238b88842f9849ad48ca31d243fd94fc015637))
* **node-api:** implement AI provider execution in review() and evaluateSkill() ([#655](https://github.com/s977043/river-reviewer/issues/655)) ([ad9c295](https://github.com/s977043/river-reviewer/commit/ad9c2953bf8e4ef633fc190bcc93fb911870bff9))
* **node-api:** improve per-file finding attribution in parseFindings ([#679](https://github.com/s977043/river-reviewer/issues/679)) ([1b46c64](https://github.com/s977043/river-reviewer/commit/1b46c64b06a91b066c406a6cbf8d2944edbf9992)), closes [#657](https://github.com/s977043/river-reviewer/issues/657)
* **review:** add P1/P2/P3/P4 priority display to markdown output ([#677](https://github.com/s977043/river-reviewer/issues/677)) ([56eb93d](https://github.com/s977043/river-reviewer/commit/56eb93d1a589462101efd3cd70ed2b09a0b8cdfb))
* **skills:** add Greptile-inspired cross-context core skills ([fb18e7f](https://github.com/s977043/river-reviewer/commit/fb18e7ff80e469e281879c6f53a9a1e5b9acdc77))
* **skills:** add Greptile-inspired cross-context core skills ([#654](https://github.com/s977043/river-reviewer/issues/654)) ([3a36d5a](https://github.com/s977043/river-reviewer/commit/3a36d5a12cf2d1b58a2d6ad7296c206d4a48008a))
* **skills:** add Greptile-inspired cross-context core skills ([#654](https://github.com/s977043/river-reviewer/issues/654)) ([d192cc9](https://github.com/s977043/river-reviewer/commit/d192cc9c2b8dd52f16732a97cc3b3c3321ec8b13))

## [0.19.0](https://github.com/s977043/river-reviewer/compare/v0.18.0...v0.19.0) (2026-04-26)


### Features

* **eval:** add Phase 3 skill fixtures for typescript-nullcheck and typescript-strict ([#648](https://github.com/s977043/river-reviewer/issues/648)) ([bbc0b61](https://github.com/s977043/river-reviewer/commit/bbc0b612e148127eb9a3fd332e608b496f6ad82a))

## [0.18.0](https://github.com/s977043/river-reviewer/compare/v0.17.2...v0.18.0) (2026-04-25)


### Features

* **eval:** enable skill eval CI gate (Phase 3) ([#646](https://github.com/s977043/river-reviewer/issues/646)) ([92c26ee](https://github.com/s977043/river-reviewer/commit/92c26eef3455fb4ee751c14fc8729fce923bf9c3))

## [0.17.2](https://github.com/s977043/river-reviewer/compare/v0.17.1...v0.17.2) (2026-04-25)


### Bug Fixes

* **eval:** redirect sub-eval progress to stderr to fix nightly CI ([#642](https://github.com/s977043/river-reviewer/issues/642)) ([495a76b](https://github.com/s977043/river-reviewer/commit/495a76b4e073fa72199959333aa348bdaa6be134))

## [0.17.1](https://github.com/s977043/river-reviewer/compare/v0.17.0...v0.17.1) (2026-04-25)


### Bug Fixes

* **lychee:** exclude GitHub compare URLs from link checking ([#640](https://github.com/s977043/river-reviewer/issues/640)) ([ec88a6a](https://github.com/s977043/river-reviewer/commit/ec88a6ae153ccb87fe17b530c8cdf2bba6ec712e))

## [0.17.0](https://github.com/s977043/river-reviewer/compare/v0.16.0...v0.17.0) (2026-04-25)


### Features

* **eval:** add Re-review / Regression Review with finding fingerprints ([#621](https://github.com/s977043/river-reviewer/issues/621)) ([#634](https://github.com/s977043/river-reviewer/issues/634)) ([515f51d](https://github.com/s977043/river-reviewer/commit/515f51d40f4528650301055080fe419a0ab8c2f3))
* **eval:** add Review Result Store and Dashboard ([#620](https://github.com/s977043/river-reviewer/issues/620)) ([#635](https://github.com/s977043/river-reviewer/issues/635)) ([6abd0ae](https://github.com/s977043/river-reviewer/commit/6abd0aeeb5239079609da89eeb8db9f61cf0fe9f))
* **review:** add parallel Reviewer Orchestration layer ([#622](https://github.com/s977043/river-reviewer/issues/622)) ([#633](https://github.com/s977043/river-reviewer/issues/633)) ([a7cdd33](https://github.com/s977043/river-reviewer/commit/a7cdd33a927e98dfc0f47f3da5b312a61881015c))


### Bug Fixes

* **finding-classifier:** apply ruleId=unknown guard to deduplicateWithinFile ([#631](https://github.com/s977043/river-reviewer/issues/631)) ([06ea25e](https://github.com/s977043/river-reviewer/commit/06ea25eaa0eb47405568a81a4c652b6a8532f374))

## [0.16.0](https://github.com/s977043/river-reviewer/compare/v0.15.0...v0.16.0) (2026-04-25)


### Features

* **finding-classifier:** add noise control layer with classify pipeline ([#617](https://github.com/s977043/river-reviewer/issues/617)) ([f7fc882](https://github.com/s977043/river-reviewer/commit/f7fc882e963e6b164d9e7a3d25b3f84e27dea997))
* **review:** add review depth control based on PR size ([#619](https://github.com/s977043/river-reviewer/issues/619)) ([9129998](https://github.com/s977043/river-reviewer/commit/9129998663dd16b7608ef994f370ec54f483d597))
* **scoring:** add finding score breakdown ([#618](https://github.com/s977043/river-reviewer/issues/618)) ([1d67c56](https://github.com/s977043/river-reviewer/commit/1d67c56b24ef5cd0181265efa56f40a0c4727249))

## [0.15.0](https://github.com/s977043/river-reviewer/compare/v0.14.2...v0.15.0) (2026-04-23)


### Features

* **review:** introduce Finding Pipeline with structured findings ([#624](https://github.com/s977043/river-reviewer/issues/624)) ([dc8a17c](https://github.com/s977043/river-reviewer/commit/dc8a17c89b3c5b5147700dc13223517efeae5e92))

## [0.14.2](https://github.com/s977043/river-reviewer/compare/v0.14.1...v0.14.2) (2026-04-23)


### Bug Fixes

* **codex:** replace invalid approval_policy `full-auto` with `on-request` ([#609](https://github.com/s977043/river-reviewer/issues/609)) ([26af19b](https://github.com/s977043/river-reviewer/commit/26af19b3505bab903244809a10a5d61ff94ba6bc))
* **docs:** bump action tag references to v0.14.1 ([#610](https://github.com/s977043/river-reviewer/issues/610)) ([9d2cfaa](https://github.com/s977043/river-reviewer/commit/9d2cfaa9c55e065a6031dc3b9e929b064ccb9274))
* **docs:** correct CHANGELOG compare URL for v0.14.0 ([#614](https://github.com/s977043/river-reviewer/issues/614)) ([7abfec9](https://github.com/s977043/river-reviewer/commit/7abfec910401c43ccabc711d93e12705b84aa62f))

## [0.14.1](https://github.com/s977043/river-reviewer/compare/v0.14.0...v0.14.1) (2026-04-18)


### Bug Fixes

* **release-please:** emit plain tag format and guard alias generation ([#597](https://github.com/s977043/river-reviewer/issues/597)) ([#598](https://github.com/s977043/river-reviewer/issues/598)) ([2de682a](https://github.com/s977043/river-reviewer/commit/2de682ad13a5dc6d7054e392a2444cbb93983d07))

## [0.14.0](https://github.com/s977043/river-reviewer/compare/v0.13.1...v0.14.0) (2026-04-18)


### Features

* **action:** bundle GitHub Action with ncc to eliminate cold start ([1702ba2](https://github.com/s977043/river-reviewer/commit/1702ba229f5f6dbbce9bb305d40e6e64501e2459))
* **action:** bundle GitHub Action with ncc to eliminate cold start ([#394](https://github.com/s977043/river-reviewer/issues/394)) ([20c68fe](https://github.com/s977043/river-reviewer/commit/20c68fe79b7b4193902068d198dafc29e80fbe2e))
* add availability and communication skills ([62c65c9](https://github.com/s977043/river-reviewer/commit/62c65c94fa0e83ec873a2c6983c1a15048b2930f))
* add availability and communication skills ([674decf](https://github.com/s977043/river-reviewer/commit/674decfe0e3b104061e2de8f3989f5caafd23b7e))
* add availability and communication skills ([652a768](https://github.com/s977043/river-reviewer/commit/652a7681a53eb1217af9ba6797cf22edfbb86bbd))
* add Claude Code best practices (hooks, commands, enhanced CLAUDE.md) ([85c7b56](https://github.com/s977043/river-reviewer/commit/85c7b5689cb2abf0ba70f480df2fc6ce75d1a16f))
* add Claude Code best practices (hooks, commands, enhanced CLAUDE.md) ([#290](https://github.com/s977043/river-reviewer/issues/290)) ([feb3879](https://github.com/s977043/river-reviewer/commit/feb3879d6496fe5dec8b89c99d105b43a7ed7451))
* add comprehensive link checking system ([#255](https://github.com/s977043/river-reviewer/issues/255)) ([25c1a15](https://github.com/s977043/river-reviewer/commit/25c1a1541e1f0d1aab3bdae4f591696c60011c26))
* add comprehensive link checking system with security validation ([#256](https://github.com/s977043/river-reviewer/issues/256)) ([718e3ff](https://github.com/s977043/river-reviewer/commit/718e3ff32c3d662615f5cf7331096fa416dc88bf))
* add config file review skill and improve fallback messages ([102dab0](https://github.com/s977043/river-reviewer/commit/102dab03da191b8157d37a8323ea9b953f44f031))
* add configurable review config loader ([c3a307c](https://github.com/s977043/river-reviewer/commit/c3a307cddf869a0717c47dabdd1b5bac4406bd43))
* add Copilot instructions and agents to integrate with skills ([3c6642b](https://github.com/s977043/river-reviewer/commit/3c6642b46baddc536728b1b4fbae5a6544af073e))
* add Copilot instructions and agents to integrate with skills ([3c1d6c6](https://github.com/s977043/river-reviewer/commit/3c1d6c6560525cb8b0ea6cfed9f0ba88df25c0fb))
* add create-skill scaffolding tool ([#229](https://github.com/s977043/river-reviewer/issues/229)) ([#236](https://github.com/s977043/river-reviewer/issues/236)) ([6e7981c](https://github.com/s977043/river-reviewer/commit/6e7981c8fe412693545cd24fd5cf6913d5198c35))
* add GitHub Actions security heuristics ([#253](https://github.com/s977043/river-reviewer/issues/253)) ([4d96072](https://github.com/s977043/river-reviewer/commit/4d9607297aa86774a4bd7874f931a5f2fc3992dc))
* add skill-eval CI workflow and migrate logging-observability skill ([#259](https://github.com/s977043/river-reviewer/issues/259)) ([f4ea416](https://github.com/s977043/river-reviewer/commit/f4ea4163947b35a3d62ca894b37d144eb5fd24b7))
* add skill.yaml specification and template ([#226](https://github.com/s977043/river-reviewer/issues/226)) ([#234](https://github.com/s977043/river-reviewer/issues/234)) ([2a3ce1f](https://github.com/s977043/river-reviewer/commit/2a3ce1fd494768d636feec19818902f53bc6d64e))
* add skills README and registry ([#230](https://github.com/s977043/river-reviewer/issues/230)) ([#237](https://github.com/s977043/river-reviewer/issues/237)) ([7f8de2e](https://github.com/s977043/river-reviewer/commit/7f8de2e53fc6190d1328e64aec078dd4c1964056))
* add stability labels and meta-consistency CI check ([fd0775c](https://github.com/s977043/river-reviewer/commit/fd0775cfc5356350fa47715c0d4a0a7e03aa3fb1))
* add upstream api versioning compatibility skill ([372b896](https://github.com/s977043/river-reviewer/commit/372b896d68886a610d0b33acb254ee1b02a7b47b))
* add upstream api versioning compatibility skill ([ebb6171](https://github.com/s977043/river-reviewer/commit/ebb61712915e309d4bbe22da6904b30777799795))
* add upstream dr multiregion skill ([5f3487f](https://github.com/s977043/river-reviewer/commit/5f3487f6c0fa4d51420c28f2ccaa44a9d67c6f0c))
* add upstream dr multiregion skill ([61afd60](https://github.com/s977043/river-reviewer/commit/61afd609766d2aba4fd65aff471bbea0035495b1))
* add Zod schema and validation for skill.yaml ([#227](https://github.com/s977043/river-reviewer/issues/227)) ([#235](https://github.com/s977043/river-reviewer/issues/235)) ([39955b4](https://github.com/s977043/river-reviewer/commit/39955b49b19a2a3ec8375ad6d11bab2225dca915))
* **agent-skills:** add 5 routing agent skills for river-reviewer ([d17728f](https://github.com/s977043/river-reviewer/commit/d17728f7ebdc8c8b128b53684b5e3e780379b4be))
* **agent-skills:** add 5 routing agent skills for river-reviewer ([da7e7fe](https://github.com/s977043/river-reviewer/commit/da7e7feac42e0779fdf31b49b2eb11ee4f7876fd))
* **ci:** add meta-consistency validation script and CI job ([#398](https://github.com/s977043/river-reviewer/issues/398)) ([a89b905](https://github.com/s977043/river-reviewer/commit/a89b905e094a726855af8b46a4cd5858f2350eac))
* **ci:** add nightly eval workflow for review quality monitoring ([#458](https://github.com/s977043/river-reviewer/issues/458)) ([daa0833](https://github.com/s977043/river-reviewer/commit/daa0833d8515307ef49d0a51ddfd4ebff59db5bb))
* **ci:** add PlanGate PR review workflow (closes [#521](https://github.com/s977043/river-reviewer/issues/521)) ([#572](https://github.com/s977043/river-reviewer/issues/572)) ([d6b5405](https://github.com/s977043/river-reviewer/commit/d6b540566d7499dcd98c47cab275e976366cfc0b))
* **ci:** add weekly GC workflow for deterministic maintenance checks ([#570](https://github.com/s977043/river-reviewer/issues/570)) ([a01992f](https://github.com/s977043/river-reviewer/commit/a01992f583da029e9c30be6931c1db02191acc94)), closes [#522](https://github.com/s977043/river-reviewer/issues/522)
* **ci:** introduce setup-node-deps composite action and apply CI best practices ([#528](https://github.com/s977043/river-reviewer/issues/528)) ([39fe95f](https://github.com/s977043/river-reviewer/commit/39fe95f252fcb5e8f2d37ec688f648848b4bd7ed))
* **commands:** add /preflight to verify task state before multi-PR work ([#501](https://github.com/s977043/river-reviewer/issues/501)) ([6268549](https://github.com/s977043/river-reviewer/commit/62685491e47387977cd430d6edf22eced8e787a2))
* **dry-run:** ヒューリスティック対応スキルのみ dry-run で実行 ([3f23b9b](https://github.com/s977043/river-reviewer/commit/3f23b9b9fc191dce312e83adf977055366c3943d))
* **eval:** add eval ledger section to PR template ([#454](https://github.com/s977043/river-reviewer/issues/454)) ([5e0ba5c](https://github.com/s977043/river-reviewer/commit/5e0ba5c3cc11cb15857063f7221adcab64d28a03)), closes [#438](https://github.com/s977043/river-reviewer/issues/438)
* **eval:** add failure taxonomy and categorized fixture reports ([#419](https://github.com/s977043/river-reviewer/issues/419)) ([707a8ec](https://github.com/s977043/river-reviewer/commit/707a8ec60197d0dd32aadd60ffb283e974cc6688))
* **eval:** add unified evaluation runner and experiment ledger ([#413](https://github.com/s977043/river-reviewer/issues/413)) ([980e0bc](https://github.com/s977043/river-reviewer/commit/980e0bc9f7650e26d7204cfa66091f9885ddf080))
* **evals:** add nightly measure and audit pipeline ([#433](https://github.com/s977043/river-reviewer/issues/433)) ([1c802fc](https://github.com/s977043/river-reviewer/commit/1c802fca42effc2b4ff66a613999cce20ef098e0))
* **evals:** add risk-map and memory-fallback regression eval fixtures ([#469](https://github.com/s977043/river-reviewer/issues/469)) ([3ddc973](https://github.com/s977043/river-reviewer/commit/3ddc973343fdeef3c9f8005d1531f7fa81554443)), closes [#435](https://github.com/s977043/river-reviewer/issues/435)
* **eval:** structured fixture results and multi-axis metrics ([#417](https://github.com/s977043/river-reviewer/issues/417)) ([f261995](https://github.com/s977043/river-reviewer/commit/f261995ad9a9a0130483b1ce7a8c4cfb65e37a67))
* expand permission settings based on actual usage patterns ([791b868](https://github.com/s977043/river-reviewer/commit/791b8688517c2eb30bd9fc5e72876e8a748ea467))
* expand upstream architecture review skills ([9e484bb](https://github.com/s977043/river-reviewer/commit/9e484bbb70d6b921d8cf4ed6b09059598e32252e))
* expand upstream architecture review skills ([a6bf571](https://github.com/s977043/river-reviewer/commit/a6bf571bd72969b37d38727bf41eafcdc0568f38))
* implement Skill-based Architecture ([#205](https://github.com/s977043/river-reviewer/issues/205)) ([ff82ba0](https://github.com/s977043/river-reviewer/commit/ff82ba03705685f48acfd69d2947eca71a618f28))
* **memory:** add GitHub Artifact persistence for Riverbed Memory ([#425](https://github.com/s977043/river-reviewer/issues/425)) ([b85fecf](https://github.com/s977043/river-reviewer/commit/b85fecf18dbe46c9f72573e3348a3d0ff159fadc))
* **memory:** add memory-context bridge for pipeline integration ([#432](https://github.com/s977043/river-reviewer/issues/432)) ([e1aee7e](https://github.com/s977043/river-reviewer/commit/e1aee7e76cfaf7eb5ff590a92eedbaa97de390ae))
* **memory:** add Riverbed Memory v1 runtime ([#426](https://github.com/s977043/river-reviewer/issues/426)) ([4e94434](https://github.com/s977043/river-reviewer/commit/4e94434e9fc6edaf94033339d70e0508cc5369b1))
* **output:** add YAML output format with scoring and verdict ([#596](https://github.com/s977043/river-reviewer/issues/596)) ([d613e68](https://github.com/s977043/river-reviewer/commit/d613e681a1a3e39ce3315bc51b3022a9336a35d8))
* **output:** スキル単位で指摘をグループ化 ([7de916f](https://github.com/s977043/river-reviewer/commit/7de916feb3ef1fc602a2a0090bf7d3a3695ed7aa))
* **output:** スキル単位で指摘をグループ化 ([560493c](https://github.com/s977043/river-reviewer/commit/560493c22eec689deb2b37117d711c3ac5868b7e))
* **policy:** add risk map and escalation policy ([#462](https://github.com/s977043/river-reviewer/issues/462)) ([9c560de](https://github.com/s977043/river-reviewer/commit/9c560de80cf3b3a5329c839554a78d792e81c554))
* **policy:** add suppression and resurfacing mechanism ([#434](https://github.com/s977043/river-reviewer/issues/434)) ([4b6029b](https://github.com/s977043/river-reviewer/commit/4b6029b5b9c32d5b048cb8415c3bc38986852a3e))
* progressive disclosure を明示的なスキルローディング原則として導入 ([#459](https://github.com/s977043/river-reviewer/issues/459)) ([37fcb37](https://github.com/s977043/river-reviewer/commit/37fcb374ce8a1e8fab5f5803ab10f08f69f770af))
* **release-please:** auto-sync README version via extra-files ([#592](https://github.com/s977043/river-reviewer/issues/592)) ([#593](https://github.com/s977043/river-reviewer/issues/593)) ([6503ce8](https://github.com/s977043/river-reviewer/commit/6503ce8177b8cea4be7dbe90eb2dc1a31b1ace1f))
* **review:** add ADR/spec linker and dependency impact analyzer ([#423](https://github.com/s977043/river-reviewer/issues/423)) ([0873e05](https://github.com/s977043/river-reviewer/commit/0873e05100f2b8c81270e115110eb681f9c20537))
* **review:** add changed-files classifier ([#420](https://github.com/s977043/river-reviewer/issues/420)) ([9ba8b06](https://github.com/s977043/river-reviewer/commit/9ba8b064563a1b81227d9790cfb69c7b74af8f95))
* **review:** add rule-based finding verifier ([#418](https://github.com/s977043/river-reviewer/issues/418)) ([9cfc28e](https://github.com/s977043/river-reviewer/commit/9cfc28e9550f833286688b24c4566020127d568f))
* **review:** add test impact analyzer and config risk detector ([#422](https://github.com/s977043/river-reviewer/issues/422)) ([f74645b](https://github.com/s977043/river-reviewer/commit/f74645b7981e7edd9798ba4e9d52d3e1e43205ad))
* **review:** integrate adr-linker into review pipeline ([#456](https://github.com/s977043/river-reviewer/issues/456)) ([1a35681](https://github.com/s977043/river-reviewer/commit/1a35681092a26bffed0bb359b91707943a100034))
* **review:** integrate file-classifier into execution plan ([#427](https://github.com/s977043/river-reviewer/issues/427)) ([3544e4e](https://github.com/s977043/river-reviewer/commit/3544e4e74c42e8705ad3f51d8253790b567bc73b))
* **review:** integrate file-classifier into verifier with debug output ([#457](https://github.com/s977043/river-reviewer/issues/457)) ([e1d3f42](https://github.com/s977043/river-reviewer/commit/e1d3f427e3c51a6d55e8ddb4171e6d516f31252f))
* **review:** integrate verifier into review pipeline ([#430](https://github.com/s977043/river-reviewer/issues/430)) ([4d84bdc](https://github.com/s977043/river-reviewer/commit/4d84bdc01b94aa6b6ab2a71eefb66073b0c55806))
* Riverbed Memory v1 ライフサイクルと置換モデルを実装 ([#474](https://github.com/s977043/river-reviewer/issues/474)) ([f222087](https://github.com/s977043/river-reviewer/commit/f222087ac54f8243dd517045923bf89d56270aff))
* **runner:** enable runtime loading of agent-skills ([658c39e](https://github.com/s977043/river-reviewer/commit/658c39e9def36f7827e744aa6f13394162ae4ffd))
* **runner:** enable runtime loading of agent-skills and update audit script ([01fc8a2](https://github.com/s977043/river-reviewer/commit/01fc8a20f9f7decf83fe3cff951ec22189f4e3b5))
* **schema:** add review-audit to outputKind enum (closes [#585](https://github.com/s977043/river-reviewer/issues/585)) ([#587](https://github.com/s977043/river-reviewer/issues/587)) ([1559408](https://github.com/s977043/river-reviewer/commit/155940864e40d92b5ae7b7e7c949881ce994c6a9))
* **scripts:** add review severity gate evaluator ([#401](https://github.com/s977043/river-reviewer/issues/401)) ([667094a](https://github.com/s977043/river-reviewer/commit/667094a42c761b4dd955f08ad3fca2d01882962f))
* **skill:** add PlanGate evals fixtures (closes [#523](https://github.com/s977043/river-reviewer/issues/523)) ([#574](https://github.com/s977043/river-reviewer/issues/574)) ([ef3f386](https://github.com/s977043/river-reviewer/commit/ef3f386d884fb0fa065fc231ae56f166f662f144))
* **skill:** add plangate-exec-conformance spec ([#561](https://github.com/s977043/river-reviewer/issues/561)) ([de20ba1](https://github.com/s977043/river-reviewer/commit/de20ba121e298a6638e250df0f965a25c8c8df97)), closes [#520](https://github.com/s977043/river-reviewer/issues/520)
* **skill:** add plangate-plan-integrity spec ([#560](https://github.com/s977043/river-reviewer/issues/560)) ([448ecb9](https://github.com/s977043/river-reviewer/commit/448ecb9ef70edad67bfe85c7b425bc0ad3cda69d))
* **skills:** add adversarial review skills (Pre-mortem, War Game, Logic Torturing) ([#372](https://github.com/s977043/river-reviewer/issues/372)) ([baa3bc6](https://github.com/s977043/river-reviewer/commit/baa3bc6127f272302b7d24d924a45b5d70ea00dc))
* **skills:** add Agent Skills (SKILL.md) import/export bridge ([#349](https://github.com/s977043/river-reviewer/issues/349)) ([305f14c](https://github.com/s977043/river-reviewer/commit/305f14c4b610b90e8ff45afd88fdb1d516c7584a))
* **skills:** add architecture-validation-plan skill ([#260](https://github.com/s977043/river-reviewer/issues/260)) ([b959c56](https://github.com/s977043/river-reviewer/commit/b959c56d60207e5b0e24ebe663b6eb4d6999dca9))
* **skills:** add cache-strategy-consistency skill ([#262](https://github.com/s977043/river-reviewer/issues/262)) ([99b336c](https://github.com/s977043/river-reviewer/commit/99b336c13e4310c179ada9b35bdcf143ccc71fc0))
* **skills:** add Claude Code skill management skills ([#380](https://github.com/s977043/river-reviewer/issues/380)) ([8fae238](https://github.com/s977043/river-reviewer/commit/8fae238e8bc3f9b626361ca3ee11366619bffac8))
* **skills:** add entry skill river-reviewer ([bacaef1](https://github.com/s977043/river-reviewer/commit/bacaef1b3ace05911fa2ce7f26c8304d4b9a07ed))
* **skills:** add entry skill river-reviewer ([ece1790](https://github.com/s977043/river-reviewer/commit/ece1790371a44ba1b6d6245e1d80475ab8fe2b72)), closes [#313](https://github.com/s977043/river-reviewer/issues/313)
* **skills:** add Inversion+Pipeline pattern to all skills ([#399](https://github.com/s977043/river-reviewer/issues/399)) ([e0ec61b](https://github.com/s977043/river-reviewer/commit/e0ec61b463f90f07ad0f2a5b7752200ad16fca82))
* **skills:** add multitenancy-isolation skill ([#261](https://github.com/s977043/river-reviewer/issues/261)) ([685280b](https://github.com/s977043/river-reviewer/commit/685280b41fff3671f8cb6dd8f0b83db6db6fbeef))
* **skills:** add security-privacy-design skill ([#264](https://github.com/s977043/river-reviewer/issues/264)) ([e9edfef](https://github.com/s977043/river-reviewer/commit/e9edfefd5dd2441985c7899fdc7a15410921691a))
* **skills:** add SKILL.md and references templates ([c7492d3](https://github.com/s977043/river-reviewer/commit/c7492d3afecc5821f8a1a57d88234b5c6ff83b59))
* **skills:** add SKILL.md and references templates ([dcb550a](https://github.com/s977043/river-reviewer/commit/dcb550a979112c191008bc4234417c21405b6a47)), closes [#311](https://github.com/s977043/river-reviewer/issues/311)
* **skills:** add skills audit script and report ([595be07](https://github.com/s977043/river-reviewer/commit/595be07911411ddab003fea6dc9439fc96cb7e38))
* **skills:** add skills audit script and report ([7ac29b4](https://github.com/s977043/river-reviewer/commit/7ac29b4975059ab63c1e323e8bd21bd955eab3db)), closes [#309](https://github.com/s977043/river-reviewer/issues/309)
* **skills:** add test scaffolding skills for Laravel, Next.js, React, Remix, and Vue.js ([6a10d80](https://github.com/s977043/river-reviewer/commit/6a10d8035c3d13a61537f49b0c0f25ed01eeb880))
* **skills:** add test scaffolding skills for Laravel, Next.js, React, Remix, and Vue.js ([956ae40](https://github.com/s977043/river-reviewer/commit/956ae40d194e330d98296209be055c6f41ac95cd))
* **skills:** Agent Skills (SKILL.md) bridge with review enhancements ([#350](https://github.com/s977043/river-reviewer/issues/350)) ([93c4ba5](https://github.com/s977043/river-reviewer/commit/93c4ba58ec46869ce342e0659afed178a9c5a3c1))
* **skills:** スキル管理スキルに5パターン設計システムを導入 ([#382](https://github.com/s977043/river-reviewer/issues/382)) ([9fa274a](https://github.com/s977043/river-reviewer/commit/9fa274a2efbe724380c3f6c5279292576d4bfe4d))
* support skill.yaml directory structure in skill loader ([#239](https://github.com/s977043/river-reviewer/issues/239)) ([8041f07](https://github.com/s977043/river-reviewer/commit/8041f07fe2d9ae111b5f132e147ff67ec44615ca))
* support skipping by PR labels and document config ([d350072](https://github.com/s977043/river-reviewer/commit/d3500728b5c259ead121a686783770a2d3dc7377))
* レビュー基盤改善と敵対的レビュースキルの追加 ([#371](https://github.com/s977043/river-reviewer/issues/371)) ([a4595b2](https://github.com/s977043/river-reviewer/commit/a4595b2e2267cc27c700da365daa863e5bb4efbb))
* 型駆動設計ガードとレビュー自動化境界ガードを追加 ([#352](https://github.com/s977043/river-reviewer/issues/352)) ([3616261](https://github.com/s977043/river-reviewer/commit/3616261bf59d47bb048851b7856fb4c5ae3e145a))
* 構造化レビューアーティファクトスキーマを追加 ([#460](https://github.com/s977043/river-reviewer/issues/460)) ([0cf1e2f](https://github.com/s977043/river-reviewer/commit/0cf1e2f13ecba2fcb89cbf80f58053d8803f0d2c))
* 評価を多次元レビュールーブリックに拡張 ([#470](https://github.com/s977043/river-reviewer/issues/470)) ([fc6bba6](https://github.com/s977043/river-reviewer/commit/fc6bba678e3f168bea51736a83f7793d65b62b83))


### Bug Fixes

* address additional review comments ([22800e1](https://github.com/s977043/river-reviewer/commit/22800e192b94673ab0435aebcba3cbd6c219be68))
* address CI lint errors (MD012, MD004) and review feedback (security, robustness) ([7c52477](https://github.com/s977043/river-reviewer/commit/7c5247762b20bb4b941c884c4416e246f6c274ca))
* address Copilot review comments for scheduled validation workflows ([4d04932](https://github.com/s977043/river-reviewer/commit/4d04932be4ba2b7b18c43d4255c510be0e5da19e))
* address PR [#237](https://github.com/s977043/river-reviewer/issues/237) review feedback ([#238](https://github.com/s977043/river-reviewer/issues/238)) ([a7581a8](https://github.com/s977043/river-reviewer/commit/a7581a85081590ecb72c94cb4e625193ea661a92))
* address review comments (formatting, portability, command accuracy) ([28fa267](https://github.com/s977043/river-reviewer/commit/28fa267e8bfaccd3b3a3bec17d4d2f6a7e46980d))
* address review comments on AGENTS.md ([f21474c](https://github.com/s977043/river-reviewer/commit/f21474cc0a9f33b93b5088fb9c25fb1f855bde7b))
* address review comments on PR [#201](https://github.com/s977043/river-reviewer/issues/201) ([1460117](https://github.com/s977043/river-reviewer/commit/14601176aa914c0cf369b1f8becb44a769231a4d))
* address review comments on templates ([1e3159e](https://github.com/s977043/river-reviewer/commit/1e3159e12f169c15158c54f59e7c78063bbde337))
* **agent-skills:** add missing References section to 4 routing agent skills ([c3f5a51](https://github.com/s977043/river-reviewer/commit/c3f5a51dec1b1cdb0efd751c9ba5f1b480f0c2de))
* **agent-skills:** address PR [#378](https://github.com/s977043/river-reviewer/issues/378) review comments on routing skills ([72ab2e5](https://github.com/s977043/river-reviewer/commit/72ab2e566d991179e2b96ff8a5ad121e6bc6169a))
* **agent-skills:** address PR review comments on routing skills ([2d2c1ff](https://github.com/s977043/river-reviewer/commit/2d2c1ffb480107b3f292eab88f05ba9a13543508))
* **agent-skills:** fix remaining short-form skill ID in testing ROUTING.md ([d2be57d](https://github.com/s977043/river-reviewer/commit/d2be57d259b7af9269a544923f1061dbec1907d1))
* **agent-skills:** fix severity validation and exclude routing skills from planner ([bc2a55c](https://github.com/s977043/river-reviewer/commit/bc2a55cc52b3d346c7d95ed1afce80fe2d2178d2))
* agents.md dead link and root allowlist cleanup ([#360](https://github.com/s977043/river-reviewer/issues/360)) ([47df063](https://github.com/s977043/river-reviewer/commit/47df063a9ccbf93a65b055016aa6b745aefed5c7))
* apply prettier formatting to check.md ([3496334](https://github.com/s977043/river-reviewer/commit/34963343301cd26309fb9de56405ba0b70a63731))
* apply review feedback - remove redundant code and add comprehensive tests ([d9f39cc](https://github.com/s977043/river-reviewer/commit/d9f39ccc28555f3bb806499de56e2716b6841402))
* avoid merging arrays and objects in config merge ([18eb1ec](https://github.com/s977043/river-reviewer/commit/18eb1ec8c1aeb6634e9cd4a57c48cbd5384d2ebf))
* **ci:** grant id-token: write to unit-tests for codecov OIDC ([#546](https://github.com/s977043/river-reviewer/issues/546)) ([81127bc](https://github.com/s977043/river-reviewer/commit/81127bc14fd25f36804f82aef404f1ddaeb2deb0)), closes [#545](https://github.com/s977043/river-reviewer/issues/545)
* **ci:** ignore CHANGELOG.md in lint ([697417b](https://github.com/s977043/river-reviewer/commit/697417bc66a8d4c2fefda90bf235bf31316b2b19))
* **ci:** update .lychee.toml for latest lychee parser compatibility ([#368](https://github.com/s977043/river-reviewer/issues/368)) ([2d3da5a](https://github.com/s977043/river-reviewer/commit/2d3da5a400fb268e6e0492f1a6c16424a3cb7484))
* **cli:** add --output json mode for severity gate integration ([885084f](https://github.com/s977043/river-reviewer/commit/885084fe4e567a6c02c8a721543a9da04a06eba1))
* **cli:** redirect run header to stderr in json output mode ([fd3c56e](https://github.com/s977043/river-reviewer/commit/fd3c56e9ef202b9e6f9414ee436501410fec7ae8))
* **codex:** address PR review feedback ([b31d901](https://github.com/s977043/river-reviewer/commit/b31d901872ed86b211281d67173e25bdc713cbb5))
* **docs:** bump action tag references to v0.13.0 ([#590](https://github.com/s977043/river-reviewer/issues/590)) ([adf3b7d](https://github.com/s977043/river-reviewer/commit/adf3b7d8c575769b0c89808a96a56143b845c4f9))
* **docs:** clarify that review pipeline is OpenAI-only ([#490](https://github.com/s977043/river-reviewer/issues/490)) ([5fed8c1](https://github.com/s977043/river-reviewer/commit/5fed8c1da37e7c51e9eb47b0b31222bb13e4788c))
* **docs:** correct npm script name eval:skills → eval:fixtures ([4e29419](https://github.com/s977043/river-reviewer/commit/4e29419480312c5c8b039c045c58355bb252ed77))
* **docs:** deduplicate AGENT_LEARNINGS.md and fix broken GEMINI.md reference ([#414](https://github.com/s977043/river-reviewer/issues/414)) ([1194672](https://github.com/s977043/river-reviewer/commit/1194672df27f0bcd3e54ec384e0902676221a0e7))
* **docs:** update project link to repository Projects page to resolve lychee 404 ([#198](https://github.com/s977043/river-reviewer/issues/198)) ([#203](https://github.com/s977043/river-reviewer/issues/203)) ([b9db673](https://github.com/s977043/river-reviewer/commit/b9db673fcd394912372a7bc7fe2fcdb65b66d22a))
* enforce branch policy in agent configuration ([#353](https://github.com/s977043/river-reviewer/issues/353)) ([f54bb6f](https://github.com/s977043/river-reviewer/commit/f54bb6fd1a168c297c08f0f727c6dbfbcf4a5498))
* **eval:** rubric schema scope, direction field, terminology, integrity tests ([#547](https://github.com/s977043/river-reviewer/issues/547)) ([f869ecb](https://github.com/s977043/river-reviewer/commit/f869ecb05e164476f7c683a9689f981edde0daa4)), closes [#481](https://github.com/s977043/river-reviewer/issues/481)
* **evals:** prevent stderr leak and silent failure in nightly-audit ([#472](https://github.com/s977043/river-reviewer/issues/472)) ([#473](https://github.com/s977043/river-reviewer/issues/473)) ([8ba8d8c](https://github.com/s977043/river-reviewer/commit/8ba8d8c9925bde340a704c28e19dc2a8ac4b8754))
* format CHANGELOG.md to pass prettier checks ([889123d](https://github.com/s977043/river-reviewer/commit/889123d04211ab0c2e299abfb01bcaeb693bb29b))
* Git diffのmaxBufferを拡大 ([6088f62](https://github.com/s977043/river-reviewer/commit/6088f62086581f1d859de16e9ae26eb3fbd0d98f))
* Git diffのmaxBufferを拡大 ([f36af63](https://github.com/s977043/river-reviewer/commit/f36af63c6580eb0a376842c0825f3d14f66c1010))
* harden config loader validation ([244fa53](https://github.com/s977043/river-reviewer/commit/244fa53486626553d1c99ca65553377f1b2b9f16))
* improve markdown output format for review findings ([91d09c3](https://github.com/s977043/river-reviewer/commit/91d09c3c21f16261d99ca023b613a2aca5f8bf7a))
* improve markdown output format for review findings ([78f0847](https://github.com/s977043/river-reviewer/commit/78f08471d8d536f378e04cb6cebc7e1fd9894f57))
* increase maxBuffer for large diffs ([db81630](https://github.com/s977043/river-reviewer/commit/db81630bd19b830e49a8fe152de562b51872959a))
* keep vercel root at / ([#213](https://github.com/s977043/river-reviewer/issues/213)) ([19970c0](https://github.com/s977043/river-reviewer/commit/19970c03d057b0cea049acfa88acd19dd9b2e0d8))
* **lint:** add language to fenced code blocks ([3bcaa21](https://github.com/s977043/river-reviewer/commit/3bcaa212b137416b728b3ab685d1fc3ece6ddcbb))
* Markdown インジェクション対策と出力順序の安定化 ([39d0fff](https://github.com/s977043/river-reviewer/commit/39d0fff91d5cadb8f2d49f54ed09e17ce919cecf))
* **meta:** update version refs to v0.10.0 and unify canonical URL ([8bb4dde](https://github.com/s977043/river-reviewer/commit/8bb4dde97b27c06e147f07d1b85b661c7b6e7b8f))
* **meta:** update version refs to v0.10.0 and unify canonical URL ([#391](https://github.com/s977043/river-reviewer/issues/391), [#392](https://github.com/s977043/river-reviewer/issues/392)) ([8bc2a5d](https://github.com/s977043/river-reviewer/commit/8bc2a5dfa17dc22f01bc69b0b7c0bba2c7e67e4d))
* **readme:** correct license table to match actual LICENSE file (MIT) ([5a06394](https://github.com/s977043/river-reviewer/commit/5a06394d1bfe4e2e442f6b8d6dda55496af33a63))
* regenerate corrupted package-lock.json to fix CI failures ([056fd93](https://github.com/s977043/river-reviewer/commit/056fd93e65533363f5f6341a1002350af0add10f))
* remove all merge conflict markers from create-skill.mjs ([3bfba20](https://github.com/s977043/river-reviewer/commit/3bfba20c823663b19483ae2adf700082b4b0311f))
* remove merge conflict markers from create-skill.mjs ([913c117](https://github.com/s977043/river-reviewer/commit/913c1177853f6259ab9e0acca6fd00f1b632d8c8))
* remove trim() to preserve leading newline in markdown output ([b1b0abe](https://github.com/s977043/river-reviewer/commit/b1b0abeb0e066fadc332484587aeaa0f3af7e01c))
* resolve Docusaurus duplicate ID error and address review feedback ([c2087ef](https://github.com/s977043/river-reviewer/commit/c2087ef2e609a5ba650c91c8e8e9f45518f4489a))
* resolve prettier formatting issues in CHANGELOG.md ([a947478](https://github.com/s977043/river-reviewer/commit/a947478da9f8ad1397acbd75f2df8c4c22070391))
* restore table formatting in docs/agent-layers.md ([e405ae4](https://github.com/s977043/river-reviewer/commit/e405ae44a3385bc50e3f4f803f6287ace7725e59))
* **review:** align silent-catch heuristic severity with skill severity ([#494](https://github.com/s977043/river-reviewer/issues/494)) ([dfbae3b](https://github.com/s977043/river-reviewer/commit/dfbae3b0b467c3575f2a4ae928976af497c7fae4))
* **schema:** align riverbed-index schema with v1 inline-entries impl (closes [#565](https://github.com/s977043/river-reviewer/issues/565)) ([#566](https://github.com/s977043/river-reviewer/issues/566)) ([432ea5f](https://github.com/s977043/river-reviewer/commit/432ea5f035b8a90dae099ad26d13f54e6097472b))
* **schemas:** tighten review-artifact schema and add ajv validation tests ([#548](https://github.com/s977043/river-reviewer/issues/548)) ([f2b08da](https://github.com/s977043/river-reviewer/commit/f2b08dab7ec9d2521248255531238c640494ba7e))
* **scripts:** add .catch() handler and expand check scope in meta-consistency ([54823f3](https://github.com/s977043/river-reviewer/commit/54823f37a8bc62c52680c747e5ecdd74fb173d1f))
* **scripts:** respect --check flag and skip markdown table rows ([#504](https://github.com/s977043/river-reviewer/issues/504)) ([5583f80](https://github.com/s977043/river-reviewer/commit/5583f80febeca1bf58f751ed24d5546e872a87c9))
* **scripts:** skip agent-skills in legacy validator ([18cac4f](https://github.com/s977043/river-reviewer/commit/18cac4fd82ee5db59ad9c11292e8a02f587df4c6))
* **security:** address PR [#350](https://github.com/s977043/river-reviewer/issues/350) review findings for agent skill bridge ([#361](https://github.com/s977043/river-reviewer/issues/361)) ([eb4e7a4](https://github.com/s977043/river-reviewer/commit/eb4e7a4fd3dd4d12e430d97a15eb745152d2cca1))
* **skills:** 5パターン診断に基づくスキル改善（統合） ([#385](https://github.com/s977043/river-reviewer/issues/385)) ([857d5ca](https://github.com/s977043/river-reviewer/commit/857d5ca1d05324c8b398d273b371160e3b1a648b))
* **skills:** add explicit category and version to all skill frontmatter ([af88fd3](https://github.com/s977043/river-reviewer/commit/af88fd37b858ba8b1c643cbebff9940b1e2e5f45))
* **skills:** add explicit category and version to all skill frontmatter ([1fc61c4](https://github.com/s977043/river-reviewer/commit/1fc61c4c9cc110b682be5e0213f2895279cfb99f))
* skip LLM-only skills when LLM is disabled ([a4d31cf](https://github.com/s977043/river-reviewer/commit/a4d31cf6064bdf6b3856915324426ba1a2e1a04c))
* skip LLM-only skills when LLM is disabled ([1329dc9](https://github.com/s977043/river-reviewer/commit/1329dc9ae2d0b4752b1f47bb9c17a28ba4f496a5))
* support GOOGLE_API_KEY in LLM check and add integration test ([9ac9d8e](https://github.com/s977043/river-reviewer/commit/9ac9d8e4d472fda178e35e1786f92c5d67fd39ff))
* update broken links and navigation title in skills.en.md ([af209bb](https://github.com/s977043/river-reviewer/commit/af209bbbbc3f65cf0a1a7989947557ad077d1ed3))
* update broken links to moved skills.md ([2cadbc1](https://github.com/s977043/river-reviewer/commit/2cadbc1024c52121ca1878f34ed77e926d39b154))
* update GitHub Actions versions to v6 for consistency ([593661b](https://github.com/s977043/river-reviewer/commit/593661b8e0b49ec9932c4c85623bb33b361c9608))
* update skill template link to pages/reference path ([5080e95](https://github.com/s977043/river-reviewer/commit/5080e9542260ac5bbc6b0bc3d92b5e568f31a7cf))
* Vercel siteUrl fallback for ai-review-kit ([#206](https://github.com/s977043/river-reviewer/issues/206)) ([51898ee](https://github.com/s977043/river-reviewer/commit/51898ee0b63832913a691fbf3d9a373410a2e993))


### Performance Improvements

* **ci:** optimize workflow execution ([7c6a30d](https://github.com/s977043/river-reviewer/commit/7c6a30db3d6ca9cd59edfa01e4a3e9c410e4be33))
* **ci:** optimize workflow execution ([10c2bad](https://github.com/s977043/river-reviewer/commit/10c2bad04fdad12957c462a1e54d4f9e887ca300))

## [0.13.1](https://github.com/s977043/river-reviewer/compare/v0.13.0...v0.13.1) (2026-04-17)


### Bug Fixes

* **docs:** bump action tag references to v0.13.0 ([#590](https://github.com/s977043/river-reviewer/issues/590)) ([adf3b7d](https://github.com/s977043/river-reviewer/commit/adf3b7d8c575769b0c89808a96a56143b845c4f9))

## [0.13.0](https://github.com/s977043/river-reviewer/compare/v0.12.0...v0.13.0) (2026-04-16)


### Features

* **ci:** add nightly eval workflow for review quality monitoring ([#458](https://github.com/s977043/river-reviewer/issues/458)) ([daa0833](https://github.com/s977043/river-reviewer/commit/daa0833d8515307ef49d0a51ddfd4ebff59db5bb))
* **ci:** add PlanGate PR review workflow (closes [#521](https://github.com/s977043/river-reviewer/issues/521)) ([#572](https://github.com/s977043/river-reviewer/issues/572)) ([d6b5405](https://github.com/s977043/river-reviewer/commit/d6b540566d7499dcd98c47cab275e976366cfc0b))
* **ci:** add weekly GC workflow for deterministic maintenance checks ([#570](https://github.com/s977043/river-reviewer/issues/570)) ([a01992f](https://github.com/s977043/river-reviewer/commit/a01992f583da029e9c30be6931c1db02191acc94)), closes [#522](https://github.com/s977043/river-reviewer/issues/522)
* **ci:** introduce setup-node-deps composite action and apply CI best practices ([#528](https://github.com/s977043/river-reviewer/issues/528)) ([39fe95f](https://github.com/s977043/river-reviewer/commit/39fe95f252fcb5e8f2d37ec688f648848b4bd7ed))
* **commands:** add /preflight to verify task state before multi-PR work ([#501](https://github.com/s977043/river-reviewer/issues/501)) ([6268549](https://github.com/s977043/river-reviewer/commit/62685491e47387977cd430d6edf22eced8e787a2))
* **eval:** add eval ledger section to PR template ([#454](https://github.com/s977043/river-reviewer/issues/454)) ([5e0ba5c](https://github.com/s977043/river-reviewer/commit/5e0ba5c3cc11cb15857063f7221adcab64d28a03)), closes [#438](https://github.com/s977043/river-reviewer/issues/438)
* **evals:** add nightly measure and audit pipeline ([#433](https://github.com/s977043/river-reviewer/issues/433)) ([1c802fc](https://github.com/s977043/river-reviewer/commit/1c802fca42effc2b4ff66a613999cce20ef098e0))
* **evals:** add risk-map and memory-fallback regression eval fixtures ([#469](https://github.com/s977043/river-reviewer/issues/469)) ([3ddc973](https://github.com/s977043/river-reviewer/commit/3ddc973343fdeef3c9f8005d1531f7fa81554443)), closes [#435](https://github.com/s977043/river-reviewer/issues/435)
* **memory:** add memory-context bridge for pipeline integration ([#432](https://github.com/s977043/river-reviewer/issues/432)) ([e1aee7e](https://github.com/s977043/river-reviewer/commit/e1aee7e76cfaf7eb5ff590a92eedbaa97de390ae))
* **policy:** add risk map and escalation policy ([#462](https://github.com/s977043/river-reviewer/issues/462)) ([9c560de](https://github.com/s977043/river-reviewer/commit/9c560de80cf3b3a5329c839554a78d792e81c554))
* **policy:** add suppression and resurfacing mechanism ([#434](https://github.com/s977043/river-reviewer/issues/434)) ([4b6029b](https://github.com/s977043/river-reviewer/commit/4b6029b5b9c32d5b048cb8415c3bc38986852a3e))
* progressive disclosure を明示的なスキルローディング原則として導入 ([#459](https://github.com/s977043/river-reviewer/issues/459)) ([37fcb37](https://github.com/s977043/river-reviewer/commit/37fcb374ce8a1e8fab5f5803ab10f08f69f770af))
* **review:** integrate adr-linker into review pipeline ([#456](https://github.com/s977043/river-reviewer/issues/456)) ([1a35681](https://github.com/s977043/river-reviewer/commit/1a35681092a26bffed0bb359b91707943a100034))
* **review:** integrate file-classifier into verifier with debug output ([#457](https://github.com/s977043/river-reviewer/issues/457)) ([e1d3f42](https://github.com/s977043/river-reviewer/commit/e1d3f427e3c51a6d55e8ddb4171e6d516f31252f))
* Riverbed Memory v1 ライフサイクルと置換モデルを実装 ([#474](https://github.com/s977043/river-reviewer/issues/474)) ([f222087](https://github.com/s977043/river-reviewer/commit/f222087ac54f8243dd517045923bf89d56270aff))
* **schema:** add review-audit to outputKind enum (closes [#585](https://github.com/s977043/river-reviewer/issues/585)) ([#587](https://github.com/s977043/river-reviewer/issues/587)) ([1559408](https://github.com/s977043/river-reviewer/commit/155940864e40d92b5ae7b7e7c949881ce994c6a9))
* **skill:** add PlanGate evals fixtures (closes [#523](https://github.com/s977043/river-reviewer/issues/523)) ([#574](https://github.com/s977043/river-reviewer/issues/574)) ([ef3f386](https://github.com/s977043/river-reviewer/commit/ef3f386d884fb0fa065fc231ae56f166f662f144))
* **skill:** add plangate-exec-conformance spec ([#561](https://github.com/s977043/river-reviewer/issues/561)) ([de20ba1](https://github.com/s977043/river-reviewer/commit/de20ba121e298a6638e250df0f965a25c8c8df97)), closes [#520](https://github.com/s977043/river-reviewer/issues/520)
* **skill:** add plangate-plan-integrity spec ([#560](https://github.com/s977043/river-reviewer/issues/560)) ([448ecb9](https://github.com/s977043/river-reviewer/commit/448ecb9ef70edad67bfe85c7b425bc0ad3cda69d))
* 構造化レビューアーティファクトスキーマを追加 ([#460](https://github.com/s977043/river-reviewer/issues/460)) ([0cf1e2f](https://github.com/s977043/river-reviewer/commit/0cf1e2f13ecba2fcb89cbf80f58053d8803f0d2c))
* 評価を多次元レビュールーブリックに拡張 ([#470](https://github.com/s977043/river-reviewer/issues/470)) ([fc6bba6](https://github.com/s977043/river-reviewer/commit/fc6bba678e3f168bea51736a83f7793d65b62b83))


### Bug Fixes

* **ci:** grant id-token: write to unit-tests for codecov OIDC ([#546](https://github.com/s977043/river-reviewer/issues/546)) ([81127bc](https://github.com/s977043/river-reviewer/commit/81127bc14fd25f36804f82aef404f1ddaeb2deb0)), closes [#545](https://github.com/s977043/river-reviewer/issues/545)
* **docs:** clarify that review pipeline is OpenAI-only ([#490](https://github.com/s977043/river-reviewer/issues/490)) ([5fed8c1](https://github.com/s977043/river-reviewer/commit/5fed8c1da37e7c51e9eb47b0b31222bb13e4788c))
* **eval:** rubric schema scope, direction field, terminology, integrity tests ([#547](https://github.com/s977043/river-reviewer/issues/547)) ([f869ecb](https://github.com/s977043/river-reviewer/commit/f869ecb05e164476f7c683a9689f981edde0daa4)), closes [#481](https://github.com/s977043/river-reviewer/issues/481)
* **evals:** prevent stderr leak and silent failure in nightly-audit ([#472](https://github.com/s977043/river-reviewer/issues/472)) ([#473](https://github.com/s977043/river-reviewer/issues/473)) ([8ba8d8c](https://github.com/s977043/river-reviewer/commit/8ba8d8c9925bde340a704c28e19dc2a8ac4b8754))
* **review:** align silent-catch heuristic severity with skill severity ([#494](https://github.com/s977043/river-reviewer/issues/494)) ([dfbae3b](https://github.com/s977043/river-reviewer/commit/dfbae3b0b467c3575f2a4ae928976af497c7fae4))
* **schema:** align riverbed-index schema with v1 inline-entries impl (closes [#565](https://github.com/s977043/river-reviewer/issues/565)) ([#566](https://github.com/s977043/river-reviewer/issues/566)) ([432ea5f](https://github.com/s977043/river-reviewer/commit/432ea5f035b8a90dae099ad26d13f54e6097472b))
* **schemas:** tighten review-artifact schema and add ajv validation tests ([#548](https://github.com/s977043/river-reviewer/issues/548)) ([f2b08da](https://github.com/s977043/river-reviewer/commit/f2b08dab7ec9d2521248255531238c640494ba7e))
* **scripts:** respect --check flag and skip markdown table rows ([#504](https://github.com/s977043/river-reviewer/issues/504)) ([5583f80](https://github.com/s977043/river-reviewer/commit/5583f80febeca1bf58f751ed24d5546e872a87c9))

## [0.12.0](https://github.com/s977043/river-reviewer/compare/v0.11.0...v0.12.0) (2026-04-07)


### Features

* **action:** bundle GitHub Action with ncc to eliminate cold start ([1702ba2](https://github.com/s977043/river-reviewer/commit/1702ba229f5f6dbbce9bb305d40e6e64501e2459))
* **eval:** add failure taxonomy and categorized fixture reports ([#419](https://github.com/s977043/river-reviewer/issues/419)) ([707a8ec](https://github.com/s977043/river-reviewer/commit/707a8ec60197d0dd32aadd60ffb283e974cc6688))
* **eval:** add unified evaluation runner and experiment ledger ([#413](https://github.com/s977043/river-reviewer/issues/413)) ([980e0bc](https://github.com/s977043/river-reviewer/commit/980e0bc9f7650e26d7204cfa66091f9885ddf080))
* **eval:** structured fixture results and multi-axis metrics ([#417](https://github.com/s977043/river-reviewer/issues/417)) ([f261995](https://github.com/s977043/river-reviewer/commit/f261995ad9a9a0130483b1ce7a8c4cfb65e37a67))
* **memory:** add GitHub Artifact persistence for Riverbed Memory ([#425](https://github.com/s977043/river-reviewer/issues/425)) ([b85fecf](https://github.com/s977043/river-reviewer/commit/b85fecf18dbe46c9f72573e3348a3d0ff159fadc))
* **memory:** add Riverbed Memory v1 runtime ([#426](https://github.com/s977043/river-reviewer/issues/426)) ([4e94434](https://github.com/s977043/river-reviewer/commit/4e94434e9fc6edaf94033339d70e0508cc5369b1))
* **review:** add ADR/spec linker and dependency impact analyzer ([#423](https://github.com/s977043/river-reviewer/issues/423)) ([0873e05](https://github.com/s977043/river-reviewer/commit/0873e05100f2b8c81270e115110eb681f9c20537))
* **review:** add changed-files classifier ([#420](https://github.com/s977043/river-reviewer/issues/420)) ([9ba8b06](https://github.com/s977043/river-reviewer/commit/9ba8b064563a1b81227d9790cfb69c7b74af8f95))
* **review:** add rule-based finding verifier ([#418](https://github.com/s977043/river-reviewer/issues/418)) ([9cfc28e](https://github.com/s977043/river-reviewer/commit/9cfc28e9550f833286688b24c4566020127d568f))
* **review:** add test impact analyzer and config risk detector ([#422](https://github.com/s977043/river-reviewer/issues/422)) ([f74645b](https://github.com/s977043/river-reviewer/commit/f74645b7981e7edd9798ba4e9d52d3e1e43205ad))
* **review:** integrate file-classifier into execution plan ([#427](https://github.com/s977043/river-reviewer/issues/427)) ([3544e4e](https://github.com/s977043/river-reviewer/commit/3544e4e74c42e8705ad3f51d8253790b567bc73b))
* **review:** integrate verifier into review pipeline ([#430](https://github.com/s977043/river-reviewer/issues/430)) ([4d84bdc](https://github.com/s977043/river-reviewer/commit/4d84bdc01b94aa6b6ab2a71eefb66073b0c55806))


### Bug Fixes

* **docs:** deduplicate AGENT_LEARNINGS.md and fix broken GEMINI.md reference ([#414](https://github.com/s977043/river-reviewer/issues/414)) ([1194672](https://github.com/s977043/river-reviewer/commit/1194672df27f0bcd3e54ec384e0902676221a0e7))
* restore table formatting in docs/agent-layers.md ([e405ae4](https://github.com/s977043/river-reviewer/commit/e405ae44a3385bc50e3f4f803f6287ace7725e59))

## [0.11.0](https://github.com/s977043/river-reviewer/compare/v0.10.0...v0.11.0) (2026-04-01)


### Features

* **ci:** add meta-consistency validation script and CI job ([#398](https://github.com/s977043/river-reviewer/issues/398)) ([a89b905](https://github.com/s977043/river-reviewer/commit/a89b905e094a726855af8b46a4cd5858f2350eac))
* **scripts:** add review severity gate evaluator ([#401](https://github.com/s977043/river-reviewer/issues/401)) ([667094a](https://github.com/s977043/river-reviewer/commit/667094a42c761b4dd955f08ad3fca2d01882962f))
* **skills:** add Claude Code skill management skills ([#380](https://github.com/s977043/river-reviewer/issues/380)) ([8fae238](https://github.com/s977043/river-reviewer/commit/8fae238e8bc3f9b626361ca3ee11366619bffac8))
* **skills:** add Inversion+Pipeline pattern to all skills ([#399](https://github.com/s977043/river-reviewer/issues/399)) ([e0ec61b](https://github.com/s977043/river-reviewer/commit/e0ec61b463f90f07ad0f2a5b7752200ad16fca82))
* **skills:** スキル管理スキルに5パターン設計システムを導入 ([#382](https://github.com/s977043/river-reviewer/issues/382)) ([9fa274a](https://github.com/s977043/river-reviewer/commit/9fa274a2efbe724380c3f6c5279292576d4bfe4d))


### Bug Fixes

* **codex:** address PR review feedback ([b31d901](https://github.com/s977043/river-reviewer/commit/b31d901872ed86b211281d67173e25bdc713cbb5))
* **meta:** update version refs to v0.10.0 and unify canonical URL ([#391](https://github.com/s977043/river-reviewer/issues/391), [#392](https://github.com/s977043/river-reviewer/issues/392)) ([8bc2a5d](https://github.com/s977043/river-reviewer/commit/8bc2a5dfa17dc22f01bc69b0b7c0bba2c7e67e4d))
* **readme:** correct license table to match actual LICENSE file (MIT) ([5a06394](https://github.com/s977043/river-reviewer/commit/5a06394d1bfe4e2e442f6b8d6dda55496af33a63))
* **scripts:** add .catch() handler and expand check scope in meta-consistency ([54823f3](https://github.com/s977043/river-reviewer/commit/54823f37a8bc62c52680c747e5ecdd74fb173d1f))
* **skills:** 5パターン診断に基づくスキル改善（統合） ([#385](https://github.com/s977043/river-reviewer/issues/385)) ([857d5ca](https://github.com/s977043/river-reviewer/commit/857d5ca1d05324c8b398d273b371160e3b1a648b))

## [0.10.0](https://github.com/s977043/river-reviewer/compare/v0.9.0...v0.10.0) (2026-03-19)


### Features

* **agent-skills:** add 5 routing agent skills for river-reviewer ([da7e7fe](https://github.com/s977043/river-reviewer/commit/da7e7feac42e0779fdf31b49b2eb11ee4f7876fd))
* **skills:** add adversarial review skills (Pre-mortem, War Game, Logic Torturing) ([#372](https://github.com/s977043/river-reviewer/issues/372)) ([baa3bc6](https://github.com/s977043/river-reviewer/commit/baa3bc6127f272302b7d24d924a45b5d70ea00dc))
* レビュー基盤改善と敵対的レビュースキルの追加 ([#371](https://github.com/s977043/river-reviewer/issues/371)) ([a4595b2](https://github.com/s977043/river-reviewer/commit/a4595b2e2267cc27c700da365daa863e5bb4efbb))


### Bug Fixes

* **agent-skills:** add missing References section to 4 routing agent skills ([c3f5a51](https://github.com/s977043/river-reviewer/commit/c3f5a51dec1b1cdb0efd751c9ba5f1b480f0c2de))
* **agent-skills:** address PR review comments on routing skills ([2d2c1ff](https://github.com/s977043/river-reviewer/commit/2d2c1ffb480107b3f292eab88f05ba9a13543508))
* **agent-skills:** fix remaining short-form skill ID in testing ROUTING.md ([d2be57d](https://github.com/s977043/river-reviewer/commit/d2be57d259b7af9269a544923f1061dbec1907d1))
* **agent-skills:** fix severity validation and exclude routing skills from planner ([bc2a55c](https://github.com/s977043/river-reviewer/commit/bc2a55cc52b3d346c7d95ed1afce80fe2d2178d2))
* **docs:** correct npm script name eval:skills → eval:fixtures ([4e29419](https://github.com/s977043/river-reviewer/commit/4e29419480312c5c8b039c045c58355bb252ed77))
* resolve Docusaurus duplicate ID error and address review feedback ([c2087ef](https://github.com/s977043/river-reviewer/commit/c2087ef2e609a5ba650c91c8e8e9f45518f4489a))
* **skills:** add explicit category and version to all skill frontmatter ([1fc61c4](https://github.com/s977043/river-reviewer/commit/1fc61c4c9cc110b682be5e0213f2895279cfb99f))

## [0.9.0](https://github.com/s977043/river-reviewer/compare/v0.8.0...v0.9.0) (2026-02-28)


### Features

* **runner:** enable runtime loading of agent-skills and update audit script ([01fc8a2](https://github.com/s977043/river-reviewer/commit/01fc8a20f9f7decf83fe3cff951ec22189f4e3b5))
* **skills:** add Agent Skills (SKILL.md) import/export bridge ([#349](https://github.com/s977043/river-reviewer/issues/349)) ([305f14c](https://github.com/s977043/river-reviewer/commit/305f14c4b610b90e8ff45afd88fdb1d516c7584a))
* **skills:** add entry skill river-reviewer ([ece1790](https://github.com/s977043/river-reviewer/commit/ece1790371a44ba1b6d6245e1d80475ab8fe2b72)), closes [#313](https://github.com/s977043/river-reviewer/issues/313)
* **skills:** Agent Skills (SKILL.md) bridge with review enhancements ([#350](https://github.com/s977043/river-reviewer/issues/350)) ([93c4ba5](https://github.com/s977043/river-reviewer/commit/93c4ba58ec46869ce342e0659afed178a9c5a3c1))
* 型駆動設計ガードとレビュー自動化境界ガードを追加 ([#352](https://github.com/s977043/river-reviewer/issues/352)) ([3616261](https://github.com/s977043/river-reviewer/commit/3616261bf59d47bb048851b7856fb4c5ae3e145a))


### Bug Fixes

* address additional review comments ([22800e1](https://github.com/s977043/river-reviewer/commit/22800e192b94673ab0435aebcba3cbd6c219be68))
* address review comments on AGENTS.md ([f21474c](https://github.com/s977043/river-reviewer/commit/f21474cc0a9f33b93b5088fb9c25fb1f855bde7b))
* address review comments on templates ([1e3159e](https://github.com/s977043/river-reviewer/commit/1e3159e12f169c15158c54f59e7c78063bbde337))
* agents.md dead link and root allowlist cleanup ([#360](https://github.com/s977043/river-reviewer/issues/360)) ([47df063](https://github.com/s977043/river-reviewer/commit/47df063a9ccbf93a65b055016aa6b745aefed5c7))
* **ci:** update .lychee.toml for latest lychee parser compatibility ([#368](https://github.com/s977043/river-reviewer/issues/368)) ([2d3da5a](https://github.com/s977043/river-reviewer/commit/2d3da5a400fb268e6e0492f1a6c16424a3cb7484))
* enforce branch policy in agent configuration ([#353](https://github.com/s977043/river-reviewer/issues/353)) ([f54bb6f](https://github.com/s977043/river-reviewer/commit/f54bb6fd1a168c297c08f0f727c6dbfbcf4a5498))
* Git diffのmaxBufferを拡大 ([f36af63](https://github.com/s977043/river-reviewer/commit/f36af63c6580eb0a376842c0825f3d14f66c1010))
* increase maxBuffer for large diffs ([db81630](https://github.com/s977043/river-reviewer/commit/db81630bd19b830e49a8fe152de562b51872959a))
* **scripts:** skip agent-skills in legacy validator ([18cac4f](https://github.com/s977043/river-reviewer/commit/18cac4fd82ee5db59ad9c11292e8a02f587df4c6))
* **security:** address PR [#350](https://github.com/s977043/river-reviewer/issues/350) review findings for agent skill bridge ([#361](https://github.com/s977043/river-reviewer/issues/361)) ([eb4e7a4](https://github.com/s977043/river-reviewer/commit/eb4e7a4fd3dd4d12e430d97a15eb745152d2cca1))
* skip LLM-only skills when LLM is disabled ([1329dc9](https://github.com/s977043/river-reviewer/commit/1329dc9ae2d0b4752b1f47bb9c17a28ba4f496a5))
* support GOOGLE_API_KEY in LLM check and add integration test ([9ac9d8e](https://github.com/s977043/river-reviewer/commit/9ac9d8e4d472fda178e35e1786f92c5d67fd39ff))

## [0.8.0](https://github.com/s977043/river-reviewer/compare/v0.7.1...v0.8.0) (2026-01-10)


### Features

* **dry-run:** ヒューリスティック対応スキルのみ dry-run で実行 ([3f23b9b](https://github.com/s977043/river-reviewer/commit/3f23b9b9fc191dce312e83adf977055366c3943d))
* **output:** スキル単位で指摘をグループ化 ([560493c](https://github.com/s977043/river-reviewer/commit/560493c22eec689deb2b37117d711c3ac5868b7e))
* **skills:** add skills audit script and report ([7ac29b4](https://github.com/s977043/river-reviewer/commit/7ac29b4975059ab63c1e323e8bd21bd955eab3db)), closes [#309](https://github.com/s977043/river-reviewer/issues/309)


### Bug Fixes

* **lint:** add language to fenced code blocks ([3bcaa21](https://github.com/s977043/river-reviewer/commit/3bcaa212b137416b728b3ab685d1fc3ece6ddcbb))
* Markdown インジェクション対策と出力順序の安定化 ([39d0fff](https://github.com/s977043/river-reviewer/commit/39d0fff91d5cadb8f2d49f54ed09e17ce919cecf))

## [0.7.1](https://github.com/s977043/river-reviewer/compare/v0.7.0...v0.7.1) (2026-01-07)


### Bug Fixes

* **ci:** ignore CHANGELOG.md in lint ([697417b](https://github.com/s977043/river-reviewer/commit/697417bc66a8d4c2fefda90bf235bf31316b2b19))


### Performance Improvements

* **ci:** optimize workflow execution ([10c2bad](https://github.com/s977043/river-reviewer/commit/10c2bad04fdad12957c462a1e54d4f9e887ca300))

## [0.7.0](https://github.com/s977043/river-reviewer/compare/v0.6.1...v0.7.0) (2026-01-05)


### Features

* add config file review skill and improve fallback messages ([102dab0](https://github.com/s977043/river-reviewer/commit/102dab03da191b8157d37a8323ea9b953f44f031))


### Bug Fixes

* format CHANGELOG.md to pass prettier checks ([889123d](https://github.com/s977043/river-reviewer/commit/889123d04211ab0c2e299abfb01bcaeb693bb29b))
* improve markdown output format for review findings ([78f0847](https://github.com/s977043/river-reviewer/commit/78f08471d8d536f378e04cb6cebc7e1fd9894f57))
* remove trim() to preserve leading newline in markdown output ([b1b0abe](https://github.com/s977043/river-reviewer/commit/b1b0abeb0e066fadc332484587aeaa0f3af7e01c))
* update broken links and navigation title in skills.en.md ([af209bb](https://github.com/s977043/river-reviewer/commit/af209bbbbc3f65cf0a1a7989947557ad077d1ed3))
* update broken links to moved skills.md ([2cadbc1](https://github.com/s977043/river-reviewer/commit/2cadbc1024c52121ca1878f34ed77e926d39b154))
* update skill template link to pages/reference path ([5080e95](https://github.com/s977043/river-reviewer/commit/5080e9542260ac5bbc6b0bc3d92b5e568f31a7cf))

## [0.6.1](https://github.com/s977043/river-reviewer/compare/v0.6.0...v0.6.1) (2026-01-05)

### Bug Fixes

- address CI lint errors (MD012, MD004) and review feedback (security, robustness) ([7c52477](https://github.com/s977043/river-reviewer/commit/7c5247762b20bb4b941c884c4416e246f6c274ca))

## [0.6.0](https://github.com/s977043/river-reviewer/compare/v0.5.0...v0.6.0) (2026-01-04)

### Features

- add Claude Code best practices (hooks, commands, enhanced CLAUDE.md) ([#290](https://github.com/s977043/river-reviewer/issues/290)) ([feb3879](https://github.com/s977043/river-reviewer/commit/feb3879d6496fe5dec8b89c99d105b43a7ed7451))

## [0.5.0](https://github.com/s977043/river-reviewer/compare/v0.4.0...v0.5.0) (2025-12-30)

### Features

- **skills:** add security-privacy-design skill ([#264](https://github.com/s977043/river-reviewer/issues/264)) ([e9edfef](https://github.com/s977043/river-reviewer/commit/e9edfefd5dd2441985c7899fdc7a15410921691a))

## [0.4.0](https://github.com/s977043/river-reviewer/compare/v0.3.0...v0.4.0) (2025-12-30)

### Features

- **skills:** add architecture-validation-plan skill ([#260](https://github.com/s977043/river-reviewer/issues/260)) ([b959c56](https://github.com/s977043/river-reviewer/commit/b959c56d60207e5b0e24ebe663b6eb4d6999dca9))
- **skills:** add cache-strategy-consistency skill ([#262](https://github.com/s977043/river-reviewer/issues/262)) ([99b336c](https://github.com/s977043/river-reviewer/commit/99b336c13e4310c179ada9b35bdcf143ccc71fc0))
- **skills:** add multitenancy-isolation skill ([#261](https://github.com/s977043/river-reviewer/issues/261)) ([685280b](https://github.com/s977043/river-reviewer/commit/685280b41fff3671f8cb6dd8f0b83db6db6fbeef))

## [0.3.0](https://github.com/s977043/river-reviewer/compare/v0.2.0...v0.3.0) (2025-12-30)

- add comprehensive link checking system with security validation ([#256](https://github.com/s977043/river-reviewer/issues/256)) ([718e3ff](https://github.com/s977043/river-reviewer/commit/718e3ff32c3d662615f5cf7331096fa416dc88bf))
- add skill-eval CI workflow and migrate logging-observability skill ([#259](https://github.com/s977043/river-reviewer/issues/259)) ([f4ea416](https://github.com/s977043/river-reviewer/commit/f4ea4163947b35a3d62ca894b37d144eb5fd24b7))

## v0.2.0—2025-12-29

### Runners Architecture

- **Runners Architecture Refactoring:** Separated skills (product) from execution environments (adapters)
- Added `runners/core/` with skill loader and execution planning components
- Added `runners/cli/` with command-line interface for local review execution
- Added `runners/node-api/` with programmatic TypeScript API for integrations
- Moved GitHub Action from `.github/actions/river-reviewer/` to `runners/github-action/`

### Breaking Changes

⚠️ **Important:** This release contains breaking changes. See [Migration Guide](docs/migration/runners-migration-guide.md) for upgrade instructions.

1. **GitHub Action Path Changed:**
   - **Old (v0.1.x):** `s977043/river-reviewer/.github/actions/river-reviewer@v0.1.1`
   - **New (v0.2.0+):** `s977043/river-reviewer/runners/github-action@v0.2.0`
   - **Migration:** Update all workflow files to use the new path
   - **Compatibility:** v0.1.1 continues to work with old path, but won't receive new features

2. **Core Module Imports Changed (Contributors Only):**
   - **Old:** `import { loadSkills } from './src/lib/skill-loader.mjs'`
   - **New:** `import { loadSkills } from './runners/core/skill-loader.mjs'`
   - **Impact:** Only affects direct imports of core modules (rare)

### Migration Resources

- **Full Migration Guide:** [docs/migration/runners-migration-guide.md](docs/migration/runners-migration-guide.md)
- **Deprecation Notice:** [DEPRECATED.md](docs/deprecated.md)
- **Architecture Overview:** [docs/architecture.md](docs/architecture.md)

### Documentation

- Updated all examples to use new `runners/github-action` path
- Added comprehensive migration documentation
- Updated README and tutorials with new architecture references

### Related Issues

- Epic #242: Runners Architecture Refactoring
- #243: Create runners/ directory structure
- #244: Move GitHub Action
- #245: Update all workflow and documentation references
- #246: Create CLI runner interface
- #247: Create Node API runner interface
- #240: Add backward compatibility documentation
- #241: Fix LICENSE standardization

## v0.1.1—2025-12-13

- Fixed the composite GitHub Action to work reliably when used from external repositories (installing dependencies from the action repo root).
- Added idempotent PR comment posting (updates an existing River Reviewer comment instead of duplicating).
- Added a minimal always-on "Hello Skill" to guarantee end-to-end behavior on any diff.
- Aligned milestone title formatting with `.github/workflows/auto-milestone.yml` and adjusted dash normalization logic accordingly.
- Updated CLI output for PR comments and tuned prompts to prefer Japanese review messages.

## v0.1.0—2025-12-12

- Added JSON Schema 2020-12 output format with `issues` array and `summary` aggregation (breaking for consumers of the old flat schema).
- Added upstream/midstream/downstream sample skills with YAML frontmatter.
- Added local CLI (`river run`) with diff optimization, cost estimation, and dry-run fallback behavior.
- Added composite GitHub Action (`runners/github-action`) and refreshed README/tutorial examples.
- Added the Riverbed Memory design draft under `pages/explanation/`.
- Added additional downstream and midstream skills (coverage gaps, flaky tests, test existence, TypeScript null safety).

### Breaking changes

- `schemas/output.schema.json` now returns an array of issues plus a summary object. Any tools/CI consuming the previous structure must update.

### Release checklist

- `main` の更新後、Release PR（release-please）が作成されていることを確認する。
- Release PR をマージしてリリースを確定する（タグ発行と GitHub Release は CI が実施）。
- `v0` のようなエイリアスタグは CI が最新リリースへ追従させる。
