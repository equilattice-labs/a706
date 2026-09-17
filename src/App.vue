<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronDown, Compass, ExternalLink, Layers, Menu, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Wallet, X } from 'lucide-vue-next'
import UiDialog from './components/UiDialog.vue'
import MarketChart from './components/MarketChart.vue'
import SignalField from './components/SignalField.vue'
import MarketComparison from './components/MarketComparison.vue'
import { brand, storageKeys, legacyStorageKeys } from './data/brand.js'
import { markets, money } from './data/markets.js'
import { useWallet } from './composables/useWallet.js'
import { arcChain } from './data/network.js'

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
function exploreMarket(market) { resetFilters(); navigate('terminal'); selectMarket(market, true) }
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
const chainLabel = computed(() => !address.value ? 'Wallet not connected' : chainId.value === arcChain.wallet.chainId ? arcChain.displayName : 'Another network')
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
  <div class="workspace">
    <header class="topbar">
      <div class="header-inner">
        <a class="brand" href="#top" :aria-label="brand.name + ' home'" @click="navigate('top')"><img :src="brand.mark" alt="" width="32" height="32" /><span>{{ brand.name }}</span></a>
        <span class="masthead-caption">THE INDEPENDENT RESEARCH DESK</span>
        <div class="topbar-actions">
          <button class="demo-indicator" @click="dialog = 'demo'"><span class="status-dot"></span> Research preview</button>
          <button class="wallet-button" @click="openWallet"><Wallet :size="16" /><span>{{ address ? shortAddress : 'Connect wallet' }}</span></button>
          <button class="icon-button mobile-menu-toggle" :aria-label="menuOpen ? 'Close navigation' : 'Open navigation'" :aria-expanded="menuOpen" aria-controls="mobile-navigation" @click="menuOpen = !menuOpen"><component :is="menuOpen ? X : Menu" :size="22" /></button>
        </div>
      </div>
      <nav v-if="menuOpen" id="mobile-navigation" class="mobile-navigation" aria-label="Mobile navigation">
        <a href="#top" @click="navigate('top')">Overview <Compass :size="18" /></a>
        <a href="#terminal" @click="navigate('terminal')">Discover markets <Layers :size="18" /></a>
        <a href="#terminal" @click="navigate('terminal', true)">Watchlist ({{ saved.length }}) <Star :size="18" /></a>
        <a href="#thesis" @click="navigate('thesis')">Our approach <BookOpen :size="18" /></a>
        <a href="#roadmap" @click="navigate('roadmap')">Roadmap <ArrowRight :size="18" /></a>
        <button @click="menuOpen = false; clearError(); dialog = 'network'">Network settings <Layers :size="18" /></button>
        <button @click="menuOpen = false; dialog = 'demo'">About this preview <Compass :size="18" /></button>
      </nav>
    </header>

    <aside class="side-rail" aria-label="Workspace contents">
      <div class="rail-top"><span class="eyebrow">YOUR WORKSPACE</span><span class="rail-edition">A little context.<br />A considered decision.</span></div>
      <nav class="desktop-navigation" aria-label="Primary navigation">
        <a href="#top" :class="{ active: activeSection === 'top' && !watchlistOnly }" :aria-current="activeSection === 'top' && !watchlistOnly ? 'location' : undefined" @click="navigate('top')"><Compass :size="17" /><span>Overview</span><small>01</small></a>
        <a href="#terminal" :class="{ active: activeSection === 'terminal' && !watchlistOnly }" :aria-current="activeSection === 'terminal' && !watchlistOnly ? 'location' : undefined" @click="navigate('terminal')"><Layers :size="17" /><span>Asset desk</span><small>02</small></a>
        <a href="#terminal" :class="{ active: watchlistOnly }" :aria-current="watchlistOnly ? 'location' : undefined" @click="navigate('terminal', true)"><Star :size="17" /><span>Watchlist</span><span class="nav-count">{{ saved.length }}</span></a>
        <a href="#thesis" :class="{ active: activeSection === 'thesis' && !watchlistOnly }" :aria-current="activeSection === 'thesis' && !watchlistOnly ? 'location' : undefined" @click="navigate('thesis')"><BookOpen :size="17" /><span>Research note</span><small>03</small></a>
        <a href="#roadmap" :class="{ active: activeSection === 'roadmap' && !watchlistOnly }" :aria-current="activeSection === 'roadmap' && !watchlistOnly ? 'location' : undefined" @click="navigate('roadmap')"><ArrowUpRight :size="17" /><span>Roadmap</span><small>04</small></a>
      </nav>
      <button class="rail-search" @click="focusSearch"><Search :size="16" /><span>Find an asset</span><kbd>⌘ / Ctrl K</kbd></button>
      <div class="rail-bottom"><span class="rail-square" aria-hidden="true"></span><p>Made for your<br />own point of view.</p><button @click="dialog = 'demo'">About this preview <ArrowUpRight :size="14" /></button></div>
    </aside>

    <main>
      <section id="top" class="overview content-pad">
        <div class="edition-line"><span>MARKETS, WITH CONTEXT.</span><span>RESEARCH EDITION / 001</span></div>
        <div class="hero-grid">
          <div class="hero-copy">
            <h1>A little context.<br /><span>A clearer perspective.</span></h1>
            <p>A place to study the market, connect the details, and form a view of your own.</p>
            <div class="hero-actions"><a class="primary-button" href="#terminal" @click="navigate('terminal')">Explore the markets <ArrowRight :size="18" /></a><button class="quiet-link" @click="focusComparison">Compare assets <ArrowUpRight :size="17" /></button></div>
            <div class="hero-caption"><ShieldCheck :size="14" /> Open to explore. No wallet required.</div>
          </div>
          <SignalField @explore="navigate('terminal')" />
        </div>
        <div class="snapshot-strip"><div class="snapshot-label"><span class="eyebrow">THE SHORTLIST</span><button @click="dialog = 'demo'">Sample data <ArrowUpRight :size="12" /></button></div><div class="spotlight-grid">
          <a v-for="(market, index) in featuredMarkets" :key="market.symbol" href="#terminal" class="spotlight-card" :aria-label="'Explore ' + market.symbol + ' market'" @click="exploreMarket(market)">
            <span class="spotlight-number">0{{ index + 1 }}</span><div class="spotlight-identity"><strong>{{ market.symbol }}</strong><small>{{ market.name }}</small></div><div class="spotlight-quote"><strong>{{ money(market.price) }}</strong><span :class="market.change >= 0 ? 'positive' : 'negative'">{{ market.change > 0 ? '+' : '' }}{{ market.change.toFixed(2) }}%</span></div><ArrowUpRight :size="16" />
          </a>
        </div></div>
      </section>

      <section id="terminal" class="market-section content-pad">
<<<<<<< HEAD
        <div class="section-title-row"><div><div class="eyebrow">02 / THE ASSET DESK</div><h2>{{ watchlistOnly ? 'Your watchlist' : 'Follow your next idea.' }}<span class="count-tag">{{ watchlistOnly ? saved.length : markets.length }}</span></h2></div><button class="network-link" @click="clearError(); dialog = 'network'"><Layers :size="15" /> Robinhood Chain <ChevronDown :size="14" /></button></div>
=======
        <div class="section-title-row"><div><div class="eyebrow">YOUR RESEARCH WORKSPACE</div><h2>{{ watchlistOnly ? 'Your watchlist' : 'Discover the market' }}<span class="count-tag">{{ watchlistOnly ? saved.length : markets.length }}</span></h2></div><button class="network-link" @click="clearError(); dialog = 'network'"><Layers :size="15" /> {{ arcChain.displayName }} <ChevronDown :size="14" /></button></div>
        <div class="workspace-guide"><span><b>01</b> Find an asset</span><ArrowRight :size="13" /><span><b>02</b> Compare the context</span><ArrowRight :size="13" /><span><b>03</b> Explore an amount</span><small>Sample data · USD</small></div>
>>>>>>> 60ed9e5472be2db3746a804977acf85fd927c611
        <div class="terminal-layout">
          <div class="market-board">
            <div class="board-title"><h3>Asset index</h3><span>SELECT TO RESEARCH <ArrowDownRight :size="14" /></span></div>
            <div class="market-toolbar">
              <label class="search-field"><Search :size="18" /><input v-model="search" type="search" placeholder="Search name or symbol" aria-label="Search assets" autocomplete="off" /><kbd class="search-hint">Ctrl K</kbd></label>
              <button class="watchlist-toggle" aria-label="Watchlist" :class="{ active: watchlistOnly }" :aria-pressed="watchlistOnly" @click="watchlistOnly = !watchlistOnly"><Star :size="17" :fill="watchlistOnly ? 'currentColor' : 'none'" /><span>Saved</span></button>
            </div>
            <div v-if="search || activeTab !== 'All assets'" class="applied-filters"><span>{{ filteredMarkets.length }} results<span v-if="search"> for “{{ search.trim() }}”</span><span v-if="activeTab !== 'All assets'"> in {{ activeTab }}</span></span><button @click="search = ''; activeTab = 'All assets'">Clear filters <X :size="14" /></button></div>
            <div class="filter-row"><div class="market-tabs" role="group" aria-label="Asset category"><button v-for="tab in tabs" :key="tab" :aria-pressed="activeTab === tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab }}</button></div><label class="sort-control"><SlidersHorizontal :size="14" /><select v-model="sort" aria-label="Sort markets"><option value="signal">Signal score</option><option value="change">24h change</option><option value="name">Name A–Z</option></select></label></div>
            <div class="table-heading" aria-hidden="true"><span>ASSET</span><span>PRICE / 24H</span><span>7D TREND</span><span>SIGNAL</span><span></span></div>
            <ul v-if="filteredMarkets.length" class="market-list" aria-label="Markets">
              <li v-for="market in filteredMarkets" :key="market.symbol" class="market-row" :class="{ selected: selected.symbol === market.symbol }">
                <button class="market-select" :aria-label="'View ' + market.symbol + ' details'" :aria-pressed="selected.symbol === market.symbol" @click="selectMarket(market, true)">
                  <span class="asset-identity"><span class="asset-icon" :class="market.tone">{{ market.monogram }}</span><span><strong>{{ market.symbol }}</strong><small>{{ market.name }}</small></span></span>
                  <span class="market-price"><strong>{{ money(market.price) }}</strong><small :class="market.change >= 0 ? 'positive' : 'negative'"><component :is="market.change >= 0 ? ArrowUpRight : ArrowDownRight" :size="12" />{{ market.change > 0 ? '+' : '' }}{{ market.change.toFixed(2) }}%</small></span>
                  <span class="sparkline"><MarketChart :market="market" mini /></span><span class="score-pill" :class="{ 'score-neutral': market.score < 75 }">{{ market.score }}</span>
                </button>
                <button class="save-asset" :aria-label="(saved.includes(market.symbol) ? 'Remove ' : 'Save ') + market.symbol + (saved.includes(market.symbol) ? ' from' : ' to') + ' watchlist'" :aria-pressed="saved.includes(market.symbol)" @click="toggleSaved(market)"><Star :size="17" :fill="saved.includes(market.symbol) ? 'currentColor' : 'none'" /></button>
              </li>
            </ul>
            <div v-else class="empty-state" role="status"><component :is="watchlistOnly ? Star : Search" :size="30" /><h3>{{ watchlistOnly && !saved.length ? 'Make room for your next idea.' : 'No matching markets.' }}</h3><p>{{ watchlistOnly && !saved.length ? 'Save an asset with the star to keep it in view. Your watchlist stays on this device.' : 'Try another name or symbol, or reset your filters.' }}</p><button class="secondary-button" @click="resetFilters">{{ watchlistOnly && !saved.length ? 'Explore all assets' : 'Clear filters' }} <ArrowRight :size="17" /></button></div>
            <div class="board-footer"><span aria-live="polite">{{ filteredMarkets.length }} of {{ markets.length }} assets <span>·</span> Sample data</span><button @click="dialog = 'method'">How scoring works <ArrowUpRight :size="14" /></button></div>
            <p v-if="!storageAvailable" class="storage-note" role="status">Browser storage is unavailable. Your watchlist is kept for this session only.</p>
            <div class="market-context"><span class="context-icon"><BookOpen :size="23" /></span><div><span class="eyebrow">A NOTE FROM THE DESK</span><h3>A score is a starting point.</h3><p>Look at the pattern. Read the context. Leave room for your own judgment.</p><a href="#thesis" @click="navigate('thesis')" aria-label="Read our approach">Read our approach <ArrowUpRight :size="15" /></a></div></div>
          </div>

          <aside id="asset-spotlight" class="detail-panel" aria-label="Selected market details">
            <a class="back-to-markets" href="#terminal"><ArrowRight :size="15" /> Back to assets</a>
            <div class="detail-topline"><span><span class="status-dot"></span> RESEARCH SHEET / {{ String(markets.findIndex(market => market.symbol === selected.symbol) + 1).padStart(2, '0') }}</span><button class="icon-button" :aria-label="(isSaved ? 'Remove' : 'Save') + ' selected asset ' + (isSaved ? 'from' : 'to') + ' watchlist'" :aria-pressed="isSaved" @click="toggleSaved(selected)"><Star :size="17" :fill="isSaved ? 'currentColor' : 'none'" /></button></div>
            <div class="detail-asset"><span class="asset-icon" :class="selected.tone">{{ selected.monogram }}</span><div><h3 id="selected-asset-title" tabindex="-1">{{ selected.symbol }}</h3><span>{{ selected.name }}</span></div><span class="category-label">{{ selected.category === 'Stocks' ? 'EQUITY' : selected.category === 'ETFs' ? 'ETF' : 'CRYPTO' }}</span></div>
            <div class="detail-price"><strong>{{ money(selected.price) }}</strong><span :class="selected.change >= 0 ? 'positive' : 'negative'"><component :is="selected.change >= 0 ? ArrowUpRight : ArrowDownRight" :size="16" />{{ selected.change > 0 ? '+' : '' }}{{ selected.change.toFixed(2) }}% <small>24h</small></span></div>
            <MarketComparison :market="selected" :markets="markets" />
            <div class="detail-metrics"><span><small>Signal score <button aria-label="About signal scoring" @click="dialog = 'method'">i</button></small><strong>{{ selected.score }}<em>/ 100</em></strong></span><span><small>Sample 24h volume</small><strong>{{ selected.volume }}</strong></span><span><small>Source</small><strong class="sample-source">Demo dataset</strong></span></div>
            <form class="preview-form" @submit.prevent="preview">
              <div class="preview-step"><span>THE AMOUNT STUDY</span><span>PREVIEW ONLY</span></div>
              <div class="amount-label"><label for="spend">Explore an amount</label><span>USDG</span></div>
              <div class="amount-field" :class="{ invalid: amountError }"><span>$</span><input id="spend" v-model="amount" type="text" inputmode="decimal" autocomplete="off" aria-describedby="amount-help" :aria-invalid="Boolean(amountError)" /><span class="currency-label">USDG</span></div>
              <div class="amount-presets" role="group" aria-label="Quick amounts"><button v-for="preset in [100, 1000, 10000]" :key="preset" type="button" :aria-pressed="amountValue === preset" @click="amount = String(preset)">{{ money(preset).replace('.00', '') }}</button></div>
              <p id="amount-help" class="amount-help" :class="{ 'input-error': amountError }">{{ amountError || 'Illustrative estimate, before fees and slippage.' }}</p>
              <div class="receive-row" aria-live="polite"><span>Estimated quantity</span><strong>{{ estimate }} <small>{{ selected.symbol }}</small></strong></div>
              <button class="primary-button full-width" type="submit" :disabled="Boolean(amountError)">Review preview <ArrowRight :size="18" /></button><p class="preview-footnote"><ShieldCheck :size="14" /> No transaction. No wallet needed.</p>
            </form>
          </aside>
        </div>
      </section>

      <section id="thesis" class="approach-section content-pad">
        <div class="approach-heading"><div><div class="eyebrow">03 / A RESEARCH NOTE</div><h2>Good questions.<br /><span>Better perspective.</span></h2><p>Our working principles at {{ brand.name }}.</p></div><button class="save-memo" :aria-pressed="memoSaved" @click="saveMemo"><component :is="memoSaved ? CheckCheck : BookOpen" :size="17" />{{ memoSaved ? 'Note saved' : 'Save this note' }}</button></div>
        <div class="approach-grid">
          <article><span class="approach-number">01</span><div><h3>Start with a question.</h3><p>Follow the assets that interest you. Our planned signal layer brings together public conversation, source quality and recency.</p></div></article>
          <article><span class="approach-number">02</span><div><h3>Read across the market.</h3><p>Put two assets side by side. Current scores and charts are examples; live verification is planned.</p></div></article>
          <article><span class="approach-number">03</span><div><h3>Make up your own mind.</h3><p>Keep a watchlist and explore an amount. An illustrative preview gives you space to consider. Your assets stay in your wallet.</p></div></article>
        </div>
      </section>

      <section id="roadmap" class="roadmap-section content-pad">
<<<<<<< HEAD
        <div class="roadmap-intro"><div><div class="eyebrow">04 / WORK IN PROGRESS</div><h2>The next chapters.</h2></div><a class="quiet-link" href="https://docs.robinhood.com/chain/" target="_blank" rel="noreferrer">Built around Robinhood Chain <ExternalLink :size="15" /></a></div>
=======
        <div class="roadmap-intro"><div><div class="eyebrow">WHERE WE'RE HEADING</div><h2>A more connected future.</h2></div><a class="quiet-link" :href="arcChain.docsUrl" target="_blank" rel="noreferrer">Built around {{ arcChain.displayName }} <ExternalLink :size="15" /></a></div>
>>>>>>> 60ed9e5472be2db3746a804977acf85fd927c611
        <ol class="roadmap-list"><li class="current"><span class="roadmap-stage"><span class="roadmap-node"><Check :size="14" /></span> AVAILABLE TO EXPLORE</span><h3>The research workspace</h3><p>Market discovery, comparison, local watchlists and illustrative previews.</p></li><li><span class="roadmap-stage"><span class="roadmap-node">02</span> PLANNED</span><h3>Connected market intelligence</h3><p>Live sources, liquidity checks and wallet-native routing.</p></li><li><span class="roadmap-stage"><span class="roadmap-node">03</span> PLANNED</span><h3>Shared perspectives</h3><p>Attributable research, curated collections and tools for builders.</p></li></ol>
      </section>

      <footer class="site-footer content-pad">
        <div class="footer-top"><a href="#top" class="brand" @click="navigate('top')"><img :src="brand.mark" alt="" width="30" height="30" /><span>{{ brand.name }}</span></a><span>{{ brand.tagline }}</span><button @click="dialog = 'demo'">About this preview <ArrowUpRight :size="15" /></button></div>
        <div class="footer-bottom"><span>© 2026 {{ brand.name }}</span><p>Illustrative data. Not financial advice. RWA access depends on eligibility and jurisdiction.</p><a :href="arcChain.wallet.blockExplorerUrls[0]" target="_blank" rel="noreferrer">Block explorer <ExternalLink :size="13" /></a></div>
      </footer>
    </main>
  </div>
  <UiDialog :open="dialog === 'order'" title="Review your market preview." @close="dialog = ''"><div class="dialog-kicker"><Sparkles :size="16" /> ILLUSTRATIVE ORDER PREVIEW</div><p class="dialog-intro">Review the numbers for {{ selected.name }}. This is a sample calculation, not an executable quote.</p><dl class="preview-summary"><div><dt>Asset</dt><dd>{{ selected.symbol }}</dd></div><div><dt>You spend</dt><dd>{{ money(amountValue) }} USDG</dd></div><div><dt>Sample reference price</dt><dd>{{ money(selected.price) }}</dd></div><div class="summary-highlight"><dt>Illustrative receive</dt><dd>{{ estimate }} {{ selected.symbol }}</dd></div><div><dt>Fees & slippage</dt><dd>Not included</dd></div><div><dt>Wallet</dt><dd>{{ address ? shortAddress : 'Not connected' }}</dd></div></dl><div class="dialog-notice"><ShieldCheck :size="19" /><p>No transaction has been signed or sent. Live quotes and execution are not available in this preview.</p></div><div class="dialog-actions"><button class="secondary-button" @click="dialog = ''">Back to explore</button><button class="primary-button" @click="exportPreview">Save preview <ArrowDown :size="16" /></button></div></UiDialog>
<<<<<<< HEAD
  <UiDialog :open="dialog === 'wallet'" :title="address ? 'Your connected wallet.' : 'Connect your wallet.'" @close="dialog = ''"><div class="dialog-kicker"><Wallet :size="16" /> YOUR KEYS. YOUR CONTROL.</div><p class="dialog-intro">Connect an installed EVM wallet. You can explore markets and calculate sample previews without connecting.</p><div v-if="address" class="connected-wallet"><span class="status-dot"></span><span><strong>{{ shortAddress }}</strong><small>{{ chainLabel }}</small></span><Check :size="20" /><code>{{ address }}</code></div><div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div><div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div><button v-if="!address" class="primary-button full-width" :disabled="pending" @click="connect">{{ pending ? 'Check your wallet…' : 'Connect browser wallet' }} <Wallet :size="17" /></button><template v-else><button class="primary-button full-width" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Check your wallet…' : 'Add Robinhood Chain' }} <Plus :size="17" /></button><button class="disconnect-button" @click="disconnect(); notify('Wallet disconnected from this workspace')">Disconnect this session</button></template><a v-if="!address" class="wallet-help" href="https://ethereum.org/en/wallets/find-wallet/" target="_blank" rel="noreferrer">Need a wallet? Explore EVM wallets <ExternalLink :size="14" /></a><p class="dialog-footnote">Connecting requests account access only. {{ brand.name }} does not request a signature or send a transaction.</p></UiDialog>
  <UiDialog :open="dialog === 'network'" title="Your network connection." @close="dialog = ''"><div class="dialog-kicker"><Layers :size="16" /> ROBINHOOD CHAIN</div><p class="dialog-intro">{{ brand.name }} is designed around the Robinhood Chain ecosystem. Add the network to your installed wallet when you're ready.</p><dl class="preview-summary"><div><dt>Network</dt><dd>Robinhood Chain</dd></div><div><dt>Chain ID</dt><dd>4663</dd></div><div><dt>Gas asset</dt><dd>ETH</dd></div><div><dt>Wallet status</dt><dd>{{ chainLabel }}</dd></div></dl><div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div><div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div><button class="primary-button full-width" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Check your wallet…' : 'Add network to wallet' }} <Plus :size="17" /></button><a class="wallet-help" href="https://docs.robinhood.com/chain/connecting" target="_blank" rel="noreferrer">Read network documentation <ExternalLink :size="14" /></a></UiDialog>
  <UiDialog :open="dialog === 'demo'" title="Inside the research desk." @close="dialog = ''"><div class="dialog-kicker"><Compass :size="16" /> {{ brand.name.toUpperCase() }} RESEARCH PREVIEW</div><p class="dialog-intro">Get a feel for a more considered market experience. All prices, changes, charts, volumes and signal scores are static examples, not live market information.</p><ul class="dialog-list"><li><Check :size="17" /><span>Search and compare five sample assets.</span></li><li><Check :size="17" /><span>Keep a watchlist and save research notes on this device.</span></li><li><Check :size="17" /><span>Calculate and download illustrative order previews.</span></li><li><Check :size="17" /><span>Connect an EVM wallet without signing a transaction.</span></li></ul><div class="dialog-notice"><BookOpen :size="19" /><p>Live signals, executable quotes and community collections are planned. No live data feed or trading service is connected.</p></div><button class="primary-button full-width" @click="dialog = ''">Got it. Let's explore <ArrowRight :size="17" /></button></UiDialog>
=======
  <UiDialog :open="dialog === 'wallet'" :title="address ? 'Your connected wallet.' : 'Connect your wallet.'" @close="dialog = ''"><div class="dialog-kicker"><Wallet :size="16" /> YOUR KEYS. YOUR CONTROL.</div><p class="dialog-intro">Connect an installed EVM wallet. You can explore markets and calculate sample previews without connecting.</p><div v-if="address" class="connected-wallet"><span class="status-dot"></span><span><strong>{{ shortAddress }}</strong><small>{{ chainLabel }}</small></span><Check :size="20" /><code>{{ address }}</code></div><div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div><div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div><button v-if="!address" class="primary-button full-width" :disabled="pending" @click="connect">{{ pending ? 'Check your wallet…' : 'Connect browser wallet' }} <Wallet :size="17" /></button><template v-else><button class="primary-button full-width" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Check your wallet…' : `Add ${arcChain.displayName}` }} <Plus :size="17" /></button><button class="disconnect-button" @click="disconnect(); notify('Wallet disconnected from this workspace')">Disconnect this session</button></template><a v-if="!address" class="wallet-help" href="https://ethereum.org/en/wallets/find-wallet/" target="_blank" rel="noreferrer">Need a wallet? Explore EVM wallets <ExternalLink :size="14" /></a><p class="dialog-footnote">Connecting requests account access only. {{ brand.name }} does not request a signature or send a transaction.</p></UiDialog>
  <UiDialog :open="dialog === 'network'" title="Your network connection." @close="dialog = ''"><div class="dialog-kicker"><Layers :size="16" /> {{ arcChain.displayName.toUpperCase() }}</div><p class="dialog-intro">{{ brand.name }} is designed around the {{ arcChain.displayName }} ecosystem. Add the network to your installed wallet when you're ready.</p><dl class="preview-summary"><div><dt>Network</dt><dd>{{ arcChain.displayName }}</dd></div><div><dt>Chain ID</dt><dd>{{ arcChain.id }}</dd></div><div><dt>Gas asset</dt><dd>{{ arcChain.wallet.nativeCurrency.symbol }}</dd></div><div><dt>Wallet status</dt><dd>{{ chainLabel }}</dd></div></dl><div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div><div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div><button class="primary-button full-width" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Check your wallet…' : 'Add network to wallet' }} <Plus :size="17" /></button><a class="wallet-help" :href="arcChain.connectionDocsUrl" target="_blank" rel="noreferrer">Read network documentation <ExternalLink :size="14" /></a></UiDialog>
  <UiDialog :open="dialog === 'demo'" title="Inside the observatory." @close="dialog = ''"><div class="dialog-kicker"><Compass :size="16" /> {{ brand.name.toUpperCase() }} RESEARCH PREVIEW</div><p class="dialog-intro">Get a feel for a more considered market experience. All prices, changes, charts, volumes and signal scores are static examples, not live market information.</p><ul class="dialog-list"><li><Check :size="17" /><span>Search and compare five sample assets.</span></li><li><Check :size="17" /><span>Keep a watchlist and save research notes on this device.</span></li><li><Check :size="17" /><span>Calculate and download illustrative order previews.</span></li><li><Check :size="17" /><span>Connect an EVM wallet without signing a transaction.</span></li></ul><div class="dialog-notice"><BookOpen :size="19" /><p>Live signals, executable quotes and community collections are planned. No live data feed or trading service is connected.</p></div><button class="primary-button full-width" @click="dialog = ''">Got it. Let's explore <ArrowRight :size="17" /></button></UiDialog>
>>>>>>> 60ed9e5472be2db3746a804977acf85fd927c611
  <UiDialog :open="dialog === 'method'" title="How signal scores work." @close="dialog = ''"><div class="dialog-kicker"><Sparkles :size="16" /> CONTEXT, NOT A RECOMMENDATION</div><p class="dialog-intro">Our planned signal score brings together conversation velocity, source quality, recency and market context on a 0–100 scale.</p><div class="method-score"><strong>{{ selected.score }}<span>/100</span></strong><p>{{ selected.symbol }} · illustrative score</p></div><p class="dialog-intro">Scores in this workspace are fixed examples. They are not calculated from live sources, a prediction of future performance or a recommendation to buy.</p><button class="primary-button full-width" @click="dialog = ''">Back to the market <ArrowRight :size="17" /></button></UiDialog>
  <div class="toast-region" role="status" aria-live="polite" aria-atomic="true"><div v-if="toast" class="toast"><Check :size="17" /><span>{{ toast }}</span><button v-if="undoAction" class="undo-button" @click="undoAction()">Undo</button><button aria-label="Dismiss notification" @click="toast = ''"><X :size="15" /></button></div></div>
</template>
