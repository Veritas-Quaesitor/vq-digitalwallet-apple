/*!
 * @ecentric/eps-applepay-sdk v1.0.0
 * Type definitions for EpsApplePay SDK
 * Released under the MIT License.
 * (c) 2024 Ecentric Payment Solutions
 */

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

/**
 * Payment options configuration for Payment Request API
 */
export interface PaymentOptions {
  requestPayerName?: boolean;
  requestBillingAddress?: boolean;
  requestPayerEmail?: boolean;
  requestPayerPhone?: boolean;
  requestShipping?: boolean;
  shippingType?: string;
}

/**
 * SDK configuration options
 */
export interface EpsApplePayConfig {
  /** Apple Pay merchant identifier (required) */
  merchantIdentifier: string;
  /** Display name shown to customer (required) */
  merchantName: string;
  /** SDK mode: 'development' | 'production'. Default: 'development' */
  mode?: "development" | "production";
  /** Supported card networks. Default: ['masterCard', 'visa'] */
  allowedCardNetworks?: string[];
  /** Merchant capabilities. Default: ['supports3DS'] */
  merchantCapabilities?: string[];
  /** Apple Pay button style. Default: 'black' */
  buttonStyle?: string;
  /** Apple Pay button type. Default: 'buy' */
  buttonType?: string;
  /** Button locale. Default: 'en-ZA' */
  buttonLocale?: string;
  /** Callback invoked when a payment token is generated or an error occurs */
  onTokenGenerated?: TokenGeneratedCallback | null;
  /** Script load timeout in ms. Default: 10000 */
  scriptLoadTimeout?: number;
  /** Merchant validation endpoint URL (must support CORS if external) */
  validationEndpoint?: string;
  /** Payment request timeout in ms. Default: 30000 */
  requestTimeout?: number;
  /** CSP nonce for inline script/style injection */
  cspNonce?: string;
  /** Payment options for Payment Request API */
  paymentOptions?: PaymentOptions;
}

/**
 * Payment data for a transaction
 */
export interface PaymentData {
  /** Payment amount (0.01 to 999999.99) */
  amount: number;
  /** Currency code (e.g. 'ZAR') */
  currency: string;
  /** ISO 3166-1 alpha-2 country code. Default: 'ZA' */
  countryCode?: string;
  /** Unique transaction identifier */
  transactionId?: string;
  /** Payment description */
  description?: string;
}

/**
 * Payment processing result
 */
export interface PaymentResult {
  /** Whether payment succeeded */
  success: boolean;
  /** Base64 encoded payment token */
  token?: string;
  /** Transaction identifier */
  transactionId?: string;
  /** Human-readable result message */
  message: string;
  /** Error details if failed */
  error?: ErrorInfo;
}

/**
 * Structured error information
 */
export interface ErrorInfo {
  /** Error code (e.g. 'E001') */
  code: string;
  /** Error message */
  message: string;
  /** Detailed error information */
  details?: string;
  /** Operation context where error occurred */
  context: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** SDK version */
  sdkVersion: string;
  /** Associated request ID */
  requestId?: string;
}

/**
 * Token generation callback
 */
export type TokenGeneratedCallback = (
  token: string | null,
  error: ErrorInfo | null,
) => void;

/**
 * Rate limiter state (internal)
 */
export interface RateLimiterState {
  requestCount: number;
  windowStart: number;
}

/**
 * Browser support check result
 */
export interface BrowserSupportResult {
  supported: boolean;
  missing: string[];
}

// ============================================================================
// MAIN CLASS
// ============================================================================

/**
 * EpsApplePay SDK for Apple Pay integration via the Payment Request API.
 *
 * @example
 * const applePay = new EpsApplePay({
 *   merchantIdentifier: 'merchant.com.example',
 *   merchantName: 'Example Store',
 *   mode: 'production',
 *   onTokenGenerated(token, error) {
 *     if (error) console.error('Payment failed:', error);
 *     else console.log('Token:', token);
 *   }
 * });
 *
 * await applePay.initialize();
 *
 * applePay.createButton('#pay-button', {
 *   amount: 99.99,
 *   currency: 'ZAR',
 * });
 */
export declare class EpsApplePay {
  // ── Static members ────────────────────────────────────────────────────────

  /** Current SDK version */
  static readonly version: string;

  /** Default configuration values */
  static readonly defaults: Readonly<EpsApplePayConfig>;

  /** Standardised error codes */
  static readonly ERROR_CODES: Readonly<Record<string, string>>;

  /**
   * Checks browser support without instantiation.
   * @returns Object indicating support status and any missing APIs.
   */
  static checkBrowserSupport(): BrowserSupportResult;

  /**
   * Restores the previous `window.EpsApplePay` value and returns this
   * version of the constructor (browser-global builds only).
   */
  static noConflict(): typeof EpsApplePay;

  // ── Instance members ───────────────────────────────────────────────────────

  /** SDK version (instance mirror of static) */
  readonly version: string;

  /** Resolved, merged configuration for this instance */
  config: EpsApplePayConfig | null;

  /**
   * Creates a new EpsApplePay instance.
   * Can be called with or without `new`.
   *
   * @param config - SDK configuration options.
   * @throws {Error} When the browser is unsupported or config is invalid.
   */
  constructor(config: EpsApplePayConfig);

  /**
   * Initialises the SDK: loads the Apple Pay JS SDK and checks device
   * readiness via `PaymentRequest.canMakePayment()`.
   *
   * @returns Promise resolving to `true` when Apple Pay is available,
   *          `false` when the device/browser does not support it.
   * @throws {Error} When the SDK script fails to load.
   */
  initialize(): Promise<boolean>;

  /**
   * Creates an `<apple-pay-button>` element, appends it to `container`,
   * and wires up the click → `requestPayment` flow.
   *
   * @param container - A DOM element or the `id` of an existing element.
   * @param paymentData - Transaction details.
   * @returns The created `<apple-pay-button>` element.
   * @throws {Error} When Apple Pay is not ready, or parameters are invalid.
   */
  createButton(
    container: string | HTMLElement,
    paymentData: PaymentData,
  ): HTMLElement;

  /**
   * Initiates an Apple Pay payment sheet via the Payment Request API.
   *
   * @param paymentData - Transaction details.
   * @returns Promise resolving to a {@link PaymentResult}.
   * @throws {Error} When rate-limited, validation fails, or the sheet errors.
   */
  requestPayment(paymentData: PaymentData): Promise<PaymentResult>;

  /**
   * Invokes the `onTokenGenerated` callback asynchronously (via
   * `setTimeout`). No-op when no callback is configured.
   *
   * @param token - Base64 payment token, or `null` on error.
   * @param error - Error object, or `null` on success.
   */
  invokeCallback(token: string | null, error: Error | null): void;

  /**
   * Logs a structured error and returns the {@link ErrorInfo} object.
   *
   * @param message - Human-readable error message.
   * @param error - Underlying error or details object.
   * @param context - Operation context label.
   * @param requestId - Optional request/trace identifier.
   */
  logError(
    message: string,
    error?: Error | object | null,
    context?: string,
    requestId?: string,
  ): ErrorInfo;

  /**
   * Encodes a string to Base64.
   *
   * @param data - UTF-8 string to encode.
   * @returns Base64-encoded string.
   * @throws {Error} When encoding fails.
   */
  encodeToBase64(data: string): string;

  /**
   * Decodes a Base64 string and parses it as JSON.
   *
   * @param base64String - Valid Base64 string.
   * @returns Parsed object.
   * @throws {Error} When the string is not valid Base64 or not valid JSON.
   */
  decodeFromBase64(base64String: string): object;

  /**
   * Returns the Base64-encoded payment token from the most recent
   * successful transaction, or `null` if none exists.
   */
  getSessionToken(): string | null;

  /** Clears the stored session token. */
  clearSessionToken(): void;

  /**
   * Generates a RFC 4122 v4 UUID suitable for use as a transaction ID.
   */
  generateTransactionId(): string;

  /**
   * Returns `true` when `initialize()` has confirmed Apple Pay is
   * available on this device/browser.
   */
  isReady(): boolean;

  /**
   * Aborts any in-progress payment request and cleans up internal state.
   *
   * @returns Promise that resolves immediately after cleanup.
   */
  abort(): Promise<void>;

  /**
   * Destroys the instance: aborts in-flight requests, removes button
   * event listeners, clears the session token, and nullifies all
   * internal references.
   */
  destroy(): void;
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

export default EpsApplePay;

// CommonJS interop
export = EpsApplePay;
