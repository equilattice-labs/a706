// Current presentation identity. Addresses are selected naming targets, not owned services.
export const brand = Object.freeze({
  name: 'Loometric',
  slug: 'loometric',
  tagline: 'Find clarity in the connected market.',
  positioning: 'An independent market observatory.',
  domain: 'loometric.xyz',
  handle: '@loometric',
  website: 'https://loometric.xyz',
  social: 'https://x.com/loometric',
  channelsActive: false,
  mark: '/assets/loometric-mark.svg',
})

export const storageKeys = Object.freeze({
  watchlist: 'loometric-watchlist',
  memo: 'loometric-memo-saved',
})

// Read-only compatibility with earlier browser data. Never displayed as product identity.
export const legacyStorageKeys = Object.freeze({
  watchlist: ['siftider-watchlist', 'siftide-watchlist'],
  memo: ['siftider-memo-saved', 'siftide-memo-saved'],
})
