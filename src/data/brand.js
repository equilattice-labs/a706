// Current presentation identity. Addresses are selected naming targets, not owned services.
export const brand = Object.freeze({
  name: 'Clariweft',
  slug: 'clariweft',
  tagline: 'Less noise. More perspective.',
  positioning: 'An independent market signal atlas.',
  domain: 'clariweft.xyz',
  handle: '@clariweft',
  website: 'https://clariweft.xyz',
  social: 'https://x.com/clariweft',
  channelsActive: false,
  mark: '/assets/clariweft-mark.svg',
})

export const storageKeys = Object.freeze({
  watchlist: 'clariweft-watchlist',
  memo: 'clariweft-memo-saved',
})

// Read-only compatibility with earlier browser data. Never displayed as product identity.
export const legacyStorageKeys = Object.freeze({
  watchlist: ['cernivue-watchlist', 'loometric-watchlist', 'siftider-watchlist', 'siftide-watchlist'],
  memo: ['cernivue-memo-saved', 'loometric-memo-saved', 'siftider-memo-saved', 'siftide-memo-saved'],
})
