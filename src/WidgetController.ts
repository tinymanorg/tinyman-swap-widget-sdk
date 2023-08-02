import {SignerTransaction, V2SwapExecution} from "@tinymanorg/tinyman-js-sdk";
import {decodeUnsignedTransaction} from "algosdk";

import {
  ApplicationToSwapWidgetMessage,
  SwapWidgetThemeVariables,
  SwapWidgetToApplicationMessage,
  SwapWidgetSearchParamKey
} from "./WidgetController.types";

const SWAP_WIDGET_BASE_URL = "https://hipo.github.io/ui098gh4350u9h435y-swap-widget/";
const SWAP_WIDGET_ORIGIN = new URL(SWAP_WIDGET_BASE_URL).origin;

export interface WidgetControllerEventListenerCallbacks {
  /** will be called when the parent application needs to sign a transaction
   * and then send it back to the widget (using `WidgetController.sendMessageToWidget()`) */
  onTxnSignRequest: ({
    txGroups
  }: {
    txGroups: SignerTransaction[][];
  }) => void | Promise<void>;
  /** will be called when widget stops waiting for signed txn after some time */
  onTxnSignRequestTimeout?: VoidFunction;
  onSwapSuccess?: (response: V2SwapExecution) => void | Promise<void>;
}

export class WidgetController {
  messageListener: (
    event: MessageEvent<SwapWidgetToApplicationMessage>
  ) => void | undefined;

  constructor({
    onTxnSignRequest,
    onTxnSignRequestTimeout,
    onSwapSuccess
  }: WidgetControllerEventListenerCallbacks) {
    this.messageListener = this.createWidgetEventListenerCallback({
      onTxnSignRequest,
      onTxnSignRequestTimeout,
      onSwapSuccess
    });
  }

  /**
   * @param params.data The message data to be sent to the widget
   * @param params.targetWindow The window to which the message should be sent
   */
  static sendMessageToWidget({
    data,
    targetWindow
  }: {
    data: ApplicationToSwapWidgetMessage;
    targetWindow: Window | null | undefined;
  }) {
    targetWindow?.postMessage(data, SWAP_WIDGET_ORIGIN);
  }

  /**
   * @returns the url of the swap widget including the customization params, to be used in an iframe
   */
  static generateWidgetIframeUrl({
    useParentSigner,
    accountAddress,
    themeVariables,
    network,
    parentUrlOrigin,
    assetIds
  }: {
    useParentSigner?: boolean;
    network?: "mainnet" | "testnet";
    accountAddress?: string | null;
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
  }) {
    const params: Record<SwapWidgetSearchParamKey, string> = {} as Record<
      SwapWidgetSearchParamKey,
      string
    >;

    if (useParentSigner) {
      params[SwapWidgetSearchParamKey.USE_PARENT_SIGNER] = String(useParentSigner);

      if (accountAddress) {
        params[SwapWidgetSearchParamKey.ACCOUNT_ADDRESS] = accountAddress;
      }
    }

    if (network) {
      params[SwapWidgetSearchParamKey.NETWORK] = network;
    }

    if (themeVariables) {
      const colorsEncoded = Buffer.from(JSON.stringify(themeVariables)).toString(
        "base64"
      );

      params[SwapWidgetSearchParamKey.THEME_VARIABLES] = colorsEncoded;
    }

    if (parentUrlOrigin) {
      // encode and pass as base64
      params[SwapWidgetSearchParamKey.PARENT_URL_ORIGIN] =
        Buffer.from(parentUrlOrigin).toString("base64");
    }

    if (assetIds) {
      params[SwapWidgetSearchParamKey.ASSET_IN] = String(assetIds[0]);
      params[SwapWidgetSearchParamKey.ASSET_OUT] = String(assetIds[1]);
    }

    return `${SWAP_WIDGET_BASE_URL}?${new URLSearchParams(params)}`;
  }

  /**
   * @returns the message listener callback, that will be used to listen to messages from the widget,
   * and call the appropriate callback functions
   */
  private createWidgetEventListenerCallback({
    onTxnSignRequest,
    onTxnSignRequestTimeout,
    onSwapSuccess
  }: WidgetControllerEventListenerCallbacks) {
    return (event: MessageEvent<SwapWidgetToApplicationMessage>) => {
      if (event.origin !== SWAP_WIDGET_ORIGIN) {
        return;
      }

      switch (event.data.message.type) {
        case "TXN_SIGN_REQUEST": {
          {
            const encodedSigners = event.data.message.txGroups.map((encodedTxnGroup) =>
              encodedTxnGroup.map((encodedSignerTxn) => ({
                txn: decodeUnsignedTransaction(encodedSignerTxn.txn),
                signers: encodedSignerTxn.signers
              }))
            );

            onTxnSignRequest({
              txGroups: encodedSigners
            });
          }
          break;
        }

        case "TXN_SIGN_REQUEST_TIMEOUT": {
          if (onTxnSignRequestTimeout) {
            onTxnSignRequestTimeout();
          }
          break;
        }

        case "SWAP_SUCCESS": {
          if (onSwapSuccess) {
            onSwapSuccess(event.data.message.response);
          }
          break;
        }

        default: {
          throw new Error("Unknown message type");
        }
      }
    };
  }

  setWidgetEventListenerCallback({
    onTxnSignRequest,
    onTxnSignRequestTimeout,
    onSwapSuccess
  }: WidgetControllerEventListenerCallbacks) {
    this.messageListener = this.createWidgetEventListenerCallback({
      onTxnSignRequest,
      onTxnSignRequestTimeout,
      onSwapSuccess
    });
  }

  addWidgetEventListeners() {
    window.addEventListener("message", this.messageListener, false);
  }

  removeWidgetEventListeners() {
    window.removeEventListener("message", this.messageListener, false);
  }
}
