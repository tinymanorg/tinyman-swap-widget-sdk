import {SignerTransaction, V2SwapExecution} from "@tinymanorg/tinyman-js-sdk";
import {decodeUnsignedTransaction} from "algosdk";

import {
  ApplicationToSwapWidgetMessage,
  SwapWidgetToApplicationMessage,
  SwapWidgetSearchParamKey,
  GenerateWidgetIframeUrlParams
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
  static generateWidgetIframeUrl(params: GenerateWidgetIframeUrlParams) {
    const searchParams: Record<SwapWidgetSearchParamKey, string> = {} as Record<
      SwapWidgetSearchParamKey,
      string
    >;
    const {
      useParentSigner,
      assetIds,
      network,
      parentUrlOrigin,
      themeVariables,
      platformFeeAccount,
      platformFeePercentage,
      platformName
    } = params;

    searchParams[SwapWidgetSearchParamKey.PLATFORM_NAME] = platformName;

    if (useParentSigner) {
      const {accountAddress} = params;

      searchParams[SwapWidgetSearchParamKey.USE_PARENT_SIGNER] = String(useParentSigner);

      if (accountAddress) {
        searchParams[SwapWidgetSearchParamKey.ACCOUNT_ADDRESS] = accountAddress;
      }
    }

    if (network) {
      searchParams[SwapWidgetSearchParamKey.NETWORK] = network;
    }

    if (themeVariables) {
      const colorsEncoded = Buffer.from(JSON.stringify(themeVariables)).toString(
        "base64"
      );

      searchParams[SwapWidgetSearchParamKey.THEME_VARIABLES] = colorsEncoded;
    }

    if (parentUrlOrigin) {
      // encode and pass as base64
      searchParams[SwapWidgetSearchParamKey.PARENT_URL_ORIGIN] =
        Buffer.from(parentUrlOrigin).toString("base64");
    }

    if (assetIds) {
      searchParams[SwapWidgetSearchParamKey.ASSET_IN] = String(assetIds[0]);
      searchParams[SwapWidgetSearchParamKey.ASSET_OUT] = String(assetIds[1]);
    }

    if (platformFeeAccount && platformFeePercentage) {
      searchParams[SwapWidgetSearchParamKey.PLATFORM_FEE_ACCOUNT] = platformFeeAccount;
      searchParams[SwapWidgetSearchParamKey.PLATFORM_FEE_PERCENTAGE] =
        String(platformFeePercentage);
    }

    return `${SWAP_WIDGET_BASE_URL}?${new URLSearchParams(searchParams)}`;
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
