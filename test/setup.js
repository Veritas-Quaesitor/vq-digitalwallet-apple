// test/setup.js

// ============================================================================
// BASE64 MOCKS (Matches your Google Pay setup)
// ============================================================================

global.btoa = jest.fn((str) => Buffer.from(str, "binary").toString("base64"));
global.atob = jest.fn((str) => Buffer.from(str, "base64").toString("binary"));

// ============================================================================
// CRYPTO MOCK (For UUIDs and random values)
// ============================================================================

Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn(() => "12345678-1234-4567-8901-123456789012"),
    getRandomValues: jest.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  },
  writable: true,
});

// ============================================================================
// DOM & SCRIPT LOADING MOCKS (CRITICAL FIX FOR TIMEOUTS)
// ============================================================================

/**
 * We mock document.createElement to return an object that mimics a script tag.
 * When this script is "appended" to the head, we manually trigger onload.
 */
const mockElements = new Map();

Object.defineProperty(document, "createElement", {
  value: jest.fn((tagName) => {
    const element = {
      tagName: tagName.toUpperCase(),
      appendChild: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      style: {},
      // Script specific properties
      src: "",
      async: false,
      onload: null,
      onerror: null,
    };

    return element;
  }),
  writable: true,
});

Object.defineProperty(document, "head", {
  value: {
    appendChild: jest.fn((el) => {
      // FIX: If a script is appended, trigger onload immediately to prevent SDK timeout
      if (el && el.tagName === "SCRIPT" && typeof el.onload === "function") {
        // Use setImmediate or process.nextTick to simulate async browser load
        process.nextTick(() => {
          if (el.onload) el.onload();
        });
      }
      return el;
    }),
  },
  writable: true,
});

Object.defineProperty(document, "getElementById", {
  value: jest.fn((id) => ({
    id: id,
    appendChild: jest.fn(),
    innerHTML: "",
    style: {},
  })),
  writable: true,
});

Object.defineProperty(document, "querySelector", {
  value: jest.fn(() => null), // Default: no pre-existing script tag
  writable: true,
  configurable: true,
});

// Mock CSS.supports for createButton logic
Object.defineProperty(global, "CSS", {
  value: {
    supports: jest.fn(() => true), // Assume modern browser for tests
  },
  writable: true,
});

// ============================================================================
// APPLE PAY BUTTON MOCK
// ============================================================================

if (!global.customElements) {
  global.customElements = {
    define: jest.fn(),
    get: jest.fn(),
  };
}

if (!global.customElements.get("apple-pay-button")) {
  global.customElements.define(
    "apple-pay-button",
    class ApplePayButtonMock extends HTMLElement {},
  );
}

// ============================================================================
// PAYMENT REQUEST API MOCK
// ============================================================================

class PaymentRequestMock {
  constructor(methodData, details, options) {
    this.methodData = methodData;
    this.details = details;
    this.options = options;
    this._eventHandlers = {};
  }

  canMakePayment() {
    return Promise.resolve(true);
  }

  show() {
    return Promise.resolve({
      details: { paymentData: { data: "mock-payment-data" } },
      complete: jest.fn(() => Promise.resolve()),
    });
  }

  abort() {
    return Promise.resolve();
  }

  addEventListener(type, handler) {
    this._eventHandlers[type] = handler;
  }

  removeEventListener(type) {
    delete this._eventHandlers[type];
  }
}

Object.defineProperty(global, "PaymentRequest", {
  value: PaymentRequestMock,
  writable: true,
  configurable: true,
});

// ============================================================================
// FETCH & ABORT CONTROLLER MOCKS
// ============================================================================

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ merchantSession: "mock-session-data" }),
  }),
);

global.AbortController = class AbortController {
  constructor() {
    this.signal = { aborted: false };
  }
  abort() {
    this.signal.aborted = true;
  }
};

// ============================================================================
// CONSOLE & TIMERS (Matches your Google Pay setup)
// ============================================================================

global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// We don't use jest.useFakeTimers() here to keep it simple like your GPay setup,
// but we mock the globals.
const originalSetTimeout = global.setTimeout;
global.setTimeout = jest.fn((fn, delay) => {
  // If the SDK is waiting for a timeout (like the 10s load timeout),
  // we don't want to actually wait 10s in the test.
  return originalSetTimeout(fn, 0);
});

global.clearTimeout = jest.fn();

const mockDate = new Date("2024-01-01T00:00:00.000Z");
global.Date = jest.fn(() => mockDate);
global.Date.now = jest.fn(() => mockDate.getTime());
global.Date.prototype = Date.prototype;

// ============================================================================
// GLOBAL RESET HOOKS
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();

  // Reset fetch default
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ merchantSession: "mock-session-data" }),
  });

  // Reset PaymentRequest defaults
  PaymentRequestMock.prototype.canMakePayment = jest.fn(() =>
    Promise.resolve(true),
  );
  PaymentRequestMock.prototype.show = jest.fn(() =>
    Promise.resolve({
      details: { paymentData: { data: "mock-payment-data" } },
      complete: jest.fn(() => Promise.resolve()),
    }),
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});
