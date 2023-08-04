## Tinyman Swap Widget JS SDK

Easily integrate it into your dApp with JavaScript SDK.

## Quick Start

1. Start by installing `@tinymanorg/tinyman-swap-widget-sdk`:

```
npm install @tinymanorg/tinyman-swap-widget-sdk
```

2. Create a new instance of the `WidgetController` class, and pass the event listener callbacks:

```typescript
import {Transaction} from "algosdk";
import {WidgetController} from "@tinymanorg/tinyman-swap-widget-sdk";
import {SignerTransaction} from "@tinymanorg/tinyman-js-sdk";

import {initiateSignCeremony} from "../../integrations/tinyman-js-sdk/tinymanHelpers";

const iframeElement = document.getElementById(
  "swap-widget-iframe"
) as HTMLIFrameElement | null;
const accountAddress = "YOUR_ACCOUNT_ADDRESS";

const onTxnSignRequest = async ({txn}: {txn: Transaction}) => {
  try {
    const txGroups = [[{txn, signers: [accountAddress]} as SignerTransaction]];
    // Sign the txns with the wallet
    const signedTxns = await initiateSignCeremony(
      {
        walletType: "pera-wallet",
        signerAddress: accountAddress
      },
      txGroups
    );

    // Send the signed txns to the widget, so it can send them to the blockchain
    WidgetController.sendMessageToWidget({
      data: {message: {type: "TXN_SIGN_RESPONSE", signedTxns}},
      targetWindow: iframeElement?.contentWindow
    });
  } catch (error) {
    console.error(error);

    // Let widget know that the txn signing failed
    WidgetController.sendMessageToWidget({
      data: {message: {type: "FAILED_TXN_SIGN", error}},
      targetWindow: iframeElement?.contentWindow
    });
  }
};

// Create the widget controller instance, and pass the event listener callbacks
const widgetController = new WidgetController({
  // This will be called when the widget requests a transaction to be signed
  onTxnSignRequest,

  // This will be called when the widget stops waiting for txn signing
  onTxnSignRequestTimeout() {
    console.error("Widget stopped waiting for txn signing");
  },

  // This will be called when the swap operation is successful
  onSwapSuccess() {
    console.log("Swap was successful!");
  }
});

// Append event listeners to the window
widgetController.addWidgetEventListeners();
```

### Examples

<details>
  <summary>VueJS</summary>
  <br>

```typescript
<script lang="ts">
import {WidgetController} from "@tinymanorg/tinyman-swap-widget-sdk";

// Create a new widget controller instance including event listener callbacks
const widgetController = new WidgetController({
onTxnSignRequest: (txn) => {
  window.alert(`TXN SIGN REQUEST RECEIVED. Check console for transactions.`);
  console.log({txn});

  // As an example, assume transaction sign has failed
  WidgetController.sendMessageToWidget({
    data: {message: {type: "FAILED_TXN_SIGN"}},
    targetWindow: document.querySelector("iframe")?.contentWindow,
  })
},

onTxnSignRequestTimeout() {
  window.alert("TXN SIGN REQUEST TIMEOUT")
},
})

export default {
data() {
  return {
    // Create a widget URL with the signer address and other options
    widgetUrl: WidgetController.generateWidgetIframeUrl({
      useParentSigner: true,
      accountAddress: "D5SKH4ETPHHW6QUMSGMERF3CXFEYCK4YD6OOGGXFY4MQBAATC2YFI2AOLI",
    })
  }
},

mounted() {
  // On mount, add event listeners to the widget
  widgetController.addWidgetEventListeners();
},

beforeUnmount() {
  // Before unmount, remove event listeners from the widget
  widgetController.removeWidgetEventListeners();
}

}
</script>

<template>
<header>
  <h1>Tinyman Swap Widget</h1>
</header>

<main>
  <iframe :src="widgetUrl" width="100%" max-width="400px" height="500px" />
</main>
</template>

<style scoped>
header {
margin-bottom: 26px;
}

h1 {
font-weight: bold;
}
</style>
```
</details>

<details>
  <summary>React</summary>
  <br>

```typescript
function IntegrationTestPage() {
  // Keep a reference to the widget iframe, so we can get its contentWindow for messaging
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // In real projects, this comes from the project's wallet integration
  const [account] = React.useState<string | undefined>(undefined);

  // Generate the widget iframe url
  const iframeUrl = WidgetController.generateWidgetIframeUrl({
    // should be `true` to use the project's wallet integration
    useParentSigner: true,
    // this account address is used as the signer of the txns
    accountAddress: account,
    network: "testnet",
    // This is the origin of the project that is using the widget
    // Alternatively, `window.location.origin` can be used for client side rendering
    parentUrlOrigin: "https://localhost:3000",
  });

  /**
   * If the callbacks have dependencies to state variables (in this case `account`),
   * make sure to wrap them in useCallback to prevent infinite loops.
   */
  const onTxnSignRequest = useCallback(
    async ({ txGroups }: { txGroups: SignerTransaction[][] }) => {
      try {
        // Sign the txns with the project's wallet integration
        const signedTxns = await signTxns({
          signerAddress: account,
          txGroups,
        });

        // Send the signed txns to the widget, so it can send them to the blockchain
        WidgetController.sendMessageToWidget({
          data: { message: { type: "TXN_SIGN_RESPONSE", signedTxns } },
          targetWindow: iframeRef.current?.contentWindow,
        });
      } catch (error) {
        // Let widget know that the txn signing failed
        WidgetController.sendMessageToWidget({
          data: { message: { type: "FAILED_TXN_SIGN", error } },
          targetWindow: iframeRef.current?.contentWindow,
        });
      }
    },
    [account]
  );
  const onTxnSignRequestTimeout = useCallback(() => {
    console.error("txn sign request timed out");
  }, []);

  const onSwapSuccess = useCallback(async (response: V2SwapExecution) => {
    console.log({ response });

    // You can show a success message to the user here,
    // Or re-fetch the account data to show the updated balances
  }, []);

  useEffect(() => {
    // create a new widget controller instance with the event handler callbacks
    const swapController = new WidgetController({
      onTxnSignRequest,
      onTxnSignRequestTimeout,
      onSwapSuccess,
    });

    // add event listeners to the widget iframe
    swapController.addWidgetEventListeners();

    return () => {
      // remove event listeners from the widget iframe from unmounting the page
      swapController.removeWidgetEventListeners();
    };
  }, [onSwapSuccess, onTxnSignRequest, onTxnSignRequestTimeout]);

  return (
    <iframe
      ref={iframeRef}
      title={"tinyman swap widget"}
      className={"swap-widget-test-page__content__iframe"}
      style={{ width: 400, height: 444 }}
      src={iframeUrl}
      sandbox={"allow-same-origin allow-scripts allow-popups allow-forms"}
    />
  );
}

/**
 * This function should come from the project's wallet integration.
 * Added here just for demonstration purposes.
 */
const signTxns: any = undefined;

```

</details>


## Static Methods

#### `WidgetController.sendMessageToWidget({ data, targetWindow })`

Sends a message to the widget.

#### `WidgetController.generateWidgetIframeUrl(options: WidgetOptions): string`

Returns the widget iframe url with the given options.

## Instance Methods

#### `widgetControllerInstance.addWidgetEventListeners()`

Adds event listeners (which are passed to the instance while creating it) to the window.

#### `widgetControllerInstance.removeWidgetEventListeners()`

Removes event listeners from the window.
