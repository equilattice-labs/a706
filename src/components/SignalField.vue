<script setup>
import { ArrowUpRight } from 'lucide-vue-next'

defineEmits(['explore'])

const ticks = Array.from({ length: 48 }, (_, index) => {
  const angle = index * Math.PI / 24
  const inner = index % 4 === 0 ? 85 : 90
  return { x1: Math.sin(angle) * inner, y1: -Math.cos(angle) * inner, x2: Math.sin(angle) * 95, y2: -Math.cos(angle) * 95 }
})
</script>

<template>
  <div class="signal-field">
    <svg class="observatory-art" viewBox="0 0 480 258" fill="none" aria-hidden="true">
      <g class="instrument-grid">
        <path d="M24 56H456M24 128H456M24 200H456M72 43V222M144 43V222M216 43V222M288 43V222M360 43V222M432 43V222"/>
      </g>
      <g class="instrument-type instrument-title">
        <text x="23" y="26">MARKET OBSERVATORY</text>
        <text x="457" y="26" text-anchor="end">01 / 05</text>
      </g>
      <g class="instrument-corners">
        <path d="M24 66V56H34M446 56H456V66M24 190V200H34M446 200H456V190"/>
      </g>
      <g transform="translate(263 130)">
        <g class="instrument-ticks"><line v-for="(tick, index) in ticks" :key="index" v-bind="tick"/></g>
        <circle class="instrument-ring" r="79"/>
        <circle class="instrument-orbit" r="65"/>
        <path class="instrument-axis" d="M-108 0H108M0 -108V108"/>
        <g class="instrument-scale instrument-type">
          <text x="0" y="-101" text-anchor="middle">000</text>
          <text x="103" y="3">090</text>
          <text x="0" y="110" text-anchor="middle">180</text>
          <text x="-105" y="3" text-anchor="end">270</text>
        </g>
        <ellipse class="instrument-meridian" rx="36" ry="78" transform="rotate(37)"/>
        <ellipse class="instrument-equator" rx="104" ry="26" transform="rotate(-25)"/>
        <path class="instrument-shell" d="M-40 35L-14 -47L48 -20L31 45Z"/>
        <path class="instrument-facet" d="M-40 35L14 8L-14 -47M14 8L48 -20M14 8L31 45"/>
        <path class="instrument-focus-ray" d="M14 8L77 -53L153 -53"/>
        <circle class="instrument-focus-halo" cx="14" cy="8" r="11"/>
        <circle class="instrument-focus" cx="14" cy="8" r="4"/>
        <circle class="instrument-node" cx="77" cy="-53" r="3.5"/>
        <circle class="instrument-node-muted" cx="-62" cy="49" r="3"/>
      </g>
      <g class="instrument-type instrument-note">
        <text x="367" y="69">PERSPECTIVE</text>
        <text x="24" y="241">CONNECT THE CONTEXT</text>
        <text x="456" y="241" text-anchor="end">STUDY / EXPLORE</text>
      </g>
      <path class="instrument-annotation" d="M55 100H115L163 131"/>
      <g class="instrument-type instrument-side"><text x="54" y="89">OPEN</text><text x="54" y="122">MARKETS</text></g>
    </svg>
    <a class="observatory-link" href="#terminal" @click="$emit('explore')">
      <span class="observatory-link-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      <span>Five sample markets. <strong>One clear view.</strong></span>
      <ArrowUpRight :size="19" aria-hidden="true"/>
    </a>
  </div>
</template>

<style scoped>
.signal-field { width: 100%; min-width: 0; overflow: hidden; border: 1px solid #2a3943; border-radius: 12px; color: #edf2ed; background: #141e27; font-family: 'Segoe UI', Arial, sans-serif; }
.observatory-art { display: block; width: 100%; height: auto; }
.instrument-grid { stroke: #24333d; stroke-width: .65; }
.instrument-corners { stroke: #52656f; stroke-width: .8; }
.instrument-type { font-family: 'Segoe UI', Arial, sans-serif; fill: #a0b0bc; font-size: 8px; letter-spacing: 1.5px; }
.instrument-title { fill: #edf2ed; font-size: 8.4px; letter-spacing: 1.6px; }
.instrument-note { font-size: 7.5px; letter-spacing: 1.2px; }
.instrument-side { fill: #a0b0bc; font-size: 8px; letter-spacing: 2px; }
.instrument-ticks { stroke: #6b838a; stroke-width: .8; }
.instrument-ring { stroke: #7ed9cb; stroke-width: .8; }
.instrument-orbit { stroke: #3b5661; stroke-width: .8; stroke-dasharray: 2 5; }
.instrument-axis { stroke: #425660; stroke-width: .7; stroke-dasharray: 2 4; }
.instrument-scale { font-size: 6px; letter-spacing: 1px; }
.instrument-meridian { stroke: #507b7c; stroke-width: .8; }
.instrument-equator { stroke: #7ed9cb; stroke-width: 1.1; }
.instrument-shell { fill: #1a2731; fill-opacity: .88; stroke: #a8d5c7; stroke-width: 1.1; stroke-linejoin: round; }
.instrument-facet { stroke: #7ed9cb; stroke-width: .9; }
.instrument-focus-ray { stroke: #d9f879; stroke-width: 1.15; }
.instrument-focus-halo { fill: #d9f879; fill-opacity: .08; stroke: #d9f879; stroke-opacity: .45; stroke-width: .7; }
.instrument-focus { fill: #d9f879; }
.instrument-node { fill: #141e27; stroke: #d9f879; stroke-width: 1.2; }
.instrument-node-muted { fill: #7ed9cb; }
.instrument-annotation { stroke: #627984; stroke-width: .7; }
.observatory-link { display: flex; align-items: center; gap: 12px; box-sizing: border-box; min-height: 58px; padding: 13px 20px; border-top: 1px solid #2a3943; background: #1a2731; color: #a0b0bc; text-decoration: none; font-size: 12px; line-height: 1.5; transition: background .16s ease; }
.observatory-link strong { font-weight: 500; color: #edf2ed; }
.observatory-link > svg { margin-left: auto; flex-shrink: 0; color: #d9f879; }
.observatory-link-mark { display: flex; align-items: center; gap: 3px; flex-shrink: 0; width: 21px; height: 22px; }
.observatory-link-mark span { display: block; height: 10px; width: 3px; background: #7ed9cb; }
.observatory-link-mark span:nth-child(2) { height: 19px; background: #d9f879; }
.observatory-link-mark span:nth-child(3) { height: 14px; }
.observatory-link:hover { background: #22333e; }
.observatory-link:focus-visible { outline: 2px solid #d9f879; outline-offset: -4px; }
@media (max-width: 600px) {
  .observatory-art { max-height: 248px; }
  .observatory-link { min-height: 58px; gap: 10px; padding-inline: 15px; font-size: 11px; }
}
@media (prefers-reduced-motion: reduce) {
  .observatory-link { transition: none; }
}
</style>
