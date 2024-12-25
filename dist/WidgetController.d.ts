import { SignerTransaction, V2SwapExecution } from "@tinymanorg/tinyman-js-sdk";
import { ApplicationToSwapWidgetMessage, SwapWidgetToApplicationMessage, GenerateWidgetIframeUrlParams } from "./WidgetController.types";
export interface WidgetControllerEventListenerCallbacks {
    /** will be called when the parent application needs to sign a transaction
     * and then send it back to the widget (using `WidgetController.sendMessageToWidget()`) */
    onTxnSignRequest: ({ txGroups }: {
        txGroups: SignerTransaction[][];
    }) => void | Promise<void>;
    /** will be called when widget stops waiting for signed txn after some time */
    onTxnSignRequestTimeout?: VoidFunction;
    onSwapSuccess?: (response: V2SwapExecution) => void | Promise<void>;
}
export declare class WidgetController {
    messageListener: (event: MessageEvent<SwapWidgetToApplicationMessage>) => void | undefined;
    constructor({ onTxnSignRequest, onTxnSignRequestTimeout, onSwapSuccess }: WidgetControllerEventListenerCallbacks);
    /**
     * @param params.data The message data to be sent to the widget
     * @param params.targetWindow The window to which the message should be sent
     */
    static sendMessageToWidget({ data, targetWindow }: {
        data: ApplicationToSwapWidgetMessage;
        targetWindow: Window | null | undefined;
    }): void;
    /**
     * @returns the url of the swap widget including the customization params, to be used in an iframe
     */
    static generateWidgetIframeUrl(params: GenerateWidgetIframeUrlParams): string;
    /**
     * @returns the message listener callback, that will be used to listen to messages from the widget,
     * and call the appropriate callback functions
     */
    private createWidgetEventListenerCallback;
    setWidgetEventListenerCallback({ onTxnSignRequest, onTxnSignRequestTimeout, onSwapSuccess }: WidgetControllerEventListenerCallbacks): void;
    addWidgetEventListeners(): void;
    removeWidgetEventListeners(): void;
}
