import {SignerTransaction, V2SwapExecution} from "@tinymanorg/tinyman-js-sdk";

/**
 * `SignerTransaction` with the `txn` field encoded in base64
 */
export type SignerEncodedTransaction = Omit<SignerTransaction, "txn"> & {
  /** Encoded transaction
   *
   * `algosdk.decodeUnsignedTransaction` function can be used
   * to decode the transaction.
   **/
  txn: Uint8Array;
};

/**
 * Message sent from the swap widget to the app
 */
export interface SwapWidgetToApplicationMessage {
  message:
    | {
        type: "TXN_SIGN_REQUEST";
        txGroups: SignerEncodedTransaction[][];
      }
    | {
        /** It means the widget is no longer waiting for the response */
        type: "TXN_SIGN_REQUEST_TIMEOUT";
      }
    | {
        /** Will be sent after every successful swap operation */
        type: "SWAP_SUCCESS";
        /** An object including the details about the swap */
        response: V2SwapExecution;
      };
}

/**
 * Message sent from the app to the swap widget
 */
export interface ApplicationToSwapWidgetMessage {
  message:
    | {
        type: "TXN_SIGN_RESPONSE";
        signedTxns: Uint8Array[];
      }
    | {
        type: "FAILED_TXN_SIGN";
        error?: unknown;
      };
}

/** Search param keys that can be passed to the widget for configuration */
export enum SwapWidgetSearchParamKey {
  /** When set to `true`, the widget will always try to
   * communicate with the parent app to get the txns signed */
  USE_PARENT_SIGNER = "useParentSigner",

  /** Should be passed if `useParentSigner` is `true`, (otherwise it will be ignored)
   * the widget will use this address as the signer of the txns */
  ACCOUNT_ADDRESS = "accountAddress",

  /** The preferred Algorand network that will be used by the widget */
  NETWORK = "network",

  /** Variables to be used for theming the widget,
   * should be a JSON stringified and base64 encoded object */
  THEME_VARIABLES = "themeVariables",

  /** The url origin of the parent application,
   * should be a base64 encoded string */
  PARENT_URL_ORIGIN = "parentUrlOrigin",

  /** ID of the asset to be used as the input asset for the swap, default = ALGO */
  ASSET_IN = "assetIn",

  /** ID of the asset to be used as the output asset for the swap, default = USDC */
  ASSET_OUT = "assetOut"
}

export interface SwapWidgetThemeColorVariables {
  widgetBg?: string;
  headerButtonBg?: string;
  headerButtonText?: string;
  headerTitle?: string;
  containerButtonBg?: string;
  containerButtonText?: string;
  iframeBg?: string;
}

export type SwapWidgetThemeVariables = SwapWidgetThemeColorVariables & {
  theme?: SwapWidgetAppTheme;
  borderRadiusSize?: SwapWidgetBorderRadiusSize;
  shouldDisplayTinymanLogo?: boolean;
  title?: string;
};

export enum SwapWidgetAppTheme {
  Light = "light",
  Dark = "dark"
}

export enum SwapWidgetBorderRadiusSize {
  None = "none",
  Small = "small",
  Medium = "medium",
  Large = "large"
}

export type GenerateWidgetIframeUrlBaseParams = {
  network?: "mainnet" | "testnet";
  /** theme variables to customize the UI of the widget */
  themeVariables?: SwapWidgetThemeVariables;
  /** when provided, messages will be posted only to this origin.
   * @example ```{parentUrlOrigin: "http://localhost:3001}```
   */
  parentUrlOrigin?: string;
  /**
   * the asset ids to be used for the swap.
   * orrder: [assetInId, assetOutId]
   */
  assetIds?: [number, number];
};

export type GenerateWidgetIframeUrlParams =
  | (GenerateWidgetIframeUrlBaseParams & {
      useParentSigner: true;
      accountAddress: string;
    })
  | (GenerateWidgetIframeUrlBaseParams & {
      useParentSigner: false;
    });