/**
 * Design tokens mirrored from tailwind.config.ts, for the rare cases that
 * need a raw value in JS/TS (inline SVG fills, canvas, etc.) instead of a
 * utility class. Tailwind config remains the source of truth — keep these
 * in sync with it.
 */
export const colors = {
  ink: {
    100: '#E9E4DC',
    300: '#A99D87',
    500: '#5C5245',
    700: '#332C23',
    900: '#1B1712',
  },
  stone: {
    50: '#FBF8F3',
    100: '#F5EFE5',
    200: '#EAE1D0',
  },
  warmgray: {
    200: '#E4DDCD',
    400: '#B4A78D',
    600: '#746A55',
  },
  terracotta: {
    50: '#FCEEE4',
    200: '#F0B98F',
    500: '#C1602A',
    600: '#A24E22',
  },
  sage: {
    100: '#DEE8D1',
    500: '#6B8A4E',
  },
  rust: {
    100: '#EDD0C4',
    500: '#9C3B2E',
  },
  amber: {
    100: '#F3DDAF',
    500: '#B8862E',
  },
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

export const fontFamily = {
  sans: "'Inter', system-ui, sans-serif",
  serif: "'Fraunces', Georgia, serif",
} as const;
