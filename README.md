# vq-digitalwallet-apple

[![npm version](https://badge.fury.io/js/vq-digitalwallet-apple.svg)](https://www.npmjs.com/package/vq-digitalwallet-apple)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A lightweight JavaScript client SDK for integrating **Apple Pay** into web applications via the Payment Request API. Features enterprise-grade input validation, per-instance rate limiting, secure merchant validation, session management, and structured error handling.

---

## Features

- Zero runtime dependencies — all packages are devDependencies only
- Dual build output: IIFE for CDN/browser, UMD for bundlers and npm
- Full TypeScript definitions (`.d.ts` included)
- 38 passing tests including 16 OWASP security tests (CWE-20, CWE-79, CWE-116, CWE-400, CWE-770, CWE-1321)
- SRI integrity checking for the Apple Pay JS SDK CDN script
- Per-instance rate limiting (never shared across instances)
- Prototype pollution protection in deep merge utility

---

## Browser Compatibility

Apple Pay via the Payment Request API is only available in specific browsers on Apple hardware:

| Browser / Platform    | Support                     | Notes                          |
| --------------------- | --------------------------- | ------------------------------ |
| Safari (iOS)          | Full                        | Native payment sheet           |
| Safari (macOS)        | Full                        | Native payment sheet           |
| Chrome (iOS 18+)      | Via QR Relay                | Uses Apple's relay sheet       |
| Firefox (iOS 18+)     | Via QR Relay                | Same as Chrome                 |
| Edge (iOS 18+)        | Via QR Relay                | Same as Chrome                 |
| Chrome desktop        | Partial (QR modal if set up)| Requires Apple relay           |
| Non-Apple desktop     | Not supported               |                                |

The SDK is fully compatible with Apple's QR-based handoff flow introduced in iOS 18.

> **Domain verification:** Apple Pay on the web requires a domain association file at
> `/.well-known/apple-developer-merchantid-domain-association` on your HTTPS server.
> This is a one-time merchant setup step outside the scope of this SDK.

---

## Installation

```bash
npm install vq-digitalwallet-apple
```

```bash
yarn add vq-digitalwallet-apple
```

**CDN (IIFE build)**

```html
<script src="https://unpkg.com/vq-digitalwallet-apple@latest/vqdigitalwalletapple.js"></script>
```

---

## Quick Start

### Browser (IIFE via CDN)

```html
<!DOCTYPE html>
<html>
<head><title>Apple Pay</title></head>
<body>
  <div id="apple-pay-button"></div>

  <script src="https://unpkg.com/vq-digitalwallet-apple@latest/vqdigitalwalletapple.js"></script>
  <script>
    var applePay = new VqDigitalWalletApple({
      mode: 'production',
      merchantIdentifier: 'merchant.com.example',
      merchantName: 'Example Store',
      validationEndpoint: 'https://your-server.com/applepay/validate',
      onTokenGenerated: function(token, error) {
        if (error) {
          console.error('Payment failed:', error);
        } else {
          // Send token to your backend for authorisation
          console.log('Token:', token);
        }
      }
    });

    applePay.initialize().then(function(isReady) {
      if (isReady) {
        applePay.createButton('apple-pay-button', {
          amount: 99.99,
          currency: 'ZAR',
          countryCode: 'ZA'
        });
      }
    });
  </script>
</body>
</html>
```

### CommonJS / bundler

```javascript
const VqDigitalWalletApple = require('vq-digitalwallet-apple');

const applePay = new VqDigitalWalletApple({
  mode: 'production',
  merchantIdentifier: 'merchant.com.example',
  merchantName: 'Example Store',
  validationEndpoint: 'https://your-server.com/applepay/validate',
  onTokenGenerated(token, error) {
    if (error) handleError(error);
    else sendTokenToBackend(token);
  }
});

const isReady = await applePay.initialize();
if (isReady) {
  applePay.createButton(document.getElementById('pay-btn'), {
    amount: 49.99,
    currency: 'ZAR'
  });
}
```

### TypeScript

```typescript
import VqDigitalWalletApple, {
  VqDigitalWalletAppleConfig,
  PaymentData,
  PaymentResult
} from 'vq-digitalwallet-apple';

const config: VqDigitalWalletAppleConfig = {
  mode: 'production',
  merchantIdentifier: 'merchant.com.example',
  merchantName: 'Example Store',
  validationEndpoint: 'https://your-server.com/applepay/validate',
  onTokenGenerated(token, error) {
    if (error) console.error(error);
    else console.log('Token:', token);
  }
};

const applePay = new VqDigitalWalletApple(config);
const isReady = await applePay.initialize();
```

---

## Configuration

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `merchantIdentifier` | `string` | Yes | — | Apple Merchant ID. Format: `merchant.com.yourcompany` |
| `merchantName` | `string` | Yes | — | Shown in Apple Pay sheet. Max 100 chars. |
| `mode` | `'development' \| 'production'` | Yes | — | SDK environment |
| `validationEndpoint` | `string` | No | `''` | Your server's merchant validation URL. Must start with `https://`. Max 512 chars. |
| `allowedCardNetworks` | `string[]` | No | `['masterCard','visa']` | Supported card networks |
| `merchantCapabilities` | `string[]` | No | `['supports3DS']` | Merchant capability flags |
| `buttonStyle` | `'black' \| 'white' \| 'white-outline'` | No | `'black'` | Apple Pay button style |
| `buttonType` | `'buy' \| 'pay' \| 'plain' \| ...` | No | `'buy'` | Apple Pay button type |
| `buttonLocale` | `string` | No | `'en-ZA'` | Button locale |
| `onTokenGenerated` | `(token, error) => void` | No | `null` | Payment token callback |
| `scriptLoadTimeout` | `number` | No | `10000` | SDK script load timeout (ms) |
| `requestTimeout` | `number` | No | `30000` | Payment request timeout (ms) |
| `cspNonce` | `string` | No | `''` | CSP nonce for injected scripts |
| `paymentOptions` | `PaymentOptions` | No | see below | Payment Request API options |

**Supported `buttonType` values:** `plain`, `buy`, `pay`, `order`, `donate`, `subscribe`, `checkout`, `book`, `add-money`, `contribute`, `reload`, `rent`, `save`, `tip`, `top-up`

---

## API Reference

### `initialize(): Promise<boolean>`

Loads the Apple Pay JS SDK from Apple's CDN and checks whether the device supports Apple Pay via `PaymentRequest.canMakePayment()`.

Returns `true` when Apple Pay is available, `false` when not supported on the current device/browser.

```javascript
applePay.initialize().then(function(isReady) {
  if (isReady) {
    // Show Apple Pay button
  } else {
    // Hide Apple Pay UI — device does not support Apple Pay
  }
});
```

---

### `createButton(container, paymentData): HTMLElement`

Creates an `<apple-pay-button>` element, appends it to `container`, and wires up click → payment flow. Call only after `initialize()` resolves `true`.

```javascript
applePay.createButton('container-id', {
  amount: 29.99,
  currency: 'ZAR',
  countryCode: 'ZA',
  description: 'Order #1234'
});
```

---

### `requestPayment(paymentData): Promise<PaymentResult>`

Triggers the Apple Pay payment sheet directly (without a button).

```javascript
applePay.requestPayment({
  amount: 99.99,
  currency: 'ZAR',
  countryCode: 'ZA'
}).then(function(result) {
  console.log('Token:', result.token);
});
```

---

### Utility methods

| Method | Returns | Description |
|---|---|---|
| `generateTransactionId()` | `string` | RFC 4122 v4 UUID |
| `encodeToBase64(data)` | `string` | Base64 encode a string |
| `decodeFromBase64(b64)` | `object` | Decode and JSON-parse a Base64 string |
| `getSessionToken()` | `string \| null` | Last successful payment token |
| `clearSessionToken()` | `void` | Clears stored token |
| `isReady()` | `boolean` | Whether Apple Pay is available |
| `abort()` | `Promise<void>` | Abort in-progress payment |
| `destroy()` | `void` | Full cleanup — call on unmount |
| `logError(msg, err, ctx, reqId)` | `ErrorInfo` | Structured error log |
| `checkBrowserSupport()` *(static)* | `{supported, missing}` | Check APIs without instantiation |

---

## Error Codes

The SDK attaches a `code` property to thrown errors for programmatic handling.

| Code | Constant | Description |
|---|---|---|
| E001 | `INVALID_CONFIG` | Configuration is malformed |
| E002 | `MISSING_MERCHANT_ID` | `merchantIdentifier` is missing |
| E003 | `INVALID_MODE` | Mode must be `development` or `production` |
| E100 | `BROWSER_UNSUPPORTED` | Browser lacks required APIs |
| E101 | `PAYMENT_REQUEST_API_UNSUPPORTED` | Payment Request API not available |
| E102 | `APPLE_PAY_UNAVAILABLE` | Device/Wallet not set up |
| E200 | `INITIALIZATION_FAILED` | SDK init failed |
| E201 | `RATE_LIMIT_EXCEEDED` | Too many requests (3 per second per instance) |
| E202 | `SCRIPT_LOAD_TIMEOUT` | Apple Pay JS timed out loading |
| E203 | `SCRIPT_LOAD_FAILED` | Apple Pay JS CDN fetch failed |
| E204 | `SRI_HASH_MISSING` | SRI integrity constant not configured |
| E300 | `PAYMENT_CANCELLED` | User dismissed the payment sheet |
| E301 | `PAYMENT_FAILED` | Payment rejected |
| E302 | `TOKEN_GENERATION_FAILED` | Could not encode token |
| E303 | `INVALID_PAYMENT_DATA` | Amount or currency validation failed |
| E304 | `MERCHANT_VALIDATION_FAILED` | Backend validation endpoint failed |
| E400 | `VALIDATION_ERROR` | Input validation failed |
| E401 | `SANITIZATION_ERROR` | Input sanitization failed |

---

## Merchant Validation (Server-side requirement)

Apple Pay requires your server to perform a mutual TLS handshake with Apple's servers. The SDK's `validationEndpoint` must point to an HTTPS endpoint on your server that:

1. Receives a `POST` with a JSON body containing `validationURL`, `merchantIdentifier`, `displayName`, and `domainName`
2. Makes an mTLS request to Apple's validation URL using your Apple Pay merchant certificate
3. Returns the merchant session object received from Apple

This server-side implementation is outside the scope of the client SDK. Refer to Apple's [Merchant Validation documentation](https://developer.apple.com/documentation/apple_pay_on_the_web/apple_pay_js_api/providing_merchant_validation).

---

## Framework Examples

### React

```jsx
import { useEffect, useRef } from 'react';
import VqDigitalWalletApple from 'vq-digitalwallet-apple';

function ApplePayButton({ amount, onSuccess }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const applePay = new VqDigitalWalletApple({
      mode: 'production',
      merchantIdentifier: 'merchant.com.example',
      merchantName: 'Example Store',
      validationEndpoint: 'https://your-server.com/applepay/validate',
      onTokenGenerated(token, error) {
        if (error) console.error(error);
        else onSuccess(token);
      }
    });

    applePay.initialize().then(isReady => {
      if (isReady) {
        applePay.createButton(containerRef.current, {
          amount,
          currency: 'ZAR',
          countryCode: 'ZA'
        });
      }
    });

    return () => applePay.destroy();
  }, [amount, onSuccess]);

  return <div ref={containerRef} />;
}
```

### Vue

```vue
<template>
  <div ref="applePayButton"></div>
</template>

<script>
import VqDigitalWalletApple from 'vq-digitalwallet-apple';

export default {
  props: ['amount'],
  mounted() { this.initApplePay(); },
  beforeDestroy() { this.applePay?.destroy(); },
  methods: {
    async initApplePay() {
      this.applePay = new VqDigitalWalletApple({
        mode: 'production',
        merchantIdentifier: 'merchant.com.example',
        merchantName: 'Example Store',
        validationEndpoint: 'https://your-server.com/applepay/validate',
        onTokenGenerated: (token, error) =>
          error ? this.$emit('payment-error', error) : this.$emit('payment-success', token)
      });

      const isReady = await this.applePay.initialize();
      if (isReady) {
        this.applePay.createButton(this.$refs.applePayButton, {
          amount: this.amount,
          currency: 'ZAR',
          countryCode: 'ZA'
        });
      }
    }
  }
};
</script>
```

### Angular

```typescript
// apple-pay.service.ts
import { Injectable } from '@angular/core';
import VqDigitalWalletApple, {
  VqDigitalWalletAppleConfig,
  PaymentData
} from 'vq-digitalwallet-apple';

@Injectable({ providedIn: 'root' })
export class ApplePayService {
  private sdk: VqDigitalWalletApple | null = null;

  async initialize(config: VqDigitalWalletAppleConfig): Promise<boolean> {
    this.sdk = new VqDigitalWalletApple(config);
    return this.sdk.initialize();
  }

  createButton(container: HTMLElement, data: PaymentData): HTMLElement {
    return this.sdk!.createButton(container, data);
  }

  destroy(): void {
    this.sdk?.destroy();
    this.sdk = null;
  }
}
```

---

## Development

```bash
git clone https://github.com/Veritas-Quaesitor/vq-digitalwallet-apple.git
cd vq-digitalwallet-apple
npm install
npm test          # 38 tests
npm run build     # IIFE + UMD
npm run lint      # ESLint
npm run docs      # JSDoc → docs/
```

---

## Security

This SDK enforces the following protections:

| CWE | Attack | Mitigation |
|---|---|---|
| CWE-79 | XSS via config fields | Dangerous characters stripped from string inputs |
| CWE-116 | Improper neutralization | `sanitizeString()` strips `<>\\` and encodes quotes |
| CWE-20 | Improper input validation | All config fields validated; null/empty config throws |
| CWE-400 | Resource exhaustion | Field length limits enforced; oversized input rejected |
| CWE-770 | Allocation without limits | Per-instance rate limiting (3 req/s); never shared |
| CWE-1321 | Prototype pollution | `extendDeep()` filters `__proto__`, `constructor`, `prototype` |

---

## License

MIT — see [LICENSE](./LICENSE).

---

*Made by [Veritas Quaesitor](https://github.com/Veritas-Quaesitor)*
