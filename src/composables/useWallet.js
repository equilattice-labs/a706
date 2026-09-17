import { computed, onMounted, onUnmounted, ref } from 'vue'

export function useWallet() {
  const address = ref('')
  const chainId = ref('')
  const pending = ref(false)
  const networkPending = ref(false)
  const walletError = ref('')
  const networkMessage = ref('')
  let provider
  let sessionDisconnected = false
  let accountRevision = 0
  let chainRevision = 0
  let sessionRevision = 0
  let disposed = false
  const shortAddress = computed(() => address.value ? `${address.value.slice(0, 6)}…${address.value.slice(-4)}` : '')
  function updateAccounts(accounts) { if (!sessionDisconnected) address.value = Array.isArray(accounts) && /^0x[\da-f]{40}$/i.test(accounts[0] || '') ? accounts[0] : '' }
  function updateChain(value) { chainId.value = typeof value === 'string' ? value.toLowerCase() : '' }
  function accountsChanged(accounts) {
    accountRevision++; updateAccounts(accounts)
    if (address.value) void readChain()
    else { chainRevision++; chainId.value = ''; networkMessage.value = '' }
  }
  function chainChanged(value) { chainRevision++; if (!sessionDisconnected) updateChain(value); networkMessage.value = '' }
  function providerDisconnected() { accountRevision++; chainRevision++; sessionRevision++; address.value = ''; chainId.value = ''; clearError() }
  function errorMessage(error, task) {
    if (error?.code === 4001) return `${task} was cancelled. You can try again whenever you're ready.`
    if (error?.code === -32002) return 'A request is already open in your wallet. Check the extension to continue.'
    return `${task} could not be completed. Check your wallet and try again.`
  }
  function findProvider() {
    if (!window.ethereum?.request) { walletError.value = 'No browser wallet found. Install an EVM wallet, then reload this page to connect.'; return null }
    if (provider !== window.ethereum) {
      removeListeners(); accountRevision++; chainRevision++; sessionRevision++; provider = window.ethereum
      provider.on?.('accountsChanged', accountsChanged); provider.on?.('chainChanged', chainChanged); provider.on?.('disconnect', providerDisconnected)
    }
    return provider
  }
  function removeListeners() { provider?.removeListener?.('accountsChanged', accountsChanged); provider?.removeListener?.('chainChanged', chainChanged); provider?.removeListener?.('disconnect', providerDisconnected) }
  async function readChain() {
    const revision = chainRevision
    const requestProvider = provider
    try { const value = await requestProvider.request({ method: 'eth_chainId' }); if (!disposed && provider === requestProvider && revision === chainRevision) updateChain(value) }
    catch { if (!disposed && provider === requestProvider && revision === chainRevision) chainId.value = '' }
  }
  function clearError() { walletError.value = ''; networkMessage.value = '' }
  async function connect() {
    if (pending.value) return
    clearError()
    if (!findProvider()) return
    pending.value = true; sessionDisconnected = false
    const revision = ++accountRevision
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      if (disposed || revision !== accountRevision) return
      updateAccounts(accounts)
      if (!address.value) walletError.value = 'No account was shared. Unlock your wallet and try again.'
      else await readChain()
    } catch (error) { if (!disposed && revision === accountRevision) walletError.value = errorMessage(error, 'Connection') }
    finally { pending.value = false }
  }
  async function addNetwork() {
    if (networkPending.value) return
    clearError()
    if (!findProvider()) return
    networkPending.value = true
    const revision = sessionRevision
    const requestProvider = provider
    const isCurrentRequest = () => !disposed && revision === sessionRevision && provider === requestProvider
    try {
      await requestProvider.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x1237', chainName: 'Robinhood Chain', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://rpc.mainnet.chain.robinhood.com'], blockExplorerUrls: ['https://robinhoodchain.blockscout.com'] }] })
      if (!isCurrentRequest()) return
      await readChain()
      if (!isCurrentRequest()) return
      networkMessage.value = chainId.value === '0x1237' ? 'Robinhood Chain is selected in your wallet.' : 'Network added. Select Robinhood Chain in your wallet to use it.'
    } catch (error) { if (isCurrentRequest()) walletError.value = errorMessage(error, 'Network request') }
    finally { networkPending.value = false }
  }
  function disconnect() { sessionDisconnected = true; accountRevision++; chainRevision++; sessionRevision++; address.value = ''; chainId.value = ''; clearError() }
  onMounted(async () => {
    if (!window.ethereum?.request || !findProvider()) return
    const revision = accountRevision
    try {
      const accounts = await provider.request({ method: 'eth_accounts' })
      if (disposed || revision !== accountRevision) return
      updateAccounts(accounts)
      if (address.value) await readChain()
    } catch { /* Permissionless restoration is optional. */ }
  })
  onUnmounted(() => { disposed = true; removeListeners() })
  return { address, shortAddress, chainId, pending, networkPending, walletError, networkMessage, connect, addNetwork, disconnect, clearError }
}
