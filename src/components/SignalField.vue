<script setup>
import { ArrowUpRight } from 'lucide-vue-next'
defineEmits(['explore'])
</script>

<template>
  <div class="signal-field">
    <svg class="research-art" viewBox="0 0 420 270" fill="none" aria-hidden="true">
      <defs><pattern id="research-lines" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" stroke="currentColor" stroke-width=".45" /></pattern></defs>
      <rect x="64" y="14" width="298" height="232" fill="url(#research-lines)" class="art-grid" />
      <path d="M71 222L27 218L37 72L245 87L236 234Z" class="art-back-page" />
      <path d="M90 33H326V254H90Z" class="art-page" />
      <path d="M112 61H173M112 68H149M112 87H304" class="art-rule" />
      <text x="304" y="63" text-anchor="end" class="art-label">FIELD NOTES / 001</text>
      <path d="M112 169H304M112 139H304M112 109H304" class="art-grid-lines" />
      <path d="M112 169L130 157L148 163L166 145L184 151L202 128L220 138L239 111L257 119L280 97L302 106" class="art-trend-secondary" />
      <path d="M112 175L130 168L148 171L166 152L184 158L202 146L220 149L239 130L257 137L280 110L302 95" class="art-trend" />
      <rect x="296" y="89" width="12" height="12" class="art-focus" />
      <path d="M112 201H171M112 209H151M112 227H209M112 233H187M238 201H304M255 209H304" class="art-rule" />
      <path d="M348 135V200M339 145L348 135L357 145" class="art-arrow" />
      <text x="359" y="198" class="art-vertical-label" transform="rotate(-90 359 198)">YOUR POINT OF VIEW</text>
      <path d="M70 16H88M79 7V25M31 247H49M40 238V256" class="art-cross" />
      <rect x="306" y="21" width="35" height="17" class="art-tab" />
      <text x="324" y="33" text-anchor="middle" class="art-tab-label">01</text>
    </svg>
    <a class="research-art-link" href="#terminal" @click="$emit('explore')"><span>Five assets. A fresh point of view.</span><ArrowUpRight :size="16" /></a>
  </div>
</template>

<style scoped>
.signal-field { min-width:0; max-width:420px; width:100%; justify-self:end; }
.research-art { display:block; width:100%; height:auto; overflow:visible; }
.art-grid { color:var(--line); opacity:.9; }
.art-back-page { fill:var(--raised); stroke:var(--line-strong); stroke-width:.8; }
.art-page { fill:var(--surface); stroke:var(--ink); stroke-width:.9; }
.art-rule { stroke:var(--muted); stroke-width:1; }
.art-label { fill:var(--muted); font:7px var(--mono); letter-spacing:.8px; }
.art-grid-lines { stroke:var(--line); stroke-width:.7; }
.art-trend,.art-trend-secondary { stroke:var(--accent); stroke-width:2; stroke-linecap:square; stroke-linejoin:miter; }
.art-trend-secondary { stroke:var(--muted); stroke-width:1; stroke-dasharray:3 4; }
.art-focus,.art-tab { fill:var(--accent); }
.art-tab-label { fill:#fff; font:9px var(--mono); }
.art-arrow,.art-cross { stroke:var(--accent); stroke-width:1; }
.art-vertical-label { fill:var(--accent); font:7px var(--mono); letter-spacing:1.3px; }
.research-art-link { display:flex; align-items:center; justify-content:space-between; gap:12px; border-top:1px solid var(--line); min-height:44px; padding:9px 0; color:var(--muted); font-size:11px; }
.research-art-link:hover { color:var(--accent); }
@media (max-width:600px) { .signal-field { max-width:none; display:grid; grid-template-columns:1fr; }.research-art { max-height:200px; }.research-art-link { max-width:340px; width:100%; margin:auto; } }
@media (forced-colors:active) { .art-focus,.art-tab { fill:Highlight; }.art-trend { stroke:Highlight; }.art-tab-label { fill:HighlightText; } }
</style>