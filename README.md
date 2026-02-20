# 🚀 Eccentric Apple Pay Client SDK

[![npm version](https://badge.fury.io/js/ecentric-applepay-clientsdk.svg)](https://badge.fury.io/js/ecentric-applepay-clientsdk) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/) [![Browser Support](https://img.shields.io/badge/Browser-Modern-green.svg)](https://apps.abacus.ai/chatllm/?appId=118c521cbc&convoId=1100197764#browser-compatibility)

A lightweight, JavaScript SDK for integrating **Apple Pay** with secure payment processing. Features advanced security, rate limiting, merchant validation, session management, and comprehensive error handling.

---

## ✨ Features

- 🔒 **Enterprise Security** - Advanced input validation and sanitization
- ⚡ **Rate Limiting** - Protection against excessive payment requests
- 🎯 **TypeScript Support** - Full `.d.ts` definitions included
- 🍎 **Enabled for Apple Pay on the Web** (iOS, macOS & iOS 18+ QR handshake)
- 📱 **Mobile Optimized** - Designed for modern commerce flows
- 🛡️ **Error Handling** - Clean, structured, comprehensive errors
- 📊 **Session Management** - Secure token storage and retrieval
- 🔧 **Easy Integration** - Simple and intuitive API

---

## 📦 Installation

### NPM

```bash
npm install ecentric-applepay-clientsdk
```

### Yarn

```bash
yarn add ecentric-applepay-clientsdk
```

### CDN

```html
<script src="https://unpkg.com/ecentric-applepay-clientsdk@latest/epsapplepay.js"></script>
```

---

## 🚀 Quick Start

### Basic Implementation

```javascript
// Initialize Apple Pay SDK
const applePay = new EpsApplePay({
    mode: 'development', // or 'production'
    merchantIdentifier: 'merchant.com.example',
    merchantName: 'Your Store Name',
    validationEndpoint: 'https://yourserver.com/applepay/validate',
    onTokenGenerated: function(token, error) {
        if (error) {
            console.error('Payment failed:', error);
        } else {
            console.log('Payment token:', token);
            // Send token to your backend for processing
        }
    }
});

// Initialize Apple Pay
applePay.initialize()
    .then(function(isReady) {
        if (isReady) {
            applePay.createButton('apple-pay-button', {
                amount: 299.99,
                currency: 'ZAR',
                countryCode: 'ZA'
            });
        } else {
            console.log('Apple Pay is not available');
        }
    })
    .catch(function(error) {
        console.error('Initialization failed:', error);
    });
```

---

### HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
    <title>Apple Pay Integration</title>
</head>
<body>
    <div id="apple-pay-button"></div>

    <script src="https://unpkg.com/ecentric-applepay-clientsdk@latest/epsapplepay.js"></script>
    <script>
        // Your SDK initialization here
    </script>
</body>
</html>
```

---

## 📚 API Documentation

### Configuration Options

| Option                 | Type                            | Required | Default                 | Description                           |
| ---------------------- | ------------------------------- | -------- | ----------------------- | ------------------------------------- |
| `mode`                 | `'development' \| 'production'` | ✅        | -                       | SDK environment                       |
| `merchantIdentifier`   | `string`                        | ✅        | -                       | Apple Merchant ID                     |
| `merchantName`         | `string`                        | ✅        | -                       | Shown in Apple Pay sheet              |
| `validationEndpoint`   | `string`                        | ✅        | -                       | Your server's merchant validation URL |
| `allowedCardNetworks`  | `string[]`                      | ❌        | `['masterCard','visa']` | Supported networks                    |
| `merchantCapabilities` | `string[]`                      | ❌        | `['supports3DS']`       | Capability flags                      |
| `onTokenGenerated`     | `(token,error) => void`         | ❌        | `null`                  | Payment token callback                |
| `scriptLoadTimeout`    | `number`                        | ❌        | `10000`                 | Script timeout                        |
| `requestTimeout`       | `number`                        | ❌        | `30000`                 | Payment timeout                       |

---

## Core Methods

### `initialize(): Promise<boolean>`

Initializes the SDK, loads Apple Pay JS, and checks availability.

```javascript
applePay.initialize()
  .then(isReady => {
      if (isReady) {
          console.log('Apple Pay is ready!');
      } else {
          console.log('Apple Pay unavailable');
      }
  })
  .catch(error => {
      console.error('Initialization failed:', error);
  });
```

---

### `createButton(container, paymentData): HTMLElement`

Creates an `<apple-pay-button>` inside the given container.

```javascript
applePay.createButton('apple-pay-button', {
    amount: 100,
    currency: 'ZAR',
    countryCode: 'ZA',
    description: 'Product Name'
});
```

---

### `requestPayment(paymentData): Promise<PaymentResult>`

Triggers the Apple Pay sheet.

```javascript
applePay.requestPayment({
    amount: 49.99,
    currency: 'ZAR',
    countryCode: 'ZA'
})
.then(result => {
    console.log('Token received:', result.token);
})
.catch(err => {
    console.error('Payment failed:', err);
});
```

---

### `validatePaymentData(paymentData): void`

Throws if invalid.

```javascript
try {
    applePay.validatePaymentData({
        amount: 0,
        currency: 'ZAR'
    });
} catch (err) {
    console.error('Invalid payment data:', err.message);
}
```

---

### Utility Methods

#### `generateTransactionId()`

```javascript
const tx = applePay.generateTransactionId();
console.log(tx);
```

#### `getSessionToken()`

```javascript
applePay.getSessionToken();
```

#### `clearSessionToken()`

```javascript
applePay.clearSessionToken();
```

#### `destroy()`

```javascript
applePay.destroy();
```

---

## 🔧 Advanced Usage

### TypeScript Example

```typescript
import EpsApplePay, { 
    EpsApplePayConfig, 
    PaymentData, 
    PaymentResult 
} from 'ecentric-applepay-clientsdk';

const config: EpsApplePayConfig = {
    mode: 'development',
    merchantIdentifier: 'merchant.com.example',
    merchantName: 'Test Merchant',
    validationEndpoint: '/api/validate',
    onTokenGenerated: (token, error) => {
        console.log(token, error);
    }
};

const applePay = new EpsApplePay(config);
```

---

## 🌐 Browser Compatibility

Apple Pay availability as of iOS 18+:

| Browser / Platform    | Support                    | Notes                    |
| --------------------- | -------------------------- | ------------------------ |
| **Safari (iOS)**      | ✅ Full                     | Native sheet             |
| **Safari (macOS)**    | ✅ Full                     | Native sheet             |
| **Chrome (iOS 18+)**  | ✅ Via QR Redirect Modal    | Uses Apple’s relay sheet |
| **Firefox (iOS 18+)** | ✅ Via QR Redirect Modal    | Same as Chrome           |
| **Edge (iOS 18+)**    | ✅ Via QR Redirect Modal    | Same as Chrome           |
| **Chrome desktop**    | ⚠️ QR modal if enabled     | Uses Apple relay screen  |
| **Firefox desktop**   | ⚠️ QR modal if enabled     | Depends on iOS relaying  |
| **In-App WebViews**   | ⚠️ Depends on entitlements | PR API required          |

### Apple Pay on the Web (QR Relay Mode)

Apple introduced **QR-based handoff**:

- Non-Safari browsers show a modal with QR code
- User scans with Apple device
- Payment continues on Apple Wallet
- Token delivered back to webpage

**This SDK fully supports this flow.**

---

## 🔒 Security Features

- Input sanitization
- Merchant validation
- Rate limiting
- Error normalization
- Safe token management
- UUID-based transaction IDs

---

## 🚨 Validation

| Error                            | Description         | Solution                          |
| -------------------------------- | ------------------- | --------------------------------- |
| `merchantIdentifier is required` | Missing merchant ID | Provide Merchant ID               |
| `validationEndpoint is required` | No backend URL      | Implement validation route        |
| `Invalid mode`                   | Invalid config      | Use `development` or `production` |
| `Amount must be greater than 0`  | Validation failure  | Fix amount                        |
| `Too many payment requests`      | Rate limit exceeded | Slow down requests                |

---

## 🚨 Error Codes

The SDK provides a `code` property on error objects for programmatic handling.

| Code     | Constant                     | Description                                |
| -------- | ---------------------------- | ------------------------------------------ |
| **E001** | `INVALID_CONFIG`             | Configuration object is malformed          |
| **E002** | `MISSING_MERCHANT_ID`        | `merchantIdentifier` is missing            |
| **E003** | `INVALID_MODE`               | Mode must be `development` or `production` |
| **E100** | `BROWSER_UNSUPPORTED`        | Browser does not support Apple Pay         |
| **E102** | `APPLE_PAY_UNAVAILABLE`      | Hardware/Wallet not set up                 |
| **E201** | `RATE_LIMIT_EXCEEDED`        | Too many requests (3 per second)           |
| **E202** | `SCRIPT_LOAD_TIMEOUT`        | Apple Pay JS failed to load in time        |
| **E300** | `PAYMENT_CANCELLED`          | User closed the Apple Pay sheet            |
| **E301** | `PAYMENT_FAILED`             | Payment rejected by Apple/Bank             |
| **E303** | `INVALID_PAYMENT_DATA`       | Amount or Currency validation failed       |
| **E304** | `MERCHANT_VALIDATION_FAILED` | Backend validation endpoint failed         |

---

## 📖 Examples

### React Example

```jsx
import React, { useEffect, useRef } from 'react';
import EpsApplePay from 'ecentric-applepay-clientsdk';

function ApplePayButton({ amount, onPaymentSuccess }) {
    const buttonRef = useRef(null);

    useEffect(() => {
        const applePay = new EpsApplePay({
            mode: 'development',
            merchantIdentifier: 'merchant.com.example',
            merchantName: 'React Store',
            validationEndpoint: '/api/validate',
            onTokenGenerated(token, error) {
                if (error) console.error(error);
                else onPaymentSuccess(token);
            }
        });

        applePay.initialize().then(isReady => {
            if (isReady) {
                applePay.createButton(buttonRef.current, {
                    amount,
                    currency: 'ZAR',
                    countryCode: 'ZA'
                });
            }
        });

        return () => applePay.destroy();
    }, [amount, onPaymentSuccess]);

    return <div ref={buttonRef}></div>;
}
```

---

### Vue Example

```vue
<template>
  <div ref="applePayButton"></div>
</template>

<script>
import EpsApplePay from 'ecentric-applepay-clientsdk';

export default {
  props: ['amount'],
  mounted() { this.initApplePay(); },
  beforeDestroy() { this.applePay?.destroy(); },
  methods: {
    async initApplePay() {
      this.applePay = new EpsApplePay({
        mode: 'development',
        merchantIdentifier: 'merchant.com.example',
        merchantName: 'Vue Store',
        validationEndpoint: '/api/validate',
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

---

### Angular Example

```typescript
// apple-pay.service.ts
import { Injectable } from '@angular/core';
import EpsApplePay, { EpsApplePayConfig, PaymentData } from 'ecentric-applepay-clientsdk';

@Injectable({ providedIn: 'root' })
export class ApplePayService {
  private applePay: any;

  async initialize(config: EpsApplePayConfig) {
    this.applePay = new EpsApplePay(config);
    return this.applePay.initialize();
  }

  createButton(container: HTMLElement, data: PaymentData) {
    return this.applePay.createButton(container, data);
  }

  request(data: PaymentData) {
    return this.applePay.requestPayment(data);
  }

  destroy() {
    this.applePay?.destroy();
  }
}
```

```typescript
// payment.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApplePayService } from './apple-pay.service';

@Component({
  selector: 'app-payment',
  template: `<div #applePayButton></div>`
})
export class PaymentComponent implements OnInit {
  @ViewChild('applePayButton') btn!: ElementRef;

  constructor(private applePay: ApplePayService) {}

  async ngOnInit() {
    const ready = await this.applePay.initialize({
      mode: 'development',
      merchantIdentifier: 'merchant.com.example',
      merchantName: 'Angular Store',
      validationEndpoint: '/api/validate',
      onTokenGenerated: (token, error) => console.log(token, error)
    });

    if (ready) {
      this.applePay.createButton(this.btn.nativeElement, {
        amount: 100,
        currency: 'ZAR',
        countryCode: 'ZA'
      });
    }
  }
}
```

---

## Development Setup

```bash
git clone https://dev.azure.com/epsdev/OnlinePayments/_git/Ecentric.ApplePay.ClientSdk
npm install
npm test
npm run build
npm run docs
```

---

## 📝 License

MIT License — included in repository.

---

## 🆘 Support

- 📧 [support@ecentric.co.za](mailto:support@ecentric.co.za)
- 📖 Docs: [https://ecentric.readme.io](https://ecentric.readme.io/)
- 🐛 Issues: https://dev.azure.com/epsdev/OnlinePayments/_git/Ecentric.ApplePay.ClientSdk/issues

---

## 🏷️ Version History

### v1.1.0

- TypeScript support
- Full Apple Pay QR Relay compatibility
- Improved validation
- Rate limiting
- Session token handling

### v1.0.0

- Core Apple Pay integration
- Basic payment flow
- Initial release

---

### Made with ❤️ by [Ecentric](https://ecentric.co.za/)