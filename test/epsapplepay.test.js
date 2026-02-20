// test/epsapplepay.test.js

const fs = require("fs");
const path = require("path");

const moduleCode = fs.readFileSync(
  path.join(__dirname, "../src/epsapplepay.js"),
  "utf8"
);

const mockWindow = {
  btoa: global.btoa,
  atob: global.atob,
  crypto: global.crypto,
  document: global.document,
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  console: global.console,
  Promise: global.Promise,
  Date: global.Date,
  Math: global.Math,
  Array: global.Array,
  Object: global.Object,
  JSON: global.JSON,
  Error: global.Error,
  TypeError: global.TypeError,
  PaymentRequest: global.PaymentRequest,
  AbortController: global.AbortController,
  fetch: global.fetch,
  CSS: global.CSS,
};

mockWindow.location = {
  href: "https://example.com/checkout",
  hostname: "example.com",
};

let EpsApplePay;

try {
  const fn = new Function(
    "window","global","document","console",
    "setTimeout","clearTimeout","btoa","atob","crypto",
    "Promise","Date","Math","Array","Object","JSON",
    "Error","TypeError","fetch","AbortController","CSS",
    `
      ${moduleCode}
      return window.EpsApplePay;
    `
  );

  EpsApplePay = fn(
    mockWindow, mockWindow, mockWindow.document, mockWindow.console,
    mockWindow.setTimeout, mockWindow.clearTimeout,
    mockWindow.btoa, mockWindow.atob, mockWindow.crypto,
    mockWindow.Promise, mockWindow.Date, mockWindow.Math,
    mockWindow.Array, mockWindow.Object, mockWindow.JSON,
    mockWindow.Error, mockWindow.TypeError,
    mockWindow.fetch, mockWindow.AbortController, mockWindow.CSS
  );
} catch (err) {
  console.error("SDK load failed:", err);
  throw err;
}

if (!EpsApplePay) throw new Error("EpsApplePay not found");

// ============================================================================
// HELPERS
// ============================================================================

function makeConfig(o = {}) {
  return {
    merchantIdentifier: "merchant.com.example",
    merchantName: "Example Store",
    mode: "development",
    allowedCardNetworks: ["masterCard", "visa"],
    merchantCapabilities: ["supports3DS"],
    validationEndpoint: "https://example.com/applepay/validate",
    scriptLoadTimeout: 10000,
    requestTimeout: 30000,
    paymentOptions: {
      requestPayerName: false,
      requestBillingAddress: false,
      requestPayerEmail: false,
      requestPayerPhone: false,
      requestShipping: false,
      shippingType: "shipping",
    },
    onTokenGenerated: jest.fn(),
    ...o,
  };
}

function makePaymentData(o = {}) {
  return {
    amount: 99.99,
    currency: "ZAR",
    countryCode: "ZA",
    transactionId: "tx-123",
    description: "Test",
    ...o,
  };
}

async function makeSdk(configOverrides = {}) {
  const sdk = EpsApplePay(makeConfig(configOverrides));
  await sdk.initialize();
  return sdk;
}

// ============================================================================
// MODULE LOADING
// ============================================================================

describe("EpsApplePay - Module loading", () => {
  test("loaded and has version", () => {
    expect(EpsApplePay).toBeDefined();
    expect(EpsApplePay.version).toBeDefined();
  });

  test("can create instance without new", () => {
    const sdk = EpsApplePay(makeConfig());
    expect(sdk).toBeDefined();
  });
});

// ============================================================================
// INITIALIZATION
// ============================================================================

describe("EpsApplePay - Initialization", () => {
  let sdk;

  afterEach(async () => {
    // Wait for any internal SDK timers to finish before destroying
    await new Promise((r) => setTimeout(r, 50));
    if (sdk && sdk.destroy) sdk.destroy();
    sdk = null;
  });

  test("valid config creates instance", () => {
    sdk = EpsApplePay(makeConfig());
    expect(sdk.config.merchantIdentifier).toBe("merchant.com.example");
  });

  test("missing merchantIdentifier throws", () => {
    expect(() =>
      EpsApplePay(makeConfig({ merchantIdentifier: "" }))
    ).toThrow(/merchantIdentifier/i);
  });

  test("missing merchantName throws", () => {
    expect(() =>
      EpsApplePay(makeConfig({ merchantName: "" }))
    ).toThrow(/merchantName/i);
  });

  test("invalid mode throws", () => {
    expect(() =>
      EpsApplePay(makeConfig({ mode: "invalid" }))
    ).toThrow(/invalid mode/i);
  });

  test("initialize succeeds when canMakePayment true", async () => {
    sdk = EpsApplePay(makeConfig());
    await expect(sdk.initialize()).resolves.toBe(true);
  });

  test("initialize returns false when canMakePayment false", async () => {
    PaymentRequest.prototype.canMakePayment = jest.fn(() => Promise.resolve(false));
    sdk = EpsApplePay(makeConfig());
    await expect(sdk.initialize()).resolves.toBe(false);
  });
});

// ============================================================================
// PAYMENT FLOW
// ============================================================================

describe("EpsApplePay - Payment flow", () => {
  test("accepts valid payment data", async () => {
    const sdk = await makeSdk();
    expect(() => sdk.requestPayment(makePaymentData())).not.toThrow();
    await new Promise((r) => setTimeout(r, 50));
    sdk.destroy();
  });

  test("rejects invalid currency", async () => {
    const sdk = await makeSdk();
    expect(() =>
      sdk.requestPayment(makePaymentData({ currency: "USD" }))
    ).toThrow(/not supported/i);
    await new Promise((r) => setTimeout(r, 50));
    sdk.destroy();
  });

  test("rejects amount <= 0", async () => {
    const sdk = await makeSdk();
    expect(() =>
      sdk.requestPayment(makePaymentData({ amount: 0 }))
    ).toThrow(/greater than 0/i);
    await new Promise((r) => setTimeout(r, 50));
    sdk.destroy();
  });

  test("produces successful PaymentResult", async () => {
    const sdk = await makeSdk();
    const r = await sdk.requestPayment(makePaymentData());
    expect(r.success).toBe(true);
    expect(typeof r.token).toBe("string");
    await new Promise((r) => setTimeout(r, 50));
    sdk.destroy();
  });

  test("stores session token", async () => {
    const sdk = await makeSdk();
    expect(sdk.getSessionToken()).toBeNull();
    await sdk.requestPayment(makePaymentData());
    expect(typeof sdk.getSessionToken()).toBe("string");
    await new Promise((r) => setTimeout(r, 50));
    sdk.destroy();
  });
});

// ============================================================================
// CREATE BUTTON
// ============================================================================

describe("EpsApplePay - createButton", () => {
  let sdk;
  let container;

  beforeAll(async () => {
    sdk = EpsApplePay(makeConfig());
    await sdk.initialize();
  });

  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 50));
    if (sdk && sdk.destroy) sdk.destroy();
    sdk = null;
  });

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "applepay-container";
    document.getElementById.mockImplementation((id) =>
      id === "applepay-container" ? container : null
    );
  });

  test("creates button in container element", () => {
    const btn = sdk.createButton(container, makePaymentData());
    expect(btn.tagName).toBe("APPLE-PAY-BUTTON");
    expect(container.appendChild).toHaveBeenCalledWith(btn);
  });

  test("creates button using container ID", () => {
    const btn = sdk.createButton("applepay-container", makePaymentData());
    expect(container.appendChild).toHaveBeenCalledWith(btn);
  });

  test("throws when not ready", () => {
    const original = sdk._isReadyToPay;
    sdk._isReadyToPay = false;
    expect(() => sdk.createButton(container, makePaymentData())).toThrow(/not ready/i);
    sdk._isReadyToPay = original;
  });
});

// ============================================================================
// UTILITIES
// ============================================================================

describe("EpsApplePay - utilities", () => {
  let sdk;

  beforeEach(() => {
    sdk = EpsApplePay(makeConfig());
  });

  afterEach(async () => {
    await new Promise((r) => setTimeout(r, 50));
    if (sdk && sdk.destroy) sdk.destroy();
    sdk = null;
  });

  test("base64 encode/decode works", () => {
    const payload = JSON.stringify({ x: 1 });
    const enc = sdk.encodeToBase64(payload);
    const dec = sdk.decodeFromBase64(enc);
    expect(dec).toEqual({ x: 1 });
  });

  test("transactionId is UUID-like", () => {
    const id = sdk.generateTransactionId();
    expect(id.length).toBeGreaterThan(0);
  });

  test("session token get/set/clear", () => {
    expect(sdk.getSessionToken()).toBeNull();
    sdk._sessionToken = "t123";
    expect(sdk.getSessionToken()).toBe("t123");
    sdk.clearSessionToken();
    expect(sdk.getSessionToken()).toBeNull();
  });

  test("logError returns ErrorInfo", () => {
    const err = new Error("Under");
    err.code = "E1";
    const info = sdk.logError("msg", err, "ctx", "req1");
    expect(info.code).toBe("E1");
    expect(info.context).toBe("ctx");
    expect(info.requestId).toBe("req1");
  });
});

// ============================================================================
// DESTROY & ABORT
// ============================================================================

describe("EpsApplePay - destroy & abort", () => {
  let sdk;

  beforeEach(() => {
    sdk = EpsApplePay(makeConfig());
  });

  afterEach(async () => {
    await new Promise((r) => setTimeout(r, 50));
    if (sdk && sdk.destroy) sdk.destroy();
    sdk = null;
  });

  test("abort resolves", async () => {
    await expect(sdk.abort()).resolves.toBeUndefined();
  });

  test("destroy clears config", () => {
    sdk.destroy();
    expect(sdk.config).toBeNull();
    expect(sdk._initialized).toBe(false);
  });
});