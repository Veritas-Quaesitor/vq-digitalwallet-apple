# Contributing to vq-digitalwallet-apple

---

## Development Setup

```bash
git clone https://github.com/Veritas-Quaesitor/vq-digitalwallet-apple.git
cd vq-digitalwallet-apple
npm install
```

### Build

```bash
npm run build       # IIFE (vqdigitalwalletapple.js) + UMD (dist/vqdigitalwalletapple.min.js)
npm run build:dev   # Development build (no minification)
npm run build:watch # Watch mode
```

### Test

```bash
npm test              # Run all 43 tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Lint

```bash
npm run lint      # ESLint on src/
npm run lint:fix  # Auto-fix where possible
```

### Docs

```bash
npm run docs      # Regenerate docs/ using docdash template
```

> **Note:** Always use `docdash` as the JSDoc template. Do NOT switch to `better-docs` — it carries HIGH/MODERATE npm audit vulnerabilities.

---

## Upgrading the Apple Pay CDN Version

The Apple Pay JS SDK is loaded from Apple's CDN. The URL is **pinned to an immutable versioned
release** and verified with a Subresource Integrity (SRI) hash to prevent supply chain attacks.

When Apple releases a new SDK version, update both constants in `src/vqdigitalwalletapple.js`:

### Step 1 — Find the new version

Apple publishes versioned CDN paths at:
```
https://applepay.cdn-apple.com/jsapi/v{major}.{minor}.{patch}/apple-pay-sdk.js
```

Check Apple's developer forums or release notes for the latest version number.

### Step 2 — Download the new file and compute the SRI hash

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://applepay.cdn-apple.com/jsapi/vX.Y.Z/apple-pay-sdk.js" -OutFile apple-pay-sdk.js
$bytes = [System.IO.File]::ReadAllBytes("apple-pay-sdk.js")
$sha = [System.Security.Cryptography.SHA384]::Create()
"sha384-" + [Convert]::ToBase64String($sha.ComputeHash($bytes))
```

**Linux/macOS:**
```bash
curl -O https://applepay.cdn-apple.com/jsapi/vX.Y.Z/apple-pay-sdk.js
openssl dgst -sha384 -binary apple-pay-sdk.js | openssl base64 -A
# prepend "sha384-" to the output
```

### Step 3 — Update the constants

In `src/vqdigitalwalletapple.js`, update:

```javascript
var APPLE_PAY_SDK_URL =
  "https://applepay.cdn-apple.com/jsapi/vX.Y.Z/apple-pay-sdk.js";

var APPLE_PAY_SDK_SRI =
  "sha384-<your-computed-hash>";
```

### Step 4 — Rebuild, test, and verify

```bash
npm run build
npm test
npm run lint
```

Also update `CLAUDE.md` with the new URL, SRI hash, and version reference.

---

## Architecture Notes

- **Payment flow:** W3C Payment Request API (not `ApplePaySession`) — this is intentional.
- **Zero runtime dependencies** — everything is a devDependency.
- **Single source file:** `src/vqdigitalwalletapple.js` — Rollup handles the rest.
- **UMD factory pattern:** The class can be instantiated with or without `new`.

---

## Pull Request Guidelines

- Keep PRs focused — one concern per PR.
- All 43 tests must pass: `npm test`
- Zero lint errors: `npm run lint`
- Zero new audit vulnerabilities: `npm audit`
- Update `README.md` if the public API changes.
- Update `vqdigitalwalletapple.d.ts` if new methods are added.
- Security-related changes must include a corresponding CWE-tagged test.

---

## Security Issues

Please do **not** open a public GitHub issue for security vulnerabilities. Report them directly
to the maintainer via the contact details on the GitHub profile.
