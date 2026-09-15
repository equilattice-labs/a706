<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronDown, Compass, ExternalLink, Filter, Layers, Menu, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Wallet, Waves, X } from 'lucide-vue-next'
import UiDialog from './components/UiDialog.vue'
import MarketChart from './components/MarketChart.vue'
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
const storageAvailable = ref(true)
const memoSaved = ref(false)
let toastTimer
let scrollFrame
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
function notify(message) { toast.value = message; window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { toast.value = '' }, 4200) }
function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); storageAvailable.value = true; return true }
  catch { storageAvailable.value = false; notify('Browser storage is unavailable. Changes will last for this session.'); return false }
}
function toggleSaved(market) {
  const exists = saved.value.includes(market.symbol)
  saved.value = exists ? saved.value.filter(s => s !== market.symbol) : [...saved.value, market.symbol]
  if (persist('siftider-watchlist', saved.value)) notify(`${market.symbol} ${exists ? 'removed from' : 'added to'} your watchlist`)
}
function resetFilters() { search.value = ''; activeTab.value = 'All assets'; watchlistOnly.value = false }
function navigate(id, watchlist = false) {
  watchlistOnly.value = watchlist
  if (watchlist) { search.value = ''; activeTab.value = 'All assets' }
  activeSection.value = id; menuOpen.value = false
}
async function selectMarket(market, reveal = false) {
  selected.value = market
  if (reveal && window.matchMedia('(max-width: 760px)').matches) {
    await nextTick()
    document.getElementById('asset-spotlight')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
    document.getElementById('selected-asset-title')?.focus({ preventScroll: true })
  }
}
function openWallet() { clearError(); dialog.value = 'wallet' }
function preview() { if (!amountError.value) dialog.value = 'order' }
function saveMemo() { memoSaved.value = !memoSaved.value; if (persist('siftider-memo-saved', memoSaved.value)) notify(memoSaved.value ? 'Research note saved on this device' : 'Research note removed from saved items') }
function exportPreview() {
  const content = ['siftider — illustrative order preview', '', `Asset: ${selected.value.symbol} (${selected.value.name})`, `Spend: ${money(amountValue.value)} USDG`, `Sample reference price: ${money(selected.value.price)}`, `Illustrative receive: ${estimate.value} ${selected.value.symbol}`, 'Fees and slippage: not included', 'Data: static demonstration fixture, not a live quote', 'No transaction has been signed or sent.', 'RWA availability depends on issuer, venue, jurisdiction, and eligibility.'].join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = `siftider-${selected.value.symbol.toLowerCase()}-preview.txt`; a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Preview downloaded')
}
function onKey(event) {
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
    const raw = localStorage.getItem('siftider-watchlist') ?? localStorage.getItem('siftide-watchlist')
    try {
      const stored = JSON.parse(raw || '[]')
      saved.value = Array.isArray(stored) ? [...new Set(stored.filter(s => markets.some(m => m.symbol === s)))] : []
    } catch { saved.value = [] }
    memoSaved.value = (localStorage.getItem('siftider-memo-saved') ?? localStorage.getItem('siftide-memo-saved')) === 'true'
  } catch { storageAvailable.value = false }
  window.addEventListener('keydown', onKey)
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  updateActiveSection()
})
onUnmounted(() => { window.clearTimeout(toastTimer); window.cancelAnimationFrame(scrollFrame); window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', updateActiveSection) })
</script>

<template>
  <a class="skip-link" href="#terminal">Skip to markets</a>
  <div class="workspace">
    <aside class="sidebar" aria-label="Workspace navigation">
      <a class="brand" href="#top" aria-label="siftider home" @click="navigate('top')"><img src="/assets/siftider-mark.svg" alt="" width="34" height="34" /><span>siftider<span class="brand-period">.</span></span></a>
      <div class="workspace-label">YOUR MARKET COMPASS</div>
      <nav class="side-nav" aria-label="Primary navigation">
        <a href="#top" :class="{ active: activeSection === 'top' }" :aria-current="activeSection === 'top' ? 'location' : undefined" @click="navigate('top')"><Compass :size="19" /> Overview <span class="nav-active-dot"></span></a>
        <a href="#terminal" :class="{ active: activeSection === 'terminal' && !watchlistOnly }" :aria-current="activeSection === 'terminal' && !watchlistOnly ? 'location' : undefined" @click="navigate('terminal')"><Layers :size="19" /> Markets <span class="nav-count">05</span></a>
        <a href="#terminal" :class="{ active: watchlistOnly }" @click="navigate('terminal', true)"><Star :size="19" /> Watchlist <span class="nav-count">{{ String(saved.length).padStart(2, '0') }}</span></a>
      </nav>
      <div class="nav-divider"></div><div class="workspace-label">THE BIGGER PICTURE</div>
      <nav class="side-nav secondary-nav" aria-label="Project information">
        <a href="#thesis" :class="{ active: activeSection === 'thesis' }" @click="navigate('thesis')"><BookOpen :size="18" /> Our approach <span v-if="memoSaved" class="saved-dot" aria-label="Saved note"></span></a>
        <a href="#roadmap" :class="{ active: activeSection === 'roadmap' }" @click="navigate('roadmap')"><SlidersHorizontal :size="18" /> What's next</a>
        <a href="https://docs.robinhood.com/chain/" target="_blank" rel="noreferrer"><ExternalLink :size="18" /> Chain documentation</a>
      </nav>
      <div class="sidebar-bottom"><div class="sidebar-note"><Waves :size="25" /><p>A little less noise.<br /><strong>A lot more perspective.</strong></p><span>Clear signals. Considered moves.</span></div><button class="network-link" @click="clearError(); dialog = 'network'"><span class="status-dot"></span><span>Robinhood Chain<small>Network settings</small></span><ChevronDown :size="15" /></button><span class="version-label">siftider / research preview 0.1</span></div>
    </aside>
    <div class="main-shell">
      <header class="topbar">
        <a class="brand mobile-brand" href="#top" @click="navigate('top')"><img src="/assets/siftider-mark.svg" alt="" width="29" height="29" /><span>siftider.</span></a>
        <div class="breadcrumb"><span>Workspace</span><span>/</span><strong>{{ activeSection === 'terminal' ? (watchlistOnly ? 'Watchlist' : 'Markets') : activeSection === 'thesis' ? 'Our approach' : activeSection === 'roadmap' ? "What's next" : 'Overview' }}</strong></div>
        <div class="topbar-actions"><button class="demo-indicator" @click="dialog = 'demo'"><span></span> Demo workspace <span class="info-i">i</span></button><button class="wallet-button" @click="openWallet"><Wallet :size="16" /><span>{{ address ? shortAddress : 'Connect wallet' }}</span></button><button class="icon-button mobile-menu-toggle" :aria-label="menuOpen ? 'Close navigation' : 'Open navigation'" :aria-expanded="menuOpen" aria-controls="mobile-navigation" @click="menuOpen = !menuOpen"><component :is="menuOpen ? X : Menu" :size="21" /></button></div>
        <nav v-if="menuOpen" id="mobile-navigation" class="mobile-navigation" aria-label="Mobile navigation"><a href="#top" @click="navigate('top')">Overview <Compass :size="17" /></a><a href="#terminal" @click="navigate('terminal')">Markets <Layers :size="17" /></a><a href="#terminal" @click="navigate('terminal', true)">Watchlist ({{ saved.length }}) <Star :size="17" /></a><a href="#thesis" @click="navigate('thesis')">Our approach <BookOpen :size="17" /></a><a href="#roadmap" @click="navigate('roadmap')">What's next <ArrowRight :size="17" /></a><button @click="menuOpen = false; clearError(); dialog = 'network'">Network settings <Layers :size="17" /></button><button @click="menuOpen = false; dialog = 'demo'">About this preview <Compass :size="17" /></button></nav>
      </header>
      <main>
        <section id="top" class="overview content-pad">
          <div class="overview-heading"><div class="eyebrow"><span class="tiny-line"></span> AN OPEN-MARKET PERSPECTIVE</div><span class="edition">THE SIFT / VOL. 001</span></div>
          <div class="hero-grid">
            <div class="hero-copy"><h1>Find your signal.<br /><em>Move with clarity.</em></h1><p>A considered view of tokenized stocks and crypto.<br class="desktop-break" /> Sift through the noise. Put every move in context.</p><div class="hero-actions"><a class="primary-button" href="#terminal" @click="navigate('terminal')">Explore markets <ArrowDown :size="17" /></a><a class="quiet-link" href="#thesis" @click="navigate('thesis')">Meet siftider <ArrowUpRight :size="16" /></a></div><div class="hero-caption"><ShieldCheck :size="14" /> Your perspective. Your wallet. Your control.</div></div>
            <article class="feature-card"><div class="feature-card-top"><span><Sparkles :size="15" /> ON OUR RADAR</span><span class="feature-chip">SAMPLE SIGNAL</span></div><div class="feature-title"><div class="feature-asset">N</div><div><h2>The AI conversation,<br />in market context.</h2><p>NVDAx <span>·</span> Tokenized equity</p></div></div><div class="feature-visual" aria-hidden="true"><svg viewBox="0 0 560 110" preserveAspectRatio="none"><defs><linearGradient id="tide-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#92d2bc" stop-opacity=".19"/><stop offset="1" stop-color="#92d2bc" stop-opacity="0"/></linearGradient></defs><path d="M0 88 C25 85 30 92 55 78 S85 90 110 70 S135 75 160 62 S185 80 215 54 S240 62 270 46 S300 61 330 38 S365 52 395 30 S430 38 460 20 S495 29 525 13 S545 18 560 8 L560 110 H0Z" fill="url(#tide-fill)"/><path d="M0 88 C25 85 30 92 55 78 S85 90 110 70 S135 75 160 62 S185 80 215 54 S240 62 270 46 S300 61 330 38 S365 52 395 30 S430 38 460 20 S495 29 525 13 S545 18 560 8" fill="none" stroke="#a3dbc5" stroke-width="2"/><path d="M0 98 C80 90 105 101 155 88 S240 97 280 77 S365 84 410 64 S495 72 560 50" fill="none" stroke="#507971" stroke-width="1" stroke-dasharray="4 6"/></svg><span>Conversation</span><span>Market context</span></div><div class="feature-bottom"><div><b>84.6<span>/100</span></b><small>Illustrative signal score</small></div><a href="#terminal" class="feature-link" @click="selectMarket(markets[0]); navigate('terminal')">Explore the signal <ArrowUpRight :size="18" /></a></div></article>
          </div>
          <div class="principles-strip"><span><span class="strip-number">01</span> Discover the conversation</span><span><span class="strip-number">02</span> Understand the context</span><span><span class="strip-number">03</span> Preview your next move <ArrowDownRight :size="16" /></span></div>
        </section>
        <section id="terminal" class="market-section content-pad">
          <div class="section-title-row"><div><div class="eyebrow">YOUR NEXT IDEA STARTS HERE</div><h2>{{ watchlistOnly ? 'Your watchlist' : 'The market, in focus.' }}<span class="count-tag">{{ watchlistOnly ? saved.length : markets.length }}</span></h2></div><span class="data-note"><span class="status-dot muted-dot"></span> Illustrative data · USD</span></div>
          <div class="terminal-layout">
            <div class="market-board">
              <div class="market-toolbar"><label class="search-field"><Search :size="17" /><input v-model="search" type="search" placeholder="Search assets" aria-label="Search assets" autocomplete="off" /><span class="search-hint">{{ markets.length }} assets</span></label><button class="watchlist-toggle" :class="{ active: watchlistOnly }" :aria-pressed="watchlistOnly" @click="watchlistOnly = !watchlistOnly"><Star :size="16" :fill="watchlistOnly ? 'currentColor' : 'none'" /><span>Watchlist</span></button></div>
              <div class="filter-row"><div class="market-tabs" role="group" aria-label="Asset category"><button v-for="tab in tabs" :key="tab" :aria-pressed="activeTab === tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab }}</button></div><label class="sort-control"><SlidersHorizontal :size="14" /><select v-model="sort" aria-label="Sort markets"><option value="signal">Signal score</option><option value="change">24h change</option><option value="name">Name A–Z</option></select></label></div>
              <div class="table-heading" aria-hidden="true"><span>ASSET</span><span>PRICE / 24H</span><span>7D TREND</span><span>SIGNAL</span><span></span></div>
              <ul v-if="filteredMarkets.length" class="market-list" aria-label="Markets"><li v-for="market in filteredMarkets" :key="market.symbol" class="market-row" :class="{ selected: selected.symbol === market.symbol }"><button class="market-select" :aria-label="`View ${market.symbol} details`" :aria-pressed="selected.symbol === market.symbol" @click="selectMarket(market, true)"><span class="asset-identity"><span class="asset-icon" :class="market.tone">{{ market.monogram }}</span><span><strong>{{ market.symbol }}</strong><small>{{ market.name }}</small></span></span><span class="market-price"><strong>{{ money(market.price) }}</strong><small :class="market.change >= 0 ? 'positive' : 'negative'"><component :is="market.change >= 0 ? ArrowUpRight : ArrowDownRight" :size="12" />{{ market.change > 0 ? '+' : '' }}{{ market.change.toFixed(2) }}%</small></span><span class="sparkline"><MarketChart :market="market" mini /></span><span class="score-pill" :class="{ 'score-neutral': market.score < 75 }">{{ market.score }}<span class="score-dot"></span></span></button><button class="save-asset" :aria-label="`${saved.includes(market.symbol) ? 'Remove' : 'Save'} ${market.symbol} ${saved.includes(market.symbol) ? 'from' : 'to'} watchlist`" :aria-pressed="saved.includes(market.symbol)" @click="toggleSaved(market)"><Star :size="16" :fill="saved.includes(market.symbol) ? 'currentColor' : 'none'" /></button></li></ul>
              <div v-else class="empty-state" role="status"><Search :size="28" /><h3>{{ watchlistOnly && !saved.length ? 'Keep your next idea close.' : 'No assets found.' }}</h3><p>{{ watchlistOnly && !saved.length ? 'Star an asset to build a watchlist on this device.' : 'Try a different search or clear your filters.' }}</p><button class="secondary-button" @click="resetFilters">{{ watchlistOnly && !saved.length ? 'Explore all assets' : 'Clear filters' }} <ArrowRight :size="16" /></button></div>
              <div class="board-footer"><span aria-live="polite">{{ filteredMarkets.length }} of {{ markets.length }} assets <span class="footer-dot">·</span> Static sample dataset</span><button @click="dialog = 'method'">How scoring works <ArrowUpRight :size="13" /></button></div>
              <p v-if="!storageAvailable" class="storage-note" role="status">Browser storage is unavailable. Your watchlist is kept for this session only.</p>
              <div class="market-context"><div class="context-icon"><ShieldCheck :size="20" /></div><div><h3>Context before conviction.</h3><p>Prices are only part of the picture. Review the signal, understand the asset, then decide what comes next.</p></div><a href="#thesis" @click="navigate('thesis')" aria-label="Read our approach"><ArrowUpRight :size="22" /></a></div>
            </div>
            <aside id="asset-spotlight" class="detail-panel" aria-label="Selected market details">
              <a class="back-to-markets" href="#terminal"><ArrowUpRight :size="14" /> Back to assets</a><div class="detail-topline"><span>ASSET SPOTLIGHT</span><button class="icon-button" :aria-label="`${isSaved ? 'Remove' : 'Save'} selected asset ${isSaved ? 'from' : 'to'} watchlist`" :aria-pressed="isSaved" @click="toggleSaved(selected)"><Star :size="17" :fill="isSaved ? 'currentColor' : 'none'" /></button></div>
              <div class="detail-asset"><span class="asset-icon" :class="selected.tone">{{ selected.monogram }}</span><div><h3 id="selected-asset-title" tabindex="-1">{{ selected.symbol }}</h3><span>{{ selected.name }}</span></div><span class="category-label">{{ selected.category === 'Stocks' ? 'EQUITY' : selected.category === 'ETFs' ? 'ETF' : 'CRYPTO' }}</span></div>
              <div class="detail-price"><strong>{{ money(selected.price) }}</strong><span :class="selected.change >= 0 ? 'positive' : 'negative'"><component :is="selected.change >= 0 ? ArrowUpRight : ArrowDownRight" :size="15" />{{ selected.change > 0 ? '+' : '' }}{{ selected.change.toFixed(2) }}% <small>24h</small></span></div>
              <div class="detail-chart"><MarketChart :market="selected" /><div class="chart-axis"><span>7 days ago</span><span>Sample history</span><span>Today</span></div></div>
              <div class="detail-metrics"><span><small>Signal score <button aria-label="About signal scoring" @click="dialog = 'method'">i</button></small><strong>{{ selected.score }}<em>/ 100</em></strong></span><span><small>Sample 24h volume</small><strong>{{ selected.volume }}</strong></span></div>
              <form class="preview-form" @submit.prevent="preview"><div class="amount-label"><label for="spend">Explore an amount</label><span>PREVIEW ONLY</span></div><div class="amount-field" :class="{ invalid: amountError }"><span>$</span><input id="spend" v-model="amount" type="text" inputmode="decimal" autocomplete="off" aria-describedby="amount-help" :aria-invalid="Boolean(amountError)" /><span class="currency-label">USDG</span></div><p id="amount-help" class="amount-help" :class="{ 'input-error': amountError }">{{ amountError || 'Illustrative estimate, before fees and slippage.' }}</p><div class="receive-row" aria-live="polite"><span>You could receive</span><strong>{{ estimate }} <span>{{ selected.symbol }}</span></strong></div><button class="primary-button full-width" :disabled="Boolean(amountError)" type="submit">Review preview <ArrowRight :size="17" /></button><p class="preview-note"><ShieldCheck :size="12" /> Explore freely. No transaction is sent.</p></form>
            </aside>
          </div>
        </section>
        <section id="thesis" class="approach-section content-pad">
          <div class="approach-heading"><div><div class="eyebrow">THE SIFTIDER APPROACH</div><h2>A signal is a starting point.<br /><em>Perspective is your edge.</em></h2></div><button class="save-memo" :aria-pressed="memoSaved" @click="saveMemo"><component :is="memoSaved ? CheckCheck : BookOpen" :size="17" />{{ memoSaved ? 'Note saved' : 'Save this note' }}</button></div>
          <div class="approach-grid"><article><span class="approach-number">01 / DISCOVER</span><div class="approach-icon"><Waves :size="26" /></div><h3>Find what matters.</h3><p>Follow the conversation around an asset. Our planned signal layer brings source quality, attention and recency into one considered view.</p><span class="approach-foot">Less noise, more context <ArrowUpRight :size="15" /></span></article><article><span class="approach-number">02 / UNDERSTAND</span><div class="approach-icon"><Filter :size="25" /></div><h3>Look beneath the surface.</h3><p>Price, liquidity and asset eligibility all matter. Live oracle and venue checks are planned; this workspace uses clearly labeled sample data.</p><span class="approach-foot">Questions before conclusions <ArrowUpRight :size="15" /></span></article><article><span class="approach-number">03 / CONSIDER</span><div class="approach-icon"><ArrowUpRight :size="27" /></div><h3>Make the next move yours.</h3><p>Explore an amount and review its illustrative outcome. Wallet-native execution is on our roadmap. Your assets stay in your wallet.</p><span class="approach-foot">Your keys, your decision <ArrowUpRight :size="15" /></span></article></div>
        </section>
        <section id="roadmap" class="roadmap-section content-pad"><div class="roadmap-intro"><div class="eyebrow">BUILT WITH INTENTION</div><h2>A clearer path ahead.</h2><p>From a useful perspective to a connected market experience.</p><a class="quiet-link" href="https://docs.robinhood.com/chain/" target="_blank" rel="noreferrer">Explore Robinhood Chain <ExternalLink :size="14" /></a></div><ol class="roadmap-list"><li class="current"><span class="roadmap-node"><Check :size="12" /></span><div><span class="roadmap-stage">01 <b>AVAILABLE TO EXPLORE</b></span><h3>The research workspace</h3><p>Market discovery, local watchlists and illustrative previews.</p></div></li><li><span class="roadmap-node"></span><div><span class="roadmap-stage">02 <b>PLANNED</b></span><h3>Connected signals & execution</h3><p>Live sources, liquidity checks and wallet-native routing.</p></div></li><li><span class="roadmap-node"></span><div><span class="roadmap-stage">03 <b>PLANNED</b></span><h3>Community collections</h3><p>Attributable research, curated baskets and builder tools.</p></div></li></ol></section>
        <footer class="site-footer content-pad"><div class="footer-top"><a href="#top" class="brand" @click="navigate('top')"><img src="/assets/siftider-mark.svg" alt="" width="27" height="27" /><span>siftider.</span></a><span>Clear signals. Considered moves.</span><button @click="dialog = 'demo'">About this preview <ArrowUpRight :size="14" /></button></div><div class="footer-bottom"><span>© 2026 siftider</span><p>Illustrative data. Not financial advice. RWA access depends on eligibility and jurisdiction.</p><a href="https://robinhoodchain.blockscout.com" target="_blank" rel="noreferrer">Block explorer <ExternalLink :size="12" /></a></div></footer>
      </main>
    </div>
  </div>
  <UiDialog :open="dialog === 'order'" title="A considered next move." @close="dialog = ''"><div class="dialog-kicker"><Sparkles :size="16" /> ILLUSTRATIVE ORDER PREVIEW</div><p class="dialog-intro">Review the numbers for {{ selected.name }}. This is a sample calculation, not an executable quote.</p><dl class="preview-summary"><div><dt>Asset</dt><dd>{{ selected.symbol }}</dd></div><div><dt>You spend</dt><dd>{{ money(amountValue) }} USDG</dd></div><div><dt>Sample reference price</dt><dd>{{ money(selected.price) }}</dd></div><div class="summary-highlight"><dt>Illustrative receive</dt><dd>{{ estimate }} {{ selected.symbol }}</dd></div><div><dt>Fees & slippage</dt><dd>Not included</dd></div><div><dt>Wallet</dt><dd>{{ address ? shortAddress : 'Not connected' }}</dd></div></dl><div class="dialog-notice"><ShieldCheck :size="19" /><p>No transaction has been signed or sent. Live quotes and execution are not available in this preview.</p></div><div class="dialog-actions"><button class="secondary-button" @click="dialog = ''">Back to explore</button><button class="primary-button" @click="exportPreview">Save preview <ArrowDown :size="16" /></button></div></UiDialog>
  <UiDialog :open="dialog === 'wallet'" :title="address ? 'Your wallet, connected.' : 'Bring your own wallet.'" @close="dialog = ''"><div class="dialog-kicker"><Wallet :size="16" /> YOUR KEYS. YOUR CONTROL.</div><p class="dialog-intro">Connect an installed EVM wallet. You can explore markets and calculate sample previews without connecting.</p><div v-if="address" class="connected-wallet"><span class="status-dot"></span><span><strong>{{ shortAddress }}</strong><small>{{ chainLabel }}</small></span><Check :size="20" /><code>{{ address }}</code></div><div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div><div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div><button v-if="!address" class="primary-button full-width" :disabled="pending" @click="connect">{{ pending ? 'Check your wallet…' : 'Connect browser wallet' }} <Wallet :size="17" /></button><template v-else><button class="primary-button full-width" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Check your wallet…' : 'Add Robinhood Chain' }} <Plus :size="17" /></button><button class="disconnect-button" @click="disconnect(); notify('Wallet disconnected from this workspace')">Disconnect this session</button></template><a v-if="!address" class="wallet-help" href="https://ethereum.org/en/wallets/find-wallet/" target="_blank" rel="noreferrer">Need a wallet? Explore EVM wallets <ExternalLink :size="14" /></a><p class="dialog-footnote">Connecting requests account access only. siftider does not request a signature or send a transaction.</p></UiDialog>
  <UiDialog :open="dialog === 'network'" title="Your network connection." @close="dialog = ''"><div class="dialog-kicker"><Layers :size="16" /> ROBINHOOD CHAIN</div><p class="dialog-intro">siftider is designed around the Robinhood Chain ecosystem. Add the network to your installed wallet when you're ready.</p><dl class="preview-summary"><div><dt>Network</dt><dd>Robinhood Chain</dd></div><div><dt>Chain ID</dt><dd>4663</dd></div><div><dt>Gas asset</dt><dd>ETH</dd></div><div><dt>Wallet status</dt><dd>{{ chainLabel }}</dd></div></dl><div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div><div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div><button class="primary-button full-width" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Check your wallet…' : 'Add network to wallet' }} <Plus :size="17" /></button><a class="wallet-help" href="https://docs.robinhood.com/chain/connecting" target="_blank" rel="noreferrer">Read network documentation <ExternalLink :size="14" /></a></UiDialog>
  <UiDialog :open="dialog === 'demo'" title="A workspace to explore." @close="dialog = ''"><div class="dialog-kicker"><Compass :size="16" /> SIFTIDER RESEARCH PREVIEW</div><p class="dialog-intro">Get a feel for a more considered market experience. All prices, changes, charts, volumes and signal scores are static examples, not live market information.</p><ul class="dialog-list"><li><Check :size="17" /><span>Search and compare five sample assets.</span></li><li><Check :size="17" /><span>Keep a watchlist and save research notes on this device.</span></li><li><Check :size="17" /><span>Calculate and download illustrative order previews.</span></li><li><Check :size="17" /><span>Connect an EVM wallet without signing a transaction.</span></li></ul><div class="dialog-notice"><BookOpen :size="19" /><p>Live signals, executable quotes and community collections are planned. No live data feed or trading service is connected.</p></div><button class="primary-button full-width" @click="dialog = ''">Got it. Let's explore <ArrowRight :size="17" /></button></UiDialog>
  <UiDialog :open="dialog === 'method'" title="Understand the signal." @close="dialog = ''"><div class="dialog-kicker"><Sparkles :size="16" /> CONTEXT, NOT A RECOMMENDATION</div><p class="dialog-intro">Our planned signal score brings together conversation velocity, source quality, recency and market context on a 0–100 scale.</p><div class="method-score"><strong>{{ selected.score }}<span>/100</span></strong><p>{{ selected.symbol }} · illustrative score</p></div><p class="dialog-intro">Scores in this workspace are fixed examples. They are not calculated from live sources, a prediction of future performance or a recommendation to buy.</p><button class="primary-button full-width" @click="dialog = ''">Back to the market <ArrowRight :size="17" /></button></UiDialog>
  <div class="toast-region" role="status" aria-live="polite" aria-atomic="true"><div v-if="toast" class="toast"><Check :size="17" /><span>{{ toast }}</span><button aria-label="Dismiss notification" @click="toast = ''"><X :size="15" /></button></div></div>
</template>
