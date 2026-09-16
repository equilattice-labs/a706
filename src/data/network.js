// Arc mainnet: https://docs.arc.io/arc/references/connect-to-arc
const id = 5042

export const arcChain = Object.freeze({
  id,
  displayName: 'Arc Chain',
  docsUrl: 'https://docs.arc.io/arc',
  connectionDocsUrl: 'https://docs.arc.io/arc/references/connect-to-arc',
  wallet: {
    chainId: `0x${id.toString(16)}`,
    chainName: 'Arc',
    // Native USDC uses 18 decimals; its ERC-20 interface uses 6.
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: ['https://rpc.mainnet.arc.io'],
    blockExplorerUrls: ['https://explorer.arc.io'],
  },
})
