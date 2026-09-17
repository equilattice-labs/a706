<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronDown, Compass, ExternalLink, Layers, Menu, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Wallet, X } from 'lucide-vue-next'
import UiDialog from './components/UiDialog.vue'
import MarketChart from './components/MarketChart.vue'
import SignalOrbit from './components/SignalOrbit.vue'
import MarketComparison from './components/MarketComparison.vue'
import { brand, storageKeys, legacyStorageKeys } from './data/brand.js'
import { markets, money } from './data/markets.js'
import { useWallet } from './composables/useWallet.js'

const { address, shortAddress, chainId, pending, networkPending, walletError, networkMessage, connect, addNetwork, disconnect, clearError } = useWallet()
const activeTab = ref('All assets')
const search = ref('')
const watchlistOnly = ref(false)
const saved = ref([])
const selected = ref(markets[0])
const amount = ref('1000')
const sort = ref('signal')
const activeSection = ref('top')
const menuOpen = ref(false)
const dialog = ref('')
const toast = ref('')
const undoAction = ref(null)
const storageAvailable = ref(true)
const memoSaved = ref(false)
let toastTimer
let scrollFrame
const featuredMarkets = [markets[0], markets[3], markets[4]]
async function exploreMarket(market) {
  resetFilters(); navigate('terminal'); selected.value = market
  await nextTick()
  window.location.hash = 'asset-spotlight'
  document.getElementById('asset-spotlight')?.scrollIntoView({ behavior: 'instant', block: 'start' })
  document.getElementById('selected-asset-title')?.focus({ preventScroll: true })
}
async function focusComparison() {
  navigate('terminal')
  await nextTick()
  document.getElementById('asset-spotlight')?.scrollIntoView({ behavior: 'instant', block: 'start' })
  document.querySelector('[aria-label="Compare asset"]')?.focus({ preventScroll: true })
}
const tabs = ['All assets', 'Stocks', 'ETFs', 'Crypto']
const filteredMarkets = computed(() => markets.filter(m =>
  (activeTab.value === 'All assets' || m.category === activeTab.value) &&
  (!watchlistOnly.value || saved.value.includes(m.symbol)) &&
  `${m.symbol} ${m.name}`.toLowerCase().includes(search.value.trim().toLowerCase())
).sort((a, b) => sort.value === 'signal' ? b.score - a.score : sort.value === 'change' ? b.change - a.change : a.name.localeCompare(b.name)))
const amountValue = computed(() => Number(amount.value))
const amountError = computed(() => !amount.value.trim() ? 'Enter an amount to see your estimate.' :
  !/^\d+(\.\d{0,2})?$/.test(amount.value.trim()) || !Number.isFinite(amountValue.value) || amountValue.value <= 0 ? 'Enter a positive amount with up to 2 decimal places.' :
  amountValue.value > 1000000 ? 'Use an amount of $1,000,000 or less for this preview.' : '')
const estimate = computed(() => amountError.value ? '—' : (amountValue.value / selected.value.price).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }))
const isSaved = computed(() => saved.value.includes(selected.value.symbol))
const chainLabel = computed(() => !address.value ? 'Wallet not connected' : chainId.value === '0x1237' ? 'Robinhood Chain' : 'Another network')
function notify(message, undo = null) { undoAction.value = undo; toast.value = message; window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { toast.value = '' }, 6500) }
function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); storageAvailable.value = true; return true }
  catch { storageAvailable.value = false; notify('Browser storage is unavailable. Changes will last for this session.'); return false }
}
function toggleSaved(market) {
  const exists = saved.value.includes(market.symbol)
  saved.value = exists ? saved.value.filter(s => s !== market.symbol) : [...saved.value, market.symbol]
  if (persist(storageKeys.watchlist, saved.value)) notify(`${market.symbol} ${exists ? 'removed from' : 'added to'} your watchlist`, () => {
    saved.value = exists ? [...new Set([...saved.value, market.symbol])] : saved.value.filter(s => s !== market.symbol)
    if (persist(storageKeys.watchlist, saved.value)) notify('Watchlist change undone')
  })
}
function resetFilters() { search.value = ''; activeTab.value = 'All assets'; watchlistOnly.value = false }
function navigate(id, watchlist = false) {
  watchlistOnly.value = watchlist
  if (watchlist) { search.value = ''; activeTab.value = 'All assets' }
  activeSection.value = id; menuOpen.value = false
}
async function selectMarket(market, reveal = false) {
  selected.value = market
  if (reveal && window.matchMedia('(max-width: 900px)').matches) {
    await nextTick()
    document.getElementById('asset-spotlight')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
    document.getElementById('selected-asset-title')?.focus({ preventScroll: true })
  }
}
function openWallet() { clearError(); dialog.value = 'wallet' }
function preview() { if (!amountError.value) dialog.value = 'order' }
function saveMemo() { memoSaved.value = !memoSaved.value; if (persist(storageKeys.memo, memoSaved.value)) notify(memoSaved.value ? 'Research note saved on this device' : 'Research note removed from saved items') }
function exportPreview() {
  const content = [`${brand.name} — illustrative order preview`, '', `Asset: ${selected.value.symbol} (${selected.value.name})`, `Spend: ${money(amountValue.value)} USDG`, `Sample reference price: ${money(selected.value.price)}`, `Illustrative receive: ${estimate.value} ${selected.value.symbol}`, 'Fees and slippage: not included', 'Data: static demonstration fixture, not a live quote', 'No transaction has been signed or sent.', 'RWA availability depends on issuer, venue, jurisdiction, and eligibility.'].join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = `${brand.slug}-${selected.value.symbol.toLowerCase()}-preview.txt`; a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Preview downloaded')
}
function focusSearch() {
  navigate('terminal')
  document.getElementById('terminal')?.scrollIntoView({ behavior: 'instant', block: 'start' })
  document.querySelector('input[type=search]')?.focus({ preventScroll: true })
}
function onKey(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !dialog.value) { event.preventDefault(); focusSearch() }
  if (event.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false
    document.querySelector('.mobile-menu-toggle')?.focus()
  }
}
function updateActiveSection() {
  window.cancelAnimationFrame(scrollFrame)
  scrollFrame = window.requestAnimationFrame(() => {
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) { activeSection.value = 'roadmap'; return }
    const anchorLine = (document.querySelector('.topbar')?.getBoundingClientRect().height || 78) + 70
    activeSection.value = ['top', 'terminal', 'thesis', 'roadmap'].filter(id => document.getElementById(id).getBoundingClientRect().top <= anchorLine).at(-1) || 'top'
  })
}
onMounted(() => {
  try {
    const readLegacy = keys => keys.map(key => localStorage.getItem(key)).find(value => value !== null)
    const currentWatchlist = localStorage.getItem(storageKeys.watchlist)
    const currentMemo = localStorage.getItem(storageKeys.memo)
    const raw = currentWatchlist ?? readLegacy(legacyStorageKeys.watchlist)
    try {
      const stored = JSON.parse(raw || '[]')
      saved.value = Array.isArray(stored) ? [...new Set(stored.filter(s => markets.some(m => m.symbol === s)))] : []
    } catch { saved.value = [] }
    const memo = currentMemo ?? readLegacy(legacyStorageKeys.memo)
    memoSaved.value = memo === 'true'
    if (currentWatchlist === null && raw != null) localStorage.setItem(storageKeys.watchlist, JSON.stringify(saved.value))
    if (currentMemo === null && memo != null) localStorage.setItem(storageKeys.memo, JSON.stringify(memoSaved.value))
  } catch { storageAvailable.value = false }
  window.addEventListener('keydown', onKey)
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  updateActiveSection()
})
onUnmounted(() => { window.clearTimeout(toastTimer); window.cancelAnimationFrame(scrollFrame); window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', updateActiveSection) })
</script>

<template>
  <a class="skip-link" href="#terminal">Skip to markets</a>
  <header class="topbar">
    <div class="header-inner">
      <a class="brand" href="#top" :aria-label="brand.name + ' home'" @click="navigate('top')"><img :src="brand.mark" alt="" width="34" height="34" /><span>{{ brand.name }}</span><span class="brand-beta">BETA</span></a>
      <nav class="desktop-navigation" aria-label="Primary navigation">
        <a href="#terminal" :class="{ active: activeSection === 'terminal' && !watchlistOnly }" @click="navigate('terminal')">Markets</a>
        <a href="#terminal" :class="{ active: watchlistOnly }" @click="navigate('terminal', true)">Watchlist <span>{{ saved.length }}</span></a>
        <a href="#thesis" @click="navigate('thesis')">Our approach</a>
      </nav>
      <div class="topbar-actions"><button class="search-shortcut icon-button" aria-label="Find an asset" @click="focusSearch"><Search :size="18" /></button><button class="wallet-button" @click="openWallet"><Wallet :size="16" /><span>{{ address ? shortAddress : 'Connect wallet' }}</span><ArrowUpRight :size="15" /></button><button class="icon-button mobile-menu-toggle" :aria-label="menuOpen ? 'Close navigation' : 'Open navigation'" :aria-expanded="menuOpen" aria-controls="mobile-navigation" @click="menuOpen = !menuOpen"><component :is="menuOpen ? X : Menu" :size="22" /></button></div>
    </div>
    <nav v-if="menuOpen" id="mobile-navigation" class="mobile-navigation" aria-label="Mobile navigation"><a href="#top" @click="navigate('top')">Overview <Compass :size="18" /></a><a href="#terminal" @click="navigate('terminal')">Markets <Layers :size="18" /></a><a href="#terminal" @click="navigate('terminal', true)">Watchlist ({{ saved.length }}) <Star :size="18" /></a><a href="#thesis" @click="navigate('thesis')">Our approach <BookOpen :size="18" /></a><a href="#roadmap" @click="navigate('roadmap')">Roadmap <ArrowRight :size="18" /></a><button @click="menuOpen = false; clearError(); dialog = 'network'">Network settings <Layers :size="18" /></button><button @click="menuOpen = false; dialog = 'demo'">About this preview <Compass :size="18" /></button></nav>
  </header>
  <main>
    <section id="top" class="overview content-pad">
      <div class="hero-grid">
        <div class="hero-copy"><div class="eyebrow"><span class="status-dot"></span> INDEPENDENT MINDS. CONNECTED MARKETS.</div><h1>Less noise.<br />More <span>perspective.</span></h1><p>Find the patterns that matter. Explore assets, connect the signals, and make space for your next idea.</p><div class="hero-actions"><a class="primary-button" href="#terminal" @click="navigate('terminal')">Open the atlas <ArrowUpRight :size="20" /></a><button class="quiet-link" @click="focusComparison">Compare assets <ArrowRight :size="17" /></button></div><div class="hero-caption"><span class="mini-avatars"><i>N</i><i>Ξ</i><i>S</i></span><span>Equities. Crypto. A wider field of view.<small>Sample markets · No wallet required</small></span></div></div>
        <SignalOrbit :markets="markets" @select="exploreMarket" />
      </div>
      <div class="universe-strip"><span>ONE WORKSPACE.<br /><strong>A WORLD OF POSSIBILITIES.</strong></span><div><Layers :size="18" /><span>Discover the market</span><small>01</small></div><ArrowRight :size="17" /><div><Compass :size="18" /><span>Connect the context</span><small>02</small></div><ArrowRight :size="17" /><div><ShieldCheck :size="18" /><span>Build your perspective</span><small>03</small></div></div>
    </section>
    <section id="terminal" class="market-section content-pad">
      <div class="section-title-row"><div><div class="eyebrow">THE MARKET ATLAS</div><h2>{{ watchlistOnly ? 'Your saved universe.' : 'Where will you look next?' }}</h2></div><button class="demo-indicator" @click="dialog = 'demo'"><span class="status-dot"></span> Sample data <ArrowUpRight :size="14" /></button></div>
      <div class="spotlight-grid"><button v-for="(market, index) in featuredMarkets" :key="market.symbol" class="spotlight-card" @click="selectMarket(market, true)"><span class="spotlight-top"><span class="asset-icon" :class="market.tone">{{ market.monogram }}</span><span><strong>{{ market.symbol }}</strong><small>{{ market.name }}</small></span><ArrowUpRight :size="17" /></span><span class="spotlight-bottom"><span><strong>{{ money(market.price) }}</strong><small :class="market.change >= 0 ? 'positive' : 'negative'">{{ market.change > 0 ? '+' : '' }}{{ market.change.toFixed(2) }}% <em>24h</em></small></span><MarketChart :market="market" mini /></span></button></div>
      <div class="terminal-layout">
        <section class="market-board" aria-label="Asset browser">
          <div class="board-title"><h3>Explore assets <span>{{ markets.length }}</span></h3><button class="watchlist-toggle icon-button" aria-label="Watchlist" :class="{ active: watchlistOnly }" :aria-pressed="watchlistOnly" @click="watchlistOnly = !watchlistOnly"><Star :size="17" :fill="watchlistOnly ? 'currentColor' : 'none'" /></button></div>
          <label class="search-field"><Search :size="17" /><input v-model="search" type="search" placeholder="Search assets…" aria-label="Search assets" autocomplete="off" /><kbd>⌘ K</kbd></label>
          <div class="market-tabs" role="group" aria-label="Asset category"><button v-for="tab in tabs" :key="tab" :aria-pressed="activeTab === tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab === 'All assets' ? 'All' : tab }}</button></div>
          <div class="list-toolbar"><span>{{ filteredMarkets.length }} ASSETS</span><label><SlidersHorizontal :size="13" /><select v-model="sort" aria-label="Sort markets"><option value="signal">Signal score</option><option value="change">24h change</option><option value="name">Name A–Z</option></select></label></div>
          <div v-if="search || activeTab !== 'All assets'" class="applied-filters"><span>{{ filteredMarkets.length }} results<span v-if="search"> for “{{ search.trim() }}”</span></span><button aria-label="Clear filters" @click="search = ''; activeTab = 'All assets'"><X :size="16" /></button></div>
          <ul v-if="filteredMarkets.length" class="market-list" aria-label="Markets"><li v-for="market in filteredMarkets" :key="market.symbol" class="market-row" :class="{ selected: selected.symbol === market.symbol }"><button class="market-select" :aria-label="'View ' + market.symbol + ' details'" :aria-pressed="selected.symbol === market.symbol" @click="selectMarket(market, true)"><span class="asset-icon" :class="market.tone">{{ market.monogram }}</span><span class="asset-identity"><strong>{{ market.symbol }}</strong><small>{{ market.name }}</small></span><span class="market-price"><strong>{{ money(market.price) }}</strong><small :class="market.change >= 0 ? 'positive' : 'negative'">{{ market.change > 0 ? '+' : '' }}{{ market.change.toFixed(2) }}%</small></span></button><button class="save-asset icon-button" :aria-label="(saved.includes(market.symbol) ? 'Remove ' : 'Save ') + market.symbol + (saved.includes(market.symbol) ? ' from' : ' to') + ' watchlist'" :aria-pressed="saved.includes(market.symbol)" @click="toggleSaved(market)"><Star :size="15" :fill="saved.includes(market.symbol) ? 'currentColor' : 'none'" /></button></li></ul>
          <div v-else class="empty-state" role="status"><component :is="watchlistOnly ? Star : Search" :size="27" /><h3>{{ watchlistOnly && !saved.length ? 'Your universe starts here.' : 'No matching markets.' }}</h3><p>{{ watchlistOnly && !saved.length ? 'Star an asset to keep it in your orbit. Saved on this device.' : 'Try another name or symbol, or reset your filters.' }}</p><button class="secondary-button" @click="resetFilters">{{ watchlistOnly && !saved.length ? 'Explore all assets' : 'Clear filters' }} <ArrowRight :size="16" /></button></div>
          <div class="board-footer"><span aria-live="polite">{{ filteredMarkets.length }} of {{ markets.length }} assets</span><button @click="dialog = 'method'">About scores <ArrowUpRight :size="13" /></button></div><p v-if="!storageAvailable" class="storage-note" role="status">Browser storage is unavailable. Your watchlist is kept for this session only.</p>
          <button class="network-link" @click="clearError(); dialog = 'network'"><span class="network-symbol">⌘</span><span>Network settings<small>Robinhood Chain</small></span><ChevronDown :size="16" /></button>
        </section>
        <section id="asset-spotlight" class="detail-panel" aria-label="Selected market details">
          <a class="back-to-markets" href="#terminal"><ArrowRight :size="15" /> Back to assets</a>
          <div class="detail-heading"><div class="detail-asset"><span class="asset-icon" :class="selected.tone">{{ selected.monogram }}</span><div><h3 id="selected-asset-title" tabindex="-1">{{ selected.symbol }} <span class="category-label">{{ selected.category }}</span></h3><span>{{ selected.name }}</span></div></div><button class="icon-button detail-save" :aria-label="(isSaved ? 'Remove' : 'Save') + ' selected asset ' + (isSaved ? 'from' : 'to') + ' watchlist'" :aria-pressed="isSaved" @click="toggleSaved(selected)"><Star :size="19" :fill="isSaved ? 'currentColor' : 'none'" /></button></div>
          <div class="detail-workspace"><div class="analysis-pane"><div class="detail-price"><strong>{{ money(selected.price) }}</strong><span :class="selected.change >= 0 ? 'positive' : 'negative'"><component :is="selected.change >= 0 ? ArrowUpRight : ArrowDownRight" :size="16" />{{ selected.change > 0 ? '+' : '' }}{{ selected.change.toFixed(2) }}% <small>24h</small></span></div><MarketComparison :market="selected" :markets="markets" /><div class="detail-metrics"><span><small>Signal score <button aria-label="About signal scoring" @click="dialog = 'method'">i</button></small><strong>{{ selected.score }}<em>/100</em></strong></span><span><small>Sample 24h volume</small><strong>{{ selected.volume }}</strong></span><span><small>Source</small><strong class="sample-source">Demo dataset</strong></span></div></div>
          <form class="preview-form" @submit.prevent="preview"><div class="preview-step"><span>EXPLORE AN AMOUNT</span><ArrowUpRight :size="16" /></div><h4>Turn a view<br />into a what-if.</h4><p class="preview-intro">A little room to run the numbers.</p><div class="amount-label"><label for="spend">You spend</label><span>USDG</span></div><div class="amount-field" :class="{ invalid: amountError }"><span>$</span><input id="spend" v-model="amount" type="text" inputmode="decimal" autocomplete="off" aria-describedby="amount-help" :aria-invalid="Boolean(amountError)" /></div><div class="amount-presets" role="group" aria-label="Quick amounts"><button v-for="preset in [100, 1000, 10000]" :key="preset" type="button" :aria-pressed="amountValue === preset" @click="amount = String(preset)">{{ money(preset).replace('.00', '') }}</button></div><p id="amount-help" class="amount-help" :class="{ 'input-error': amountError }">{{ amountError || 'Illustrative estimate, before fees and slippage.' }}</p><div class="receive-row" aria-live="polite"><span>Estimated quantity</span><strong>{{ estimate }} <small>{{ selected.symbol }}</small></strong></div><button class="primary-button full-width" type="submit" :disabled="Boolean(amountError)">Review preview <ArrowRight :size="18" /></button><p class="preview-footnote"><ShieldCheck :size="14" /> No transaction. No wallet needed.</p></form></div>
        </section>
      </div>
    </section>
    <section id="thesis" class="approach-section content-pad"><div class="approach-heading"><div class="eyebrow">A DIFFERENT WAY TO SEE</div><h2>A signal is a beginning.<br /><span>Make it your own.</span></h2><p>Markets move. Your perspective takes shape.<br />A simpler path from curiosity to context.</p><button class="save-memo secondary-button" :aria-pressed="memoSaved" @click="saveMemo"><component :is="memoSaved ? CheckCheck : BookOpen" :size="17" />{{ memoSaved ? 'Note saved' : 'Save this note' }}</button></div><div class="approach-grid"><article><span class="approach-number">01</span><div><h3>Follow your curiosity.</h3><p>Start with an asset or an idea. Search across equities, ETFs and crypto in one focused workspace.</p></div><Search :size="22" /></article><article><span class="approach-number">02</span><div><h3>Widen your lens.</h3><p>Compare sample trends side by side. Scores spark questions; they don't make decisions for you.</p></div><Compass :size="22" /></article><article><span class="approach-number">03</span><div><h3>Keep your perspective.</h3><p>Save what matters, explore an amount, and take your time. Your keys and your decisions stay yours.</p></div><ShieldCheck :size="22" /></article></div></section>
    <section id="roadmap" class="roadmap-section content-pad"><div class="roadmap-intro"><div><div class="eyebrow">ON THE HORIZON</div><h2>A wider universe ahead.</h2></div><a class="quiet-link" href="https://docs.robinhood.com/chain/" target="_blank" rel="noreferrer">Explore Robinhood Chain <ExternalLink :size="15" /></a></div><ol class="roadmap-list"><li class="current"><span class="roadmap-stage"><span class="roadmap-node"><Check :size="14" /></span> NOW EXPLORING</span><h3>Your market atlas</h3><p>Discover assets, compare sample trends and save a perspective of your own.</p></li><li><span class="roadmap-stage"><span class="roadmap-node">02</span> PLANNED</span><h3>Signals with substance</h3><p>Live sources, liquidity checks and wallet-native routing.</p></li><li><span class="roadmap-stage"><span class="roadmap-node">03</span> PLANNED</span><h3>Ideas, connected</h3><p>Attributable research, curated collections and tools for builders.</p></li></ol></section>
    <footer class="site-footer content-pad"><div class="footer-top"><a href="#top" class="brand" @click="navigate('top')"><img :src="brand.mark" alt="" width="34" height="34" /><span>{{ brand.name }}</span></a><span>{{ brand.tagline }}</span><button class="quiet-link" @click="dialog = 'demo'">About this preview <ArrowUpRight :size="15" /></button></div><div class="footer-bottom"><span>© 2026 {{ brand.name }}</span><p>Illustrative data. Not financial advice. RWA access depends on eligibility and jurisdiction.</p><a href="https://robinhoodchain.blockscout.com" target="_blank" rel="noreferrer">Block explorer <ExternalLink :size="13" /></a></div></footer>
  </main>
  <UiDialog :open="dialog === 'order'" title="Review your market preview." @close="dialog = ''"><div class="dialog-kicker"><Sparkles :size="16" /> ILLUSTRATIVE ORDER PREVIEW</div><p class="dialog-intro">Review the numbers for {{ selected.name }}. This is a sample calculation, not an executable quote.</p><dl class="preview-summary"><div><dt>Asset</dt><dd>{{ selected.symbol }}</dd></div><div><dt>You spend</dt><dd>{{ money(amountValue) }} USDG</dd></div><div><dt>Sample reference price</dt><dd>{{ money(selected.price) }}</dd></div><div class="summary-highlight"><dt>Illustrative receive</dt><dd>{{ estimate }} {{ selected.symbol }}</dd></div><div><dt>Fees & slippage</dt><dd>Not included</dd></div><div><dt>Wallet</dt><dd>{{ address ? shortAddress : 'Not connected' }}</dd></div></dl><div class="dialog-notice"><ShieldCheck :size="19" /><p>No transaction has been signed or sent. Live quotes and execution are not available in this preview.</p></div><div class="dialog-actions"><button class="secondary-button" @click="dialog = ''">Back to explore</button><button class="primary-button" @click="exportPreview">Save preview <ArrowDown :size="16" /></button></div></UiDialog>
  <UiDialog :open="dialog === 'wallet'" :title="address ? 'Your connected wallet.' : 'Connect your wallet.'" @close="dialog = ''"><div class="dialog-kicker"><Wallet :size="16" /> YOUR KEYS. YOUR CONTROL.</div><p class="dialog-intro">Connect an installed EVM wallet. You can explore markets and calculate sample previews without connecting.</p><div v-if="address" class="connected-wallet"><span class="status-dot"></span><span><strong>{{ shortAddress }}</strong><small>{{ chainLabel }}</small></span><Check :size="20" /><code>{{ address }}</code></div><div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div><div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div><button v-if="!address" class="primary-button full-width" :disabled="pending" @click="connect">{{ pending ? 'Check your wallet…' : 'Connect browser wallet' }} <Wallet :size="17" /></button><template v-else><button class="primary-button full-width" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Check your wallet…' : 'Add Robinhood Chain' }} <Plus :size="17" /></button><button class="disconnect-button" @click="disconnect(); notify('Wallet disconnected from this workspace')">Disconnect this session</button></template><a v-if="!address" class="wallet-help" href="https://ethereum.org/en/wallets/find-wallet/" target="_blank" rel="noreferrer">Need a wallet? Explore EVM wallets <ExternalLink :size="14" /></a><p class="dialog-footnote">Connecting requests account access only. {{ brand.name }} does not request a signature or send a transaction.</p></UiDialog>
  <UiDialog :open="dialog === 'network'" title="Your network connection." @close="dialog = ''"><div class="dialog-kicker"><Layers :size="16" /> ROBINHOOD CHAIN</div><p class="dialog-intro">{{ brand.name }} is designed around the Robinhood Chain ecosystem. Add the network to your installed wallet when you're ready.</p><dl class="preview-summary"><div><dt>Network</dt><dd>Robinhood Chain</dd></div><div><dt>Chain ID</dt><dd>4663</dd></div><div><dt>Gas asset</dt><dd>ETH</dd></div><div><dt>Wallet status</dt><dd>{{ chainLabel }}</dd></div></dl><div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div><div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div><button class="primary-button full-width" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Check your wallet…' : 'Add network to wallet' }} <Plus :size="17" /></button><a class="wallet-help" href="https://docs.robinhood.com/chain/connecting" target="_blank" rel="noreferrer">Read network documentation <ExternalLink :size="14" /></a></UiDialog>
  <UiDialog :open="dialog === 'demo'" title="Inside the signal atlas." @close="dialog = ''"><div class="dialog-kicker"><Compass :size="16" /> {{ brand.name.toUpperCase() }} RESEARCH PREVIEW</div><p class="dialog-intro">Get a feel for a more considered market experience. All prices, changes, charts, volumes and signal scores are static examples, not live market information.</p><ul class="dialog-list"><li><Check :size="17" /><span>Search and compare five sample assets.</span></li><li><Check :size="17" /><span>Keep a watchlist and save research notes on this device.</span></li><li><Check :size="17" /><span>Calculate and download illustrative order previews.</span></li><li><Check :size="17" /><span>Connect an EVM wallet without signing a transaction.</span></li></ul><div class="dialog-notice"><BookOpen :size="19" /><p>Live signals, executable quotes and community collections are planned. No live data feed or trading service is connected.</p></div><button class="primary-button full-width" @click="dialog = ''">Got it. Let's explore <ArrowRight :size="17" /></button></UiDialog>
  <UiDialog :open="dialog === 'method'" title="How signal scores work." @close="dialog = ''"><div class="dialog-kicker"><Sparkles :size="16" /> CONTEXT, NOT A RECOMMENDATION</div><p class="dialog-intro">Our planned signal score brings together conversation velocity, source quality, recency and market context on a 0–100 scale.</p><div class="method-score"><strong>{{ selected.score }}<span>/100</span></strong><p>{{ selected.symbol }} · illustrative score</p></div><p class="dialog-intro">Scores in this workspace are fixed examples. They are not calculated from live sources, a prediction of future performance or a recommendation to buy.</p><button class="primary-button full-width" @click="dialog = ''">Back to the market <ArrowRight :size="17" /></button></UiDialog>
  <div class="toast-region" role="status" aria-live="polite" aria-atomic="true"><div v-if="toast" class="toast"><Check :size="17" /><span>{{ toast }}</span><button v-if="undoAction" class="undo-button" @click="undoAction()">Undo</button><button aria-label="Dismiss notification" @click="toast = ''"><X :size="15" /></button></div></div>
</template>
