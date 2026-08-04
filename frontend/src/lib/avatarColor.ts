const AVATAR_PALETTE = [
  { bg: '#eef0fe', color: '#5847eb' },
  { bg: '#eaf7ef', color: '#16a34a' },
  { bg: '#fdecec', color: '#dc2626' },
  { bg: '#fef4e8', color: '#d97706' },
  { bg: '#f0eafd', color: '#7c4dcb' },
  { bg: '#eaf3fd', color: '#2477c9' },
  { bg: '#fce8f3', color: '#c2418a' },
];

export function avatarStyle(seed: string) {
  const idx = seed.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}
