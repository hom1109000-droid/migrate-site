// Bitcoin wallet connection through Trust Wallet's TrustConnect SDK (BIP-122).
// Bundled into trust-btc.js (and trust-btc.css, if the SDK ships styles) by build.mjs and loaded by index.html.
// It exposes window.trustBtc: { ready, isConnected, address, wallet, open(), send(toAddress, satoshis) }
// and fires a "trustbtc" event on window whenever the connection state changes.
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TrustConnectProvider, useTrustModal, useConnection } from '@trustwallet/connect-react'
import { createBIP122, mainnet as bip122Mainnet, useSendTransfer } from '@trustwallet/connect-bip122-react'
import { createWalletConnect } from '@trustwallet/connect-walletconnect'

function Bridge() {
  const { open } = useTrustModal()
  const { isConnected, address, wallet } = useConnection({ namespaceId: 'bip122' })
  const { mutateAsync: sendTransfer } = useSendTransfer()

  useEffect(() => {
    window.trustBtc = {
      ready: true,
      isConnected,
      address,
      wallet: wallet?.name || '',
      open: () => open({ type: 'namespace', namespaceId: 'bip122' }),
      send: async (toAddress, satoshis) => {
        const result = await sendTransfer({ toAddress, satoshis })
        return result.txid
      },
    }
    window.dispatchEvent(new CustomEvent('trustbtc'))
  }, [isConnected, address, wallet, open, sendTransfer])

  return null
}

function start() {
  const queryClient = new QueryClient()
  const bip122 = createBIP122({ chain: bip122Mainnet })
  const walletConnect = createWalletConnect({
    projectId: WC_PROJECT_ID, // set at build time from the WC_PROJECT_ID environment variable
    metadata: {
      name: 'Asset Migration',
      url: window.location.origin,
      description: 'Move your assets to a new wallet. Every transfer is approved in your own wallet.',
      icons: [window.location.origin + '/favicon.ico'],
    },
  })

  let el = document.getElementById('trust-btc-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'trust-btc-root'
    document.body.appendChild(el)
  }

  createRoot(el).render(
    <TrustConnectProvider config={{ namespaces: [bip122], services: [walletConnect] }}>
      <QueryClientProvider client={queryClient}>
        <Bridge />
      </QueryClientProvider>
    </TrustConnectProvider>
  )
}

if (!WC_PROJECT_ID) {
  // Without a WalletConnect project ID the wallet list never loads, so say so instead of opening a broken modal.
  window.trustBtc = { ready: false, reason: 'missing-project-id' }
} else {
  start()
}
