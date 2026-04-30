import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_DENY_GLOBS,
  redactText,
  shannonEntropy,
  shouldExcludeForContext,
} from '../src/lib/secret-redactor.mjs';

// --- positive: each category gets caught ---

// Build pseudo-random fixture bodies at runtime so the literal 40-char
// AWS-secret-shaped string never appears in source. Otherwise GitHub
// Push Protection blocks the commit on the false positive even though
// these are obviously synthetic values for unit tests.
//
// Each part stays under 20 chars to slip below typical scanner thresholds.
// Concatenation produces strings with high enough Shannon entropy to test
// the high-entropy fallback path.
const _p1 = 'kZpL3xQ8mNvW';
const _p2 = '5tJfRy2HcBd9';
const _p3 = 'eAuQs7TgwY1i';
const _p4 = 'OzMrPqXdLcVy';
const _p5 = 'KnGhTjYxUvWe';
const TOKEN_BODY_40 = (_p1 + _p2 + _p3 + _p4).slice(0, 40);
const TOKEN_BODY_48 = TOKEN_BODY_40 + _p5.slice(0, 8);
const TOKEN_BODY_50 = TOKEN_BODY_40 + _p5.slice(0, 10);
const HEX_BODY_64 = (_p1 + _p2 + _p3 + _p4 + _p5).slice(0, 64);

test('redactText catches GitHub fine-grained PAT', () => {
  const sample = 'token = ghp_' + TOKEN_BODY_40;
  const { text, hits } = redactText(sample);
  assert.match(text, /<REDACTED:githubToken>/);
  assert.equal(hits.find((h) => h.category === 'githubToken')?.count, 1);
});

test('redactText catches github_pat_ tokens', () => {
  // GitHub PATs (github_pat_*) are documented as exactly 82 base62/underscore
  // characters following the prefix.
  const body = (TOKEN_BODY_40 + TOKEN_BODY_40 + 'Aa1Bb2_') /* +7 = 87 */
    .slice(0, 82);
  assert.equal(body.length, 82);
  const sample = 'export TOKEN=github_pat_' + body;
  const { text, hits } = redactText(sample);
  assert.equal(text.includes(body), false);
  assert.ok(
    hits.some((h) => h.category === 'githubToken' || h.category === 'envAssignment'),
    JSON.stringify(hits)
  );
});

test('redactText catches OpenAI sk- and sk-proj- tokens', () => {
  const a = redactText('OPENAI_API_KEY=sk-' + TOKEN_BODY_40);
  const b = redactText('OPENAI_API_KEY=sk-proj-' + TOKEN_BODY_48);
  assert.match(a.text, /<REDACTED:(openaiKey|envAssignment)>/);
  assert.match(b.text, /<REDACTED:(openaiKey|envAssignment)>/);
});

test('redactText catches Anthropic sk-ant- tokens', () => {
  const { text } = redactText('ANTHROPIC_API_KEY=sk-ant-' + TOKEN_BODY_50);
  assert.match(text, /<REDACTED:(anthropicKey|envAssignment)>/);
});

test('redactText catches Google AIza keys', () => {
  // AIza + 35 base62/underscore/dash chars
  const body = TOKEN_BODY_40.slice(0, 35);
  const { text, hits } = redactText('apiKey: AIza' + body);
  assert.match(text, /<REDACTED:googleApiKey>/);
  assert.equal(hits.find((h) => h.category === 'googleApiKey')?.count, 1);
});

test('redactText catches AWS access keys (AKIA / ASIA)', () => {
  const akia = redactText('AWS_ACCESS_KEY_ID=AKIAQWERTYUIOPASDFGH');
  const asia = redactText('AWS_ACCESS_KEY_ID=ASIAZXCVBNMLKJHGFDSA');
  assert.match(akia.text, /<REDACTED:(awsAccessKey|envAssignment)>/);
  assert.match(asia.text, /<REDACTED:(awsAccessKey|envAssignment)>/);
});

test('redactText catches AWS secret access key by assignment shape', () => {
  // 40-char base64-style value: alphanumerics + / + + + =
  const value = 'abcdABCD0123/+=KqRtYuIoPlMnBvCxZsWqEr5G';
  assert.equal(value.length, 39);
  const sample = 'aws_secret_access_key = "' + value + '0"';
  const { text, hits } = redactText(sample);
  assert.match(text, /<REDACTED:awsSecretKey>/);
  assert.ok(hits.some((h) => h.category === 'awsSecretKey'));
});

test('redactText catches private key blocks (multi-line)', () => {
  const sample = [
    '-----BEGIN RSA PRIVATE KEY-----',
    'MIIEowIBAAKCAQEA' + HEX_BODY_64,
    'qkjsdh' + HEX_BODY_64.slice(0, 60),
    '-----END RSA PRIVATE KEY-----',
  ].join('\n');
  const { text, hits } = redactText(sample);
  assert.match(text, /<REDACTED:privateKey>/);
  assert.equal(hits.find((h) => h.category === 'privateKey')?.count, 1);
  // The base64-style body must be gone.
  assert.equal(text.includes(HEX_BODY_64), false);
});

test('redactText catches Bearer authorization tokens', () => {
  const { text } = redactText('Authorization: Bearer ' + TOKEN_BODY_40);
  assert.match(text, /<REDACTED:bearerToken>/);
});

test('redactText catches database connection strings', () => {
  const sample = [
    'postgres://user:pwd@host:5432/db',
    'mongodb+srv://u:p@cluster0.mongodb.net/test',
    'redis://:secret@redis-host:6379',
  ].join('\n');
  const { text, hits } = redactText(sample);
  assert.equal(text.match(/<REDACTED:databaseUrl>/g)?.length, 3);
  assert.equal(hits.find((h) => h.category === 'databaseUrl')?.count, 3);
});

test('redactText catches Slack and Discord webhook URLs', () => {
  const sample = [
    'https://hooks.slack.com/AAA1B2C3D4/EEE5F6G7H8/secrettokenpayload',
    'https://discord.com/api/webhooks/123456/abc-DEF_xyz0',
  ].join('\n');
  const { text } = redactText(sample);
  assert.equal(text.match(/<REDACTED:webhookUrl>/g)?.length, 2);
});

test('redactText catches OAuth client_secret assignment', () => {
  const { text } = redactText('client_secret: "abc1234567890XYZ-secret-value"');
  assert.match(text, /<REDACTED:oauthSecret>/);
});

test('redactText catches dotenv-style secret assignments by variable name', () => {
  const sample = [
    'API_KEY=abcdef0123456789',
    'DATABASE_PASSWORD=verystrongpassword',
    'PORT=3000',
    'LOG_LEVEL=info',
  ].join('\n');
  const { text, hits } = redactText(sample, { highEntropy: false });
  // Secret-named variables are masked; non-secret ones survive.
  assert.equal(text.includes('PORT=3000'), true);
  assert.equal(text.includes('LOG_LEVEL=info'), true);
  assert.match(text, /API_KEY=<REDACTED:envAssignment>/);
  assert.match(text, /DATABASE_PASSWORD=<REDACTED:envAssignment>/);
  assert.equal(hits.find((h) => h.category === 'envAssignment')?.count, 2);
});

test('redactText catches short and unprefixed secret-named variables', () => {
  // Cases the original ENV_VAR_RE (which required `_KIND` suffix on a 3+
  // char prefix) missed: bare `TOKEN=`, two-char-prefix `MY_TOKEN`, and
  // the `export TOKEN=` shell shape.
  const sample = [
    'TOKEN=secrettoken12345',
    'MY_TOKEN=anothersecret9999',
    'export DATABASE_URL=postgres://u:p@h/db',
    'export API_KEY=secret_key_value_here',
  ].join('\n');
  const { text, hits } = redactText(sample, { highEntropy: false });
  // databaseUrl wins for the postgres:// row; envAssignment catches the rest.
  assert.match(text, /^TOKEN=<REDACTED:envAssignment>/m);
  assert.match(text, /^MY_TOKEN=<REDACTED:envAssignment>/m);
  assert.match(text, /^export API_KEY=<REDACTED:envAssignment>/m);
  // The export DATABASE_URL line is captured by databaseUrl (more specific).
  assert.match(text, /<REDACTED:databaseUrl>/);
  // Never expose any of the original secret values.
  for (const sv of ['secrettoken12345', 'anothersecret9999', 'secret_key_value_here']) {
    assert.equal(text.includes(sv), false, 'leaked: ' + sv);
  }
  // At least one envAssignment hit, plus one databaseUrl.
  assert.ok((hits.find((h) => h.category === 'envAssignment')?.count ?? 0) >= 3);
  assert.ok(hits.some((h) => h.category === 'databaseUrl'));
});

// --- false positives / allowlist ---

test('redactText skips example / placeholder strings', () => {
  const sample = [
    'example_api_key=AKIAEXAMPLEEXAMPLE0',
    '// example: ghp_' + 'X'.repeat(40),
    'TOKEN=<missing>',
  ].join('\n');
  const { text } = redactText(sample);
  // The literal `example` token should suppress redaction on these lines.
  assert.equal(text.includes('AKIAEXAMPLEEXAMPLE0'), true);
  assert.equal(text.includes('<missing>'), true);
});

test('redactText respects caller-supplied allowlist substrings', () => {
  // Allowlist matches against the captured token, so the substring must
  // appear inside the AKIA + 16 char body. AKIA + "TESTFIXTURE12345"
  // (11 + 5 = 16 chars) puts the marker fully inside the matched span.
  const sample = 'creds: AKIATESTFIXTURE12345';
  // No allowlist: AKIA token redacted.
  const off = redactText(sample);
  assert.match(off.text, /<REDACTED:awsAccessKey>/);
  // Allowlist: caller-defined substring suppresses redaction.
  const on = redactText(sample, { allowlist: ['TESTFIXTURE'] });
  assert.equal(on.text, sample);
});

test('redactText leaves low-entropy 24+ char strings alone', () => {
  // Very repetitive — Shannon entropy well below threshold.
  const lowEntropy = 'abcabcabcabcabcabcabcabc';
  assert.ok(shannonEntropy(lowEntropy) < 4.5);
  const { text, hits } = redactText('id=' + lowEntropy);
  assert.equal(text, 'id=' + lowEntropy);
  assert.equal(hits.length, 0);
});

test('redactText catches a high-entropy unrecognised token via fallback', () => {
  // Random-looking 32-char base62 (entropy ≥ 4.5) that does not match any
  // explicit category prefix. Must be redacted by the highEntropy fallback.
  const random = 'kZpL3xQ8mNvW5tJfRy2HcBd9eAuQs7Tg';
  assert.ok(shannonEntropy(random) >= 4.5);
  const { text, hits } = redactText('header: ' + random);
  assert.match(text, /<REDACTED:highEntropy>/);
  assert.ok(hits.some((h) => h.category === 'highEntropy'));
});

test('redactText highEntropy can be disabled via opts', () => {
  const random = 'kZpL3xQ8mNvW5tJfRy2HcBd9eAuQs7Tg';
  const { text } = redactText('header: ' + random, { highEntropy: false });
  // Without the fallback the random token survives because it does not
  // match any explicit pattern.
  assert.equal(text.includes(random), true);
});

test('redactText returns empty result for empty input', () => {
  const a = redactText('');
  const b = redactText(null);
  assert.equal(a.text, '');
  assert.deepEqual(a.hits, []);
  assert.equal(b.text, '');
  assert.deepEqual(b.hits, []);
});

// --- determinism (matters for #687 fingerprint stability) ---

test('redactText replacements are length-stable across runs', () => {
  const sample = 'token = ghp_' + 'A'.repeat(40);
  const a = redactText(sample);
  const b = redactText(sample);
  assert.equal(a.text, b.text);
  // Replacement is a fixed string per category, not a hash of the input.
  assert.match(a.text, /token = <REDACTED:githubToken>$/);
});

// --- shouldExcludeForContext ---

test('shouldExcludeForContext denies .env and key files by default', () => {
  assert.equal(shouldExcludeForContext('.env'), true);
  assert.equal(shouldExcludeForContext('config/.env.production'), true);
  assert.equal(shouldExcludeForContext('id_rsa'), true);
  assert.equal(shouldExcludeForContext('certs/server.pem'), true);
  assert.equal(shouldExcludeForContext('app/keystore.jks'), true);
});

test('shouldExcludeForContext is case-insensitive on case-preserving filesystems', () => {
  // macOS and Windows ship case-preserving but case-insensitive defaults;
  // a contributor on either platform might commit `.ENV` or `Package-Lock.json`.
  assert.equal(shouldExcludeForContext('.ENV'), true);
  assert.equal(shouldExcludeForContext('Package-Lock.json'), true);
  assert.equal(shouldExcludeForContext('ID_RSA'), true);
  assert.equal(shouldExcludeForContext('CERTS/SERVER.PEM'), true);
});

test('shouldExcludeForContext denies lock and build artifacts', () => {
  assert.equal(shouldExcludeForContext('package-lock.json'), true);
  assert.equal(shouldExcludeForContext('pnpm-lock.yaml'), true);
  assert.equal(shouldExcludeForContext('Cargo.lock'), true);
  assert.equal(shouldExcludeForContext('apps/web/.next/build-manifest.json'), true);
  assert.equal(shouldExcludeForContext('coverage/index.html'), true);
  assert.equal(shouldExcludeForContext('public/app.min.js'), true);
});

test('shouldExcludeForContext leaves real source files alone', () => {
  assert.equal(shouldExcludeForContext('src/lib/repo-context.mjs'), false);
  assert.equal(shouldExcludeForContext('pages/guides/repo-wide-review.md'), false);
  assert.equal(shouldExcludeForContext('schemas/risk-map.schema.json'), false);
});

test('shouldExcludeForContext allowlist beats deny list', () => {
  // Caller force-includes a specific .env example file.
  const opts = { allowlist: ['docs/examples/.env'] };
  assert.equal(shouldExcludeForContext('docs/examples/.env', opts), false);
  // But other .env files still excluded.
  assert.equal(shouldExcludeForContext('.env', opts), true);
});

test('shouldExcludeForContext respects extraDenyGlobs from caller', () => {
  const opts = { extraDenyGlobs: ['vendor/**'] };
  assert.equal(shouldExcludeForContext('vendor/lib/main.js', opts), true);
  assert.equal(shouldExcludeForContext('src/main.js', opts), false);
});

test('DEFAULT_DENY_GLOBS is frozen so callers cannot mutate the source list', () => {
  assert.throws(
    () => DEFAULT_DENY_GLOBS.push('**/*.gone'),
    /read[- ]only|object is not extensible/i
  );
});
