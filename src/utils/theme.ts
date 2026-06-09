// src/utils/theme.ts
// E-Ink Paper Design System
// Inspired by physical paper, Kindle, reMarkable tablet aesthetics

export const COLORS = {
  // Paper whites — warm, never pure white
  paperWhite: '#F5F0E8',
  paperCream: '#EDE8DC',
  paperLight: '#E8E2D4',

  // Ink blacks — rich, never pure black
  inkBlack: '#1A1814',
  inkDark: '#2C2820',
  inkMid: '#3D3830',

  // Ghost grays — the soul of e-ink
  ghostLight: '#C8C2B4',
  ghostMid: '#A09890',
  ghostDark: '#706860',

  // Subtle accents — barely there
  accentWarm: '#8B6914',     // old gold — for priority/important
  accentAlert: '#6B2D2D',    // muted red — for urgent
  accentSoft: '#2D4A3E',     // forest — for completed/done

  // Borders
  borderLight: '#D4CEC0',
  borderMid: '#B8B0A0',
  borderDark: '#908880',

  // Overlays
  overlay: 'rgba(26, 24, 20, 0.6)',
  overlayLight: 'rgba(26, 24, 20, 0.15)',
};

export const TYPOGRAPHY = {
  // Primary — classical book typography
  serif: 'Georgia',           // Available on Android
  serifMono: 'Courier New',   // For time/numbers
  sansSerif: 'sans-serif',    // System fallback

  sizes: {
    micro: 10,
    tiny: 12,
    small: 14,
    body: 16,
    medium: 18,
    large: 22,
    xlarge: 28,
    display: 36,
    hero: 52,
    massive: 72,
  },

  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
    loose: 2.2,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BORDERS = {
  hairline: 0.5,
  thin: 1,
  normal: 1.5,
  thick: 2,
  heavy: 3,
  radius: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 8,
  },
};

export const SHADOWS = {
  // Subtle paper-lift shadows
  none: {},
  paper: {
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const ANIMATION = {
  // Deliberately slow — like e-ink refresh
  instant: 0,
  fast: 120,
  normal: 240,
  slow: 400,
  einkRefresh: 600,  // Authentic e-ink feel
};

// Screen time tracking colors
export const USAGE_COLORS = {
  excellent: COLORS.accentSoft,   // Under 1hr
  good: COLORS.ghostDark,         // 1-2hr
  moderate: COLORS.accentWarm,    // 2-3hr
  high: COLORS.accentAlert,       // 3hr+
};
