(function (global, factory) {
  "use strict";

  if (typeof module === "object" && typeof module.exports === "object") {
    // CommonJS/Node.js
    module.exports = factory(global, true);
  } else if (typeof define === "function" && define.amd) {
    // AMD
    define(function () {
      return factory(global);
    });
  } else {
    // Browser global
    factory(global);
  }
})(
  typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
      ? global
      : typeof self !== "undefined"
        ? self
        : this,
  function (window, noGlobal) {
    "use strict";

    // ============================================================================
    // CONSTANTS & CONFIGURATION
    // ============================================================================

    /**
     * Current SDK version
     * @constant {string}
     * @readonly
     */
    var VERSION = "1.1.0";

    /**
     * Apple Pay API version
     * @constant {number}
     * @readonly
     */
    var APPLE_PAY_VERSION = 3;

    /**
     * Valid SDK operational modes
     * @constant {string[]}
     * @readonly
     */
    var VALID_MODES = ["development", "production"];

    /**
     * Supported currency codes
     * @constant {string[]}
     * @readonly
     */
    var VALID_CURRENCIES = ["ZAR"];

    /**
     * Default country code for South African market
     * @constant {string}
     * @readonly
     */
    var DEFAULT_COUNTRY_CODE = "ZA";

    /**
     * Rate limiting configuration
     * @constant {number}
     * @readonly
     */
    var MAX_REQUESTS_PER_WINDOW = 3;

    /**
     * Rate limiting window in milliseconds
     * @constant {number}
     * @readonly
     */
    var RATE_LIMIT_WINDOW_MS = 1000;

    /**
     * Default request timeout in milliseconds
     * @constant {number}
     * @readonly
     */
    var DEFAULT_REQUEST_TIMEOUT_MS = 30000;

    /**
     * Apple Pay SDK CDN URL
     * @constant {string}
     * @readonly
     */
    var APPLE_PAY_SDK_URL =
      "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";

    /**
     * Subresource Integrity hash for Apple Pay SDK
     * @constant {string}
     * @readonly
     * @security Critical for preventing supply chain attacks
     */
    var APPLE_PAY_SDK_SRI =
      "sha384-7KJIkGT+8p0K2rhsEQcz7zZ+nYUFUbN573ZKSgwp9YKN7uUC+h5TAhEIdOAZgo6R";

    // ============================================================================
    // TYPE DEFINITIONS (JSDoc)
    // ============================================================================

    /**
     * Payment options configuration for Payment Request API
     * @typedef {Object} PaymentOptions
     * @property {boolean} [requestPayerName=false] - Request payer's name
     * @property {boolean} [requestBillingAddress=false] - Request billing address
     * @property {boolean} [requestPayerEmail=false] - Request payer's email
     * @property {boolean} [requestPayerPhone=false] - Request payer's phone
     * @property {boolean} [requestShipping=false] - Request shipping address
     * @property {string} [shippingType="shipping"] - Shipping type
     */

    /**
     * SDK configuration options
     * @typedef {Object} VqDigitalWalletAppleConfig
     * @property {string} merchantIdentifier - Apple Pay merchant identifier (required)
     * @property {string} merchantName - Display name shown to customer (required)
     * @property {string} [mode="development"] - SDK mode: 'development' or 'production'
     * @property {string[]} [allowedCardNetworks=["masterCard","visa"]] - Supported card networks
     * @property {string[]} [merchantCapabilities=["supports3DS"]] - Merchant capabilities
     * @property {string} [buttonStyle="black"] - Apple Pay button style
     * @property {string} [buttonType="buy"] - Apple Pay button type
     * @property {string} [buttonLocale="en-ZA"] - Button locale
     * @property {TokenGeneratedCallback} [onTokenGenerated] - Callback for token generation
     * @property {number} [scriptLoadTimeout=10000] - Script load timeout in ms
     * @property {string} [validationEndpoint] - Merchant validation endpoint URL (must support CORS if external)
     * @property {number} [requestTimeout=30000] - Payment request timeout in ms
     * @property {string} [cspNonce] - CSP nonce for inline script/style injection
     * @property {PaymentOptions} [paymentOptions] - Payment options for Payment Request API
     */

    /**
     * Payment data for transaction
     * @typedef {Object} PaymentData
     * @property {number} amount - Payment amount (0.01 to 999999.99)
     * @property {string} currency - Currency code (e.g., 'ZAR')
     * @property {string} [countryCode="ZA"] - ISO 3166-1 alpha-2 country code
     * @property {string} [transactionId] - Unique transaction identifier
     * @property {string} [description] - Payment description
     */

    /**
     * Payment processing result
     * @typedef {Object} PaymentResult
     * @property {boolean} success - Whether payment succeeded
     * @property {string} [token] - Base64 encoded payment token
     * @property {string} [transactionId] - Transaction identifier
     * @property {string} message - Human-readable result message
     * @property {ErrorInfo} [error] - Error details if failed
     */

    /**
     * Error information structure
     * @typedef {Object} ErrorInfo
     * @property {string} code - Error code
     * @property {string} message - Error message
     * @property {string} [details] - Detailed error information
     * @property {string} context - Operation context where error occurred
     * @property {string} timestamp - ISO 8601 timestamp
     * @property {string} sdkVersion - SDK version
     * @property {string} [requestId] - Associated request ID
     */

    /**
     * Token generation callback function
     * @callback TokenGeneratedCallback
     * @param {string|null} token - Generated payment token or null on error
     * @param {ErrorInfo|null} error - Error information or null on success
     * @returns {void}
     */

    /**
     * Rate limiter state for instance isolation
     * @typedef {Object} RateLimiterState
     * @property {number} requestCount - Requests in current window
     * @property {number} windowStart - Timestamp of current window start
     */

    // ============================================================================
    // DEFAULT CONFIGURATION
    // ============================================================================

    /**
     * Default configuration values
     * @constant {VqDigitalWalletAppleConfig}
     * @readonly
     */
    var DEFAULTS = {
      mode: "development",
      merchantIdentifier: "",
      merchantName: "",
      allowedCardNetworks: ["masterCard", "visa"],
      merchantCapabilities: ["supports3DS"],
      buttonStyle: "black",
      buttonType: "buy",
      buttonLocale: "en-ZA",
      onTokenGenerated: null,
      scriptLoadTimeout: 10000,
      validationEndpoint: "",
      requestTimeout: DEFAULT_REQUEST_TIMEOUT_MS,
      cspNonce: "",
      paymentOptions: {
        requestPayerName: false,
        requestBillingAddress: false,
        requestPayerEmail: false,
        requestPayerPhone: false,
        requestShipping: false,
        shippingType: "shipping",
      },
    };

    // ============================================================================
    // ERROR CODES
    // ============================================================================

    /**
     * Error codes for standardized error handling
     * @constant {Object<string, string>}
     * @readonly
     */
    var ERROR_CODES = {
      // Configuration errors
      INVALID_CONFIG: "E001",
      MISSING_MERCHANT_ID: "E002",
      INVALID_MODE: "E003",
      // Browser/support errors
      BROWSER_UNSUPPORTED: "E100",
      PAYMENT_REQUEST_API_UNSUPPORTED: "E101",
      APPLE_PAY_UNAVAILABLE: "E102",
      // Runtime errors
      INITIALIZATION_FAILED: "E200",
      RATE_LIMIT_EXCEEDED: "E201",
      SCRIPT_LOAD_TIMEOUT: "E202",
      SCRIPT_LOAD_FAILED: "E203",
      SRI_HASH_MISSING: "E204",
      // Payment errors
      PAYMENT_CANCELLED: "E300",
      PAYMENT_FAILED: "E301",
      TOKEN_GENERATION_FAILED: "E302",
      INVALID_PAYMENT_DATA: "E303",
      MERCHANT_VALIDATION_FAILED: "E304",
      // Security errors
      VALIDATION_ERROR: "E400",
      SANITIZATION_ERROR: "E401",
    };

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    /**
     * Extends target object with properties from source objects (deep extend)
     * @private
     * @param {Object} target - Target object to extend
     * @param {...Object} sources - Source objects to merge
     * @param {number} [_depth] - Internal recursion depth tracker
     * @returns {Object} Extended target object
     * @throws {Error} When maximum depth exceeded (circular reference protection)
     */
    var FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

    function extendDeep(target) {
      var sources = Array.prototype.slice.call(arguments, 1);
      var _depth = 0;

      // Check if last argument is the depth tracker (internal use)
      var lastArg = sources[sources.length - 1];
      if (typeof lastArg === "number") {
        _depth = lastArg;
        sources = sources.slice(0, -1);
      }

      // Protect against circular references and excessive nesting
      if (_depth > 10) {
        throw new Error(
          "extendDeep: Maximum depth exceeded (possible circular reference)",
        );
      }

      sources.forEach(function (source) {
        if (!source || typeof source !== "object") return;
        Object.keys(source).forEach(function (key) {
          if (FORBIDDEN_KEYS.indexOf(key) !== -1) return;
          var sourceVal = source[key];
          var targetVal = target[key];
          if (
            sourceVal &&
            typeof sourceVal === "object" &&
            !Array.isArray(sourceVal) &&
            targetVal &&
            typeof targetVal === "object" &&
            !Array.isArray(targetVal)
          ) {
            target[key] = extendDeep({}, targetVal, sourceVal, _depth + 1);
          } else {
            target[key] = sourceVal;
          }
        });
      });
      return target;
    }

    /**
     * Checks if value is null, undefined, or empty
     * @private
     * @param {*} value - Value to check
     * @returns {boolean} True if null/undefined/empty
     */
    function isNullOrEmpty(value) {
      if (value == null) return true;
      if (typeof value === "string") return value.trim() === "";
      if (Array.isArray(value)) return value.length === 0;
      if (
        typeof value === "object" &&
        Object.prototype.toString.call(value) === "[object Object]"
      ) {
        return Object.keys(value).length === 0;
      }
      return false;
    }

    /**
     * Validates Base64 string format
     * @private
     * @param {string} str - String to validate
     * @returns {boolean} True if valid Base64
     */
    function isValidBase64(str) {
      if (typeof str !== "string" || str.length === 0) return false;

      // Remove whitespace (atob tolerates it)
      var normalized = str.replace(/\s/g, "");

      // Check for valid Base64 characters only
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) return false;

      // Check length is multiple of 4
      if (normalized.length % 4 !== 0) return false;

      try {
        atob(normalized);
        return true;
      } catch (e) {
        return false;
      }
    }

    /**
     * Sanitizes string input against XSS and injection attacks
     * @private
     * @param {string} input - Input to sanitize
     * @param {number} [maxLength=255] - Maximum allowed length
     * @param {string} [fieldName="input"] - Field name for error reporting
     * @returns {string} Sanitized string
     * @throws {Error} When input is invalid type
     */
    function sanitizeString(input, maxLength, fieldName) {
      maxLength = maxLength || 255;
      fieldName = fieldName || "input";

      if (typeof input !== "string") {
        throw new Error(fieldName + " must be a string");
      }

      // Remove HTML/script injection vectors
      var sanitized = input.replace(/[<>\\]/g, "");

      // Encode quotes to preserve data while preventing injection
      sanitized = sanitized.replace(/"/g, "&quot;").replace(/'/g, "&#39;");

      // Trim whitespace
      var trimmed = sanitized.trim();

      // Enforce length limit
      if (trimmed.length > maxLength) {
        trimmed = trimmed.substring(0, maxLength);
      }

      return trimmed;
    }

    /**
     * Generates RFC4122 v4 UUID
     * @private
     * @returns {string} UUID v4 string
     */
    function generateUUID() {
      // Use crypto.randomUUID if available (modern browsers)
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        try {
          return crypto.randomUUID();
        } catch (e) {
          // Fall through to fallback
        }
      }

      // Use crypto.getRandomValues if available
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.getRandomValues === "function"
      ) {
        var array = new Uint8Array(16);
        crypto.getRandomValues(array);
        // Set version (4) and variant (10) bits
        array[6] = (array[6] & 0x0f) | 0x40;
        array[8] = (array[8] & 0x3f) | 0x80;

        var hex = Array.prototype.map
          .call(array, function (byte) {
            return ("0" + byte.toString(16)).slice(-2);
          })
          .join("");

        return [
          hex.slice(0, 8),
          hex.slice(8, 12),
          hex.slice(12, 16),
          hex.slice(16, 20),
          hex.slice(20, 32),
        ].join("-");
      }

      // Fallback for legacy environments (less secure)
      if (
        typeof console !== "undefined" &&
        typeof console.warn === "function"
      ) {
        console.warn(
          "[VqDigitalWalletApple] Using insecure UUID generation (Math.random). " +
            "Upgrade browser or add crypto polyfill for production use.",
        );
      }

      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          var r = (Math.random() * 16) | 0;
          var v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        },
      );
    }

    /**
     * Validates browser environment supports required APIs
     * @private
     * @throws {Error} When required APIs are unavailable
     */
    function validateBrowserSupport() {
      var missing = [];

      if (typeof Promise === "undefined") missing.push("Promise");
      if (typeof JSON === "undefined") missing.push("JSON");
      if (typeof btoa === "undefined" || typeof atob === "undefined")
        missing.push("Base64");
      if (typeof fetch === "undefined") missing.push("fetch");
      if (typeof AbortController === "undefined")
        missing.push("AbortController");

      if (missing.length > 0) {
        throw new Error(
          "Browser does not support required APIs: " +
            missing.join(", ") +
            ". Please use a modern browser or appropriate polyfills.",
        );
      }
    }

    // ============================================================================
    // APPLE PAY SDK LOADER
    // ============================================================================

    /**
     * Global state tracker for Apple Pay SDK loading
     * @private
     */
    var applePaySDKLoadingPromise = null;

    /**
     * Loads Apple Pay SDK with timeout, SRI, and CSP support
     * @private
     * @param {number} timeout - Timeout in milliseconds
     * @param {string} [cspNonce] - CSP nonce for script element
     * @returns {Promise<boolean>} Promise resolving when script is loaded
     */
    function loadApplePaySDK(timeout, cspNonce) {
      // Return existing promise if already loading
      if (applePaySDKLoadingPromise) {
        return applePaySDKLoadingPromise;
      }

      // Check if already loaded by verifying script tag exists and is loaded
      var existingScript = document.querySelector(
        'script[src*="applepay.cdn-apple.com"]',
      );
      if (existingScript && existingScript.readyState !== "loading") {
        return Promise.resolve(true);
      }

      applePaySDKLoadingPromise = new Promise(function (resolve, reject) {
        // Validate SRI hash is configured
        if (
          !APPLE_PAY_SDK_SRI ||
          APPLE_PAY_SDK_SRI.indexOf("PLACEHOLDER") !== -1 ||
          APPLE_PAY_SDK_SRI.trim() === ""
        ) {
          var sriError = new Error(
            "CRITICAL: SRI hash not configured for Apple Pay SDK. " +
              "Update APPLE_PAY_SDK_SRI constant before deployment.",
          );
          sriError.code = ERROR_CODES.SRI_HASH_MISSING;
          applePaySDKLoadingPromise = null;
          reject(sriError);
          return;
        }

        var script = document.createElement("script");
        script.src = APPLE_PAY_SDK_URL;
        script.async = true;
        script.crossOrigin = "anonymous";

        // Add SRI hash for security (supply chain attack prevention)
        script.integrity = APPLE_PAY_SDK_SRI;

        // Add CSP nonce if provided
        if (cspNonce) {
          script.nonce = cspNonce;
        }

        // Add referrer policy
        script.referrerPolicy = "no-referrer-when-downgrade";

        var timeoutId = setTimeout(function () {
          cleanup();
          applePaySDKLoadingPromise = null;
          var timeoutError = new Error(
            "Apple Pay SDK load timeout after " + timeout + "ms",
          );
          timeoutError.code = ERROR_CODES.SCRIPT_LOAD_TIMEOUT;
          reject(timeoutError);
        }, timeout || 10000);

        function cleanup() {
          clearTimeout(timeoutId);
          script.onload = null;
          script.onerror = null;
        }

        script.onload = function () {
          cleanup();
          applePaySDKLoadingPromise = null;
          resolve(true);
        };

        script.onerror = function () {
          cleanup();
          applePaySDKLoadingPromise = null;
          var loadError = new Error("Failed to load Apple Pay SDK from CDN");
          loadError.code = ERROR_CODES.SCRIPT_LOAD_FAILED;
          reject(loadError);
        };

        document.head.appendChild(script);
      });

      return applePaySDKLoadingPromise;
    }

    // ============================================================================
    // RATE LIMITER (Instance-isolated)
    // ============================================================================

    /**
     * Creates isolated rate limiter for instance
     * @private
     * @returns {RateLimiterState} Rate limiter state object
     */
    function createRateLimiter() {
      return {
        requestCount: 0,
        windowStart: 0,
      };
    }

    /**
     * Checks rate limit for instance
     * @private
     * @param {RateLimiterState} state - Rate limiter state
     * @throws {Error} When rate limit exceeded
     */
    function checkRateLimit(state) {
      var now = Date.now();

      if (now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
        // New window
        state.windowStart = now;
        state.requestCount = 1;
        return;
      }

      state.requestCount++;

      if (state.requestCount > MAX_REQUESTS_PER_WINDOW) {
        var retryAfter = Math.ceil(
          (RATE_LIMIT_WINDOW_MS - (now - state.windowStart)) / 1000,
        );
        var error = new Error(
          "Rate limit exceeded. Maximum " +
            MAX_REQUESTS_PER_WINDOW +
            " requests per " +
            RATE_LIMIT_WINDOW_MS / 1000 +
            " seconds. " +
            "Retry after " +
            retryAfter +
            " seconds.",
        );
        error.code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
        error.retryAfter = retryAfter;
        throw error;
      }
    }

    // ============================================================================
    // MAIN VQDIGITALWALLETAPPLE CONSTRUCTOR
    // ============================================================================

    /**
     * VqDigitalWalletApple SDK for Apple Pay integration
     * @constructor
     * @param {VqDigitalWalletAppleConfig} config - Configuration object
     * @throws {Error} When configuration is invalid
     * @example
     * var applePay = new VqDigitalWalletApple({
     *   merchantIdentifier: 'merchant.com.example',
     *   merchantName: 'Example Store',
     *   mode: 'production',
     *   onTokenGenerated: function(token, error) {
     *     if (error) console.error('Payment failed:', error);
     *     else console.log('Token:', token);
     *   }
     * });
     */
    function VqDigitalWalletApple(config) {
      if (!(this instanceof VqDigitalWalletApple)) {
        return new VqDigitalWalletApple(config);
      }
      return this.init(config);
    }

    // ============================================================================
    // PROTOTYPE METHODS
    // ============================================================================

    VqDigitalWalletApple.prototype = {
      constructor: VqDigitalWalletApple,

      /**
       * SDK version
       * @type {string}
       * @readonly
       */
      version: VERSION,

      /**
       * Initializes the SDK instance
       * @param {VqDigitalWalletAppleConfig} config - Configuration options
       * @returns {VqDigitalWalletApple} This instance for chaining
       * @throws {Error} When browser unsupported or config invalid
       */
      init: function (config) {
        // Validate browser capabilities first
        try {
          validateBrowserSupport();
        } catch (e) {
          var browserError = new Error(
            "Browser compatibility check failed: " + e.message,
          );
          browserError.code = ERROR_CODES.BROWSER_UNSUPPORTED;
          throw browserError;
        }

        // Deep merge configuration
        this.config = extendDeep({}, DEFAULTS, config || {});

        // Initialize instance state
        this._rateLimiter = createRateLimiter();
        this._isReadyToPay = false;
        this._sessionToken = null;
        this._currentPaymentRequest = null;
        this._abortController = null;
        this._initialized = false;
        this._instanceId = generateUUID();
        this._createdButtons = [];

        // Validate configuration
        this._validateConfig();

        this._initialized = true;

        if (this.config.mode === "development") {
          console.log("[VqDigitalWalletApple] Instance initialized:", this._instanceId);
        }

        return this;
      },

      /**
       * Validates configuration object
       * @private
       * @throws {Error} When configuration is invalid
       */
      _validateConfig: function () {
        var config = this.config;
        var errors = [];

        // Required fields
        if (isNullOrEmpty(config.merchantIdentifier)) {
          errors.push("merchantIdentifier is required");
        }

        if (isNullOrEmpty(config.merchantName)) {
          errors.push("merchantName is required");
        }

        // Mode validation
        if (VALID_MODES.indexOf(config.mode) === -1) {
          errors.push(
            "Invalid mode '" +
              config.mode +
              "'. Must be one of: " +
              VALID_MODES.join(", "),
          );
        }

        // Sanitize merchant name
        try {
          config.merchantName = sanitizeString(
            config.merchantName,
            100,
            "merchantName",
          );
        } catch (e) {
          errors.push(e.message);
        }

        // Validate card networks
        if (
          !Array.isArray(config.allowedCardNetworks) ||
          config.allowedCardNetworks.length === 0
        ) {
          errors.push("allowedCardNetworks must be a non-empty array");
        }

        // Validate merchant capabilities
        if (
          !Array.isArray(config.merchantCapabilities) ||
          config.merchantCapabilities.length === 0
        ) {
          errors.push("merchantCapabilities must be a non-empty array");
        }

        // Validate buttonStyle
        var validButtonStyles = ['black', 'white', 'white-outline'];
        if (validButtonStyles.indexOf(config.buttonStyle) === -1) {
          errors.push(
            "Invalid buttonStyle '" + config.buttonStyle + "'. Must be one of: " +
              validButtonStyles.join(', ')
          );
        }

        // Validate buttonType
        var validButtonTypes = [
          'plain', 'buy', 'pay', 'order', 'donate', 'subscribe', 'checkout',
          'book', 'add-money', 'contribute', 'reload', 'rent', 'save', 'tip', 'top-up'
        ];
        if (validButtonTypes.indexOf(config.buttonType) === -1) {
          errors.push(
            "Invalid buttonType '" + config.buttonType + "'. Must be one of: " +
              validButtonTypes.join(', ')
          );
        }

        // Validate validationEndpoint if provided
        if (!isNullOrEmpty(config.validationEndpoint)) {
          if (config.validationEndpoint.length > 512) {
            errors.push("validationEndpoint exceeds maximum allowed length (512 chars)");
          }
          if (config.validationEndpoint.indexOf('https://') !== 0) {
            errors.push("validationEndpoint must start with https://");
          }
        }

        // Validate callback if provided
        if (
          config.onTokenGenerated !== null &&
          typeof config.onTokenGenerated !== "function"
        ) {
          errors.push("onTokenGenerated must be a function or null");
        }

        // Validate payment options if provided
        if (config.paymentOptions !== undefined) {
          if (
            typeof config.paymentOptions !== "object" ||
            Array.isArray(config.paymentOptions)
          ) {
            errors.push("paymentOptions must be an object");
          }
        }

        if (errors.length > 0) {
          var error = new Error(
            "Configuration validation failed: " + errors.join("; "),
          );
          error.code = ERROR_CODES.INVALID_CONFIG;
          error.details = errors;
          throw error;
        }
      },

      /**
       * Logs error with structured information
       * @param {string} message - Error message
       * @param {Error|Object} [error] - Error object or details
       * @param {string} [context="general"] - Operation context
       * @param {string} [requestId] - Associated request ID
       * @returns {ErrorInfo} Structured error information
       */
      logError: function (message, error, context, requestId) {
        var errorCode = (error && error.code) || ERROR_CODES.VALIDATION_ERROR;

        var errorInfo = {
          code: errorCode,
          message: message,
          details: error ? error.message || error.toString() : undefined,
          context: context || "general",
          timestamp: new Date().toISOString(),
          sdkVersion: VERSION,
          requestId: requestId || this._instanceId,
        };

        if (this.config && this.config.mode === "development") {
          console.error("[VqDigitalWalletApple] Error:", errorInfo);
          if (error && error.stack) {
            console.error("[VqDigitalWalletApple] Stack:", error.stack);
          }
        } else {
          // Production: minimal logging, no stack traces
          console.error("[VqDigitalWalletApple] " + message);
        }

        return errorInfo;
      },

      /**
       * Initializes Apple Pay and checks device readiness
       * @returns {Promise<boolean>} Promise resolving to readiness status
       * @throws {Error} When initialization fails
       */
      initialize: function () {
        var self = this;

        if (!this._initialized) {
          return Promise.reject(
            new Error("SDK not initialized. Call constructor first."),
          );
        }

        return loadApplePaySDK(
          this.config.scriptLoadTimeout,
          this.config.cspNonce,
        )
          .then(function () {
            return self._checkReadyToPay();
          })
          .catch(function (error) {
            self.logError("Initialization failed", error, "initialize");
            throw error;
          });
      },

      /**
       * Checks if Apple Pay is available on this device/browser
       * @private
       * @returns {Promise<boolean>} Promise resolving to availability status
       */
      _checkReadyToPay: function () {
        var self = this;

        try {
          // Check for Payment Request API
          if (typeof window.PaymentRequest === "undefined") {
            if (this.config.mode === "development") {
              console.warn("[VqDigitalWalletApple] Payment Request API not supported");
            }
            this._isReadyToPay = false;
            return Promise.resolve(false);
          }

          // Build test payment request
          var methodData = [
            {
              supportedMethods: "https://apple.com/apple-pay",
              data: {
                version: APPLE_PAY_VERSION,
                merchantIdentifier: this.config.merchantIdentifier,
                merchantCapabilities: this.config.merchantCapabilities,
                supportedNetworks: this.config.allowedCardNetworks,
                countryCode: DEFAULT_COUNTRY_CODE,
              },
            },
          ];

          var details = {
            total: {
              label: this.config.merchantName || "Total",
              amount: {
                currency: "ZAR",
                value: "0.01",
              },
            },
          };

          var request = new PaymentRequest(
            methodData,
            details,
            this.config.paymentOptions,
          );

          return request
            .canMakePayment()
            .then(function (canPay) {
              self._isReadyToPay = canPay;

              if (self.config.mode === "development") {
                if (canPay) {
                  console.log("[VqDigitalWalletApple] Apple Pay is available");
                } else {
                  console.warn(
                    "[VqDigitalWalletApple] Apple Pay not available on this device",
                  );
                }
              }

              return canPay;
            })
            .catch(function (err) {
              self.logError(
                "canMakePayment check failed",
                err,
                "_checkReadyToPay",
              );
              self._isReadyToPay = false;
              return false;
            });
        } catch (error) {
          this.logError(
            "_checkReadyToPay exception",
            error,
            "_checkReadyToPay",
          );
          this._isReadyToPay = false;
          return Promise.resolve(false);
        }
      },

      /**
       * Creates Apple Pay button and attaches to container
       * @param {string|HTMLElement} container - Container element or ID
       * @param {PaymentData} paymentData - Payment transaction data
       * @returns {HTMLElement} Created button element
       * @throws {Error} When Apple Pay not ready or parameters invalid
       */
      createButton: function (container, paymentData) {
        if (!this._isReadyToPay) {
          var error = new Error(
            "Apple Pay is not ready. Call initialize() first and ensure device supports Apple Pay.",
          );
          error.code = ERROR_CODES.APPLE_PAY_UNAVAILABLE;
          throw error;
        }

        if (isNullOrEmpty(paymentData)) {
          throw new Error("Payment data is required");
        }

        this._validatePaymentData(paymentData);

        var self = this;

        // Create button element
        var button = document.createElement("apple-pay-button");
        button.setAttribute("buttonstyle", this.config.buttonStyle);
        button.setAttribute("type", this.config.buttonType);
        button.setAttribute("locale", this.config.buttonLocale);

        // Apply CSP nonce if provided
        if (this.config.cspNonce) {
          button.setAttribute("nonce", this.config.cspNonce);
        }

        // Styling
        button.style.display = "inline-block";
        button.style.cursor = "pointer";

        // Use CSS custom property for appearance if supported, fallback otherwise
        if (
          typeof CSS !== "undefined" &&
          CSS.supports &&
          CSS.supports("appearance", "-apple-pay-button")
        ) {
          button.style.appearance = "-apple-pay-button";
        }

        // Named click handler for proper cleanup
        function handleClick(event) {
          event.preventDefault();
          event.stopPropagation();

          try {
            self.requestPayment(paymentData).catch(function () {
              // Error already logged in requestPayment
            });
          } catch (error) {
            self.logError("Button click handler failed", error, "createButton");
          }
        }

        button.addEventListener("click", handleClick);

        // Store cleanup function on button for later removal
        button._vqCleanup = function () {
          button.removeEventListener("click", handleClick);
        };

        // Track button for cleanup on destroy
        this._createdButtons.push(button);

        // Resolve container
        var containerEl =
          typeof container === "string"
            ? document.getElementById(container)
            : container;

        if (!containerEl || !containerEl.appendChild) {
          throw new Error(
            "Container must be a valid DOM element or existing element ID",
          );
        }

        containerEl.appendChild(button);

        return button;
      },

      /**
       * Validates payment data structure
       * @private
       * @param {PaymentData} paymentData - Payment data to validate
       * @throws {Error} When payment data is invalid
       */
      _validatePaymentData: function (paymentData) {
        var errors = [];

        // Amount validation
        if (
          typeof paymentData.amount !== "number" ||
          isNaN(paymentData.amount)
        ) {
          errors.push("amount must be a valid number");
        } else {
          // Normalize to 2 decimal places
          var amountStr = paymentData.amount.toFixed(2);
          var amountNum = parseFloat(amountStr);

          if (amountNum <= 0) {
            errors.push("amount must be greater than 0");
          } else if (amountNum > 999999.99) {
            errors.push("amount exceeds maximum allowed (999999.99)");
          }

          // Update paymentData with normalized value
          paymentData.amount = amountNum;
        }

        // Currency validation
        if (isNullOrEmpty(paymentData.currency)) {
          errors.push("currency is required");
        } else {
          var currencyUpper = paymentData.currency.toUpperCase();
          if (VALID_CURRENCIES.indexOf(currencyUpper) === -1) {
            errors.push(
              "currency '" +
                currencyUpper +
                "' is not supported. Supported: " +
                VALID_CURRENCIES.join(", "),
            );
          }
        }

        // Country code validation (if provided)
        if (paymentData.countryCode !== undefined) {
          if (!/^[A-Z]{2}$/.test(paymentData.countryCode)) {
            errors.push(
              "countryCode must be 2 uppercase letters (ISO 3166-1 alpha-2)",
            );
          }
        }

        // Transaction ID validation (if provided)
        if (paymentData.transactionId !== undefined) {
          try {
            var txSanitized = sanitizeString(
              paymentData.transactionId,
              128,
              "transactionId",
            );
            if (txSanitized !== paymentData.transactionId) {
              errors.push(
                "transactionId contains invalid characters or is too long",
              );
            }
          } catch (e) {
            errors.push(e.message);
          }
        }

        if (errors.length > 0) {
          var error = new Error(
            "Payment data validation failed: " + errors.join("; "),
          );
          error.code = ERROR_CODES.INVALID_PAYMENT_DATA;
          error.details = errors;
          throw error;
        }
      },

      /**
       * Initiates payment request through Apple Pay
       * @param {PaymentData} paymentData - Payment transaction data
       * @returns {Promise<PaymentResult>} Promise resolving to payment result
       * @throws {Error} When payment request fails
       */
      requestPayment: function (paymentData) {
        var self = this;
        var requestId = generateUUID();

        try {
          // Rate limiting check
          checkRateLimit(this._rateLimiter);

          // Validate payment data
          this._validatePaymentData(paymentData);

          // Build payment request
          var paymentRequestConfig = this._buildPaymentRequest(paymentData);

          // Create AbortController for timeout/cancellation
          this._abortController = new AbortController();
          var timeoutId = setTimeout(function () {
            if (self._abortController) {
              self._abortController.abort();
            }
          }, this.config.requestTimeout);

          // Create PaymentRequest
          var request = new PaymentRequest(
            paymentRequestConfig.methodData,
            paymentRequestConfig.details,
            this.config.paymentOptions,
          );

          this._currentPaymentRequest = request;

          // Setup event handlers
          request.addEventListener("paymentmethodchange", function (event) {
            self._handlePaymentMethodChange(event);
          });

          request.addEventListener("merchantvalidation", function (event) {
            self._handleMerchantValidation(event, requestId);
          });

          // Show payment UI
          return request
            .show()
            .then(function (paymentResponse) {
              clearTimeout(timeoutId);
              return self._processPaymentResponse(paymentResponse, requestId);
            })
            .catch(function (err) {
              clearTimeout(timeoutId);
              self._cleanupPaymentRequest();

              // Don't log user cancellation as error
              if (err && err.name === "AbortError") {
                var cancelError = new Error("Payment was cancelled by user");
                cancelError.code = ERROR_CODES.PAYMENT_CANCELLED;
                self.invokeCallback(null, cancelError);
                throw cancelError;
              }

              self.logError(
                "Payment request failed",
                err,
                "requestPayment",
                requestId,
              );
              self.invokeCallback(null, err);
              throw err;
            });
        } catch (error) {
          this._cleanupPaymentRequest();
          this.logError(
            "Payment request setup failed",
            error,
            "requestPayment",
            requestId,
          );
          throw error;
        }
      },

      /**
       * Builds Payment Request API configuration
       * @private
       * @param {PaymentData} paymentData - Payment data
       * @returns {Object} Payment request configuration
       */
      _buildPaymentRequest: function (paymentData) {
        var methodData = [
          {
            supportedMethods: "https://apple.com/apple-pay",
            data: {
              version: APPLE_PAY_VERSION,
              merchantIdentifier: this.config.merchantIdentifier,
              merchantCapabilities: this.config.merchantCapabilities,
              supportedNetworks: this.config.allowedCardNetworks,
              countryCode: paymentData.countryCode || DEFAULT_COUNTRY_CODE,
            },
          },
        ];

        var details = {
          total: {
            label: this.config.merchantName,
            amount: {
              currency: (paymentData.currency || "ZAR").toUpperCase(),
              value: paymentData.amount.toFixed(2),
            },
          },
        };

        // Add display items if description provided
        if (paymentData.description) {
          details.displayItems = [
            {
              label: paymentData.description,
              amount: {
                currency: (paymentData.currency || "ZAR").toUpperCase(),
                value: paymentData.amount.toFixed(2),
              },
            },
          ];
        }

        return { methodData: methodData, details: details };
      },

      /**
       * Handles payment method change events
       * @private
       * @param {PaymentMethodChangeEvent} event - Payment method change event
       */
      _handlePaymentMethodChange: function (event) {
        if (this.config.mode === "development") {
          console.log(
            "[VqDigitalWalletApple] Payment method changed:",
            event.methodName,
          );
        }

        // Apple Pay doesn't require updates for method changes in standard flow
        // but we must call updateWith to acknowledge
        if (typeof event.updateWith === "function") {
          var self = this;
          event.updateWith({}).catch(function (err) {
            self.logError(
              "Failed to update payment method",
              err,
              "_handlePaymentMethodChange",
            );
          });
        }
      },

      /**
       * Handles merchant validation with secure server communication
       * @private
       * @param {Event} event - Merchant validation event
       * @param {string} requestId - Request identifier for tracing
       */
      _handleMerchantValidation: function (event, requestId) {
        var self = this;

        // Validate event structure
        if (!event || typeof event.complete !== "function") {
          this.logError(
            "Invalid merchant validation event",
            null,
            "_handleMerchantValidation",
            requestId,
          );
          return;
        }

        var validationURL = event.validationURL;
        if (!validationURL || typeof validationURL !== "string") {
          this.logError(
            "Missing or invalid validation URL",
            null,
            "_handleMerchantValidation",
            requestId,
          );
          event.complete(Promise.reject(new Error("Invalid validation URL")));
          return;
        }

        // Validate URL is from Apple domain (security check)
        var urlDomain;
        try {
          urlDomain = new URL(validationURL).hostname;
        } catch (e) {
          this.logError(
            "Invalid validation URL format",
            e,
            "_handleMerchantValidation",
            requestId,
          );
          event.complete(
            Promise.reject(new Error("Invalid validation URL format")),
          );
          return;
        }

        // Allow *.apple.com domains with specific patterns for Apple Pay gateways
        var isValidAppleDomain =
          /^(apple-pay-gateway|cn-apple-pay-gateway).*\.apple\.com$/.test(
            urlDomain,
          );

        if (!isValidAppleDomain) {
          this.logError(
            "Validation URL domain not from Apple: " + urlDomain,
            null,
            "_handleMerchantValidation",
            requestId,
          );
          event.complete(
            Promise.reject(new Error("Validation URL domain not allowed")),
          );
          return;
        }

        // Check validation endpoint configured
        if (isNullOrEmpty(this.config.validationEndpoint)) {
          this.logError(
            "validationEndpoint not configured",
            null,
            "_handleMerchantValidation",
            requestId,
          );
          event.complete(
            Promise.reject(
              new Error("Merchant validation endpoint not configured"),
            ),
          );
          return;
        }

        // Create abort controller for timeout
        var abortController = new AbortController();
        var timeoutId = setTimeout(function () {
          abortController.abort();
        }, this.config.requestTimeout);

        // Perform validation request
        fetch(this.config.validationEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            validationURL: validationURL,
            merchantIdentifier: this.config.merchantIdentifier,
            displayName: this.config.merchantName,
            domainName: window.location.hostname,
            initiative: "web",
            initiativeContext: window.location.hostname,
          }),
          signal: abortController.signal,
          referrerPolicy: "strict-origin-when-cross-origin",
          credentials: "same-origin",
        })
          .then(function (response) {
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(
                "Merchant validation failed with status: " + response.status,
              );
            }
            return response.json();
          })
          .then(function (merchantSession) {
            if (!merchantSession || typeof merchantSession !== "object") {
              throw new Error("Invalid merchant session received from server");
            }

            if (self.config.mode === "development") {
              console.log("[VqDigitalWalletApple] Merchant validation successful");
            }

            // Complete with merchant session
            event.complete(Promise.resolve(merchantSession));
          })
          .catch(function (error) {
            clearTimeout(timeoutId);
            self.logError(
              "Merchant validation failed",
              error,
              "_handleMerchantValidation",
              requestId,
            );
            event.complete(Promise.reject(error));
          });
      },

      /**
       * Processes successful payment response
       * @private
       * @param {PaymentResponse} paymentResponse - Payment response from Apple Pay
       * @param {string} requestId - Request identifier
       * @returns {Promise<PaymentResult>} Payment result
       */
      _processPaymentResponse: function (paymentResponse, requestId) {
        var self = this;

        try {
          var details = paymentResponse.details;

          if (this.config.mode === "development") {
            console.log("[VqDigitalWalletApple] Payment response received");
          }

          // Serialize and encode token
          var tokenData = JSON.stringify(details);
          var base64Token;

          try {
            base64Token = btoa(tokenData);
          } catch (e) {
            throw new Error("Failed to encode payment token: " + e.message);
          }

          if (!isValidBase64(base64Token)) {
            throw new Error("Generated token failed validation");
          }

          // Store session token
          this._sessionToken = base64Token;

          // Complete the payment
          var completePromise;
          if (typeof paymentResponse.complete === "function") {
            completePromise = paymentResponse.complete("success");
          } else {
            completePromise = Promise.resolve();
          }

          return completePromise.then(function () {
            self._cleanupPaymentRequest();

            var result = {
              success: true,
              token: base64Token,
              transactionId: requestId,
              message: "Apple Pay token generated successfully",
            };

            self.invokeCallback(base64Token, null);
            return result;
          });
        } catch (error) {
          this._cleanupPaymentRequest();

          // Attempt to fail the payment UI
          if (
            paymentResponse &&
            typeof paymentResponse.complete === "function"
          ) {
            paymentResponse.complete("fail");
          }

          error.code = error.code || ERROR_CODES.TOKEN_GENERATION_FAILED;
          this.logError(
            "Payment processing failed",
            error,
            "_processPaymentResponse",
            requestId,
          );
          this.invokeCallback(null, error);

          return Promise.reject(error);
        }
      },

      /**
       * Cleans up payment request resources
       * @private
       */
      _cleanupPaymentRequest: function () {
        this._currentPaymentRequest = null;
        this._abortController = null;
      },

      /**
       * Invokes the token generated callback
       * @param {string|null} token - Generated token or null on error
       * @param {Error|null} error - Error object or null on success
       */
      invokeCallback: function (token, error) {
        if (typeof this.config.onTokenGenerated !== "function") {
          return;
        }

        var self = this;

        // Use setTimeout to ensure async callback execution
        // and prevent callback errors from breaking SDK flow
        setTimeout(function () {
          try {
            var errorInfo = error
              ? {
                  code: error.code || ERROR_CODES.PAYMENT_FAILED,
                  message: error.message,
                  context: "payment",
                  timestamp: new Date().toISOString(),
                  sdkVersion: VERSION,
                }
              : null;

            self.config.onTokenGenerated(token, errorInfo);
          } catch (callbackError) {
            self.logError(
              "Callback execution failed",
              callbackError,
              "invokeCallback",
            );
          }
        }, 0);
      },

      /**
       * Encodes payload to Base64
       * @param {string} data - String data to encode
       * @returns {string} Base64 encoded string
       * @throws {Error} When encoding fails
       */
      encodeToBase64: function (data) {
        if (typeof data !== "string") {
          throw new Error("Data must be a string");
        }
        try {
          return btoa(data);
        } catch (e) {
          throw new Error("Base64 encoding failed: " + e.message);
        }
      },

      /**
       * Decodes Base64 payload
       * @param {string} base64String - Base64 encoded string
       * @returns {Object} Decoded object
       * @throws {Error} When decoding fails or payload invalid
       */
      decodeFromBase64: function (base64String) {
        if (!isValidBase64(base64String)) {
          throw new Error("Invalid base64 encoded payload");
        }
        try {
          var decoded = atob(base64String);
          return JSON.parse(decoded);
        } catch (e) {
          throw new Error("Failed to decode base64 payload");
        }
      },

      /**
       * Gets current session token
       * @returns {string|null} Current session token or null
       */
      getSessionToken: function () {
        return this._sessionToken;
      },

      /**
       * Clears stored session token
       */
      clearSessionToken: function () {
        this._sessionToken = null;
      },

      /**
       * Generates unique transaction identifier
       * @returns {string} UUID v4 transaction ID
       */
      generateTransactionId: function () {
        return generateUUID();
      },

      /**
       * Checks if Apple Pay is ready for payments
       * @returns {boolean} Readiness status
       */
      isReady: function () {
        return this._isReadyToPay;
      },

      /**
       * Aborts any in-progress payment request
       * @returns {Promise<void>}
       */
      abort: function () {
        if (this._abortController) {
          this._abortController.abort();
        }

        if (
          this._currentPaymentRequest &&
          typeof this._currentPaymentRequest.abort === "function"
        ) {
          try {
            this._currentPaymentRequest.abort();
          } catch (e) {
            // Ignore abort errors
          }
        }

        this._cleanupPaymentRequest();
        return Promise.resolve();
      },

      /**
       * Destroys instance and cleans up all resources
       */
      destroy: function () {
        // Abort any in-flight requests
        this.abort();

        // Clean up all created buttons
        if (this._createdButtons && this._createdButtons.length > 0) {
          this._createdButtons.forEach(function (button) {
            if (button._vqCleanup) {
              button._vqCleanup();
            }
          });
          this._createdButtons = [];
        }

        // Clear sensitive data
        this.clearSessionToken();

        // Nullify references
        var instanceId = this._instanceId;
        var mode = this.config ? this.config.mode : null;

        this.config = null;
        this._rateLimiter = null;
        this._isReadyToPay = false;
        this._initialized = false;

        if (mode === "development") {
          console.log("[VqDigitalWalletApple] Instance destroyed:", instanceId);
        }
      },
    };

    // ============================================================================
    // STATIC PROPERTIES
    // ============================================================================

    /**
     * SDK version
     * @static
     * @type {string}
     * @readonly
     */
    VqDigitalWalletApple.version = VERSION;

    /**
     * Default configuration
     * @static
     * @type {VqDigitalWalletAppleConfig}
     * @readonly
     */
    VqDigitalWalletApple.defaults = extendDeep({}, DEFAULTS);

    /**
     * Error codes
     * @static
     * @type {Object<string, string>}
     * @readonly
     */
    VqDigitalWalletApple.ERROR_CODES = Object.freeze
      ? Object.freeze(ERROR_CODES)
      : ERROR_CODES;

    /**
     * Checks browser support without instantiation
     * @static
     * @returns {{supported: boolean, missing: string[]}} Support status
     */
    VqDigitalWalletApple.checkBrowserSupport = function () {
      var missing = [];

      if (typeof Promise === "undefined") missing.push("Promise");
      if (typeof JSON === "undefined") missing.push("JSON");
      if (typeof btoa === "undefined") missing.push("Base64");
      if (typeof fetch === "undefined") missing.push("fetch");
      if (typeof AbortController === "undefined")
        missing.push("AbortController");
      if (
        typeof window !== "undefined" &&
        typeof window.PaymentRequest === "undefined"
      ) {
        missing.push("PaymentRequest API");
      }

      return {
        supported: missing.length === 0,
        missing: missing,
      };
    };

    // ============================================================================
    // GLOBAL EXPORT & NOCONFLICT
    // ============================================================================

    if (!noGlobal) {
      var previousVqDigitalWalletApple = window.VqDigitalWalletApple;

      /**
       * Restores previous window.VqDigitalWalletApple and returns this version
       * @static
       * @returns {VqDigitalWalletApple} VqDigitalWalletApple constructor
       */
      VqDigitalWalletApple.noConflict = function () {
        window.VqDigitalWalletApple = previousVqDigitalWalletApple;
        return VqDigitalWalletApple;
      };

      window.VqDigitalWalletApple = VqDigitalWalletApple;
    }

    return VqDigitalWalletApple;
  },
);
