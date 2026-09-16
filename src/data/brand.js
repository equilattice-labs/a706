// Current presentation identity. Addresses are selected naming targets, not owned services.
export const brand = Object.freeze({
  name: 'Cernivue',
  slug: 'cernivue',
  tagline: 'A little context. A clearer perspective.',
  positioning: 'An independent market research desk.',
  domain: 'cernivue.xyz',
  handle: '@cernivue',
  website: 'https://cernivue.xyz',
  social: 'https://x.com/cernivue',
  channelsActive: false,
  mark: '/assets/cernivue-mark.svg',
})

export const storageKeys = Object.freeze({
  watchlist: 'cernivue-watchlist',
  memo: 'cernivue-memo-saved',
})

// Read-only compatibility with earlier browser data. Never displayed as product identity.
export const legacyStorageKeys = Object.freeze({
  watchlist: ['loometric-watchlist', 'siftider-watchlist', 'siftide-watchlist'],
  memo: ['loometric-memo-saved', 'siftider-memo-saved', 'siftide-memo-saved'],
})
