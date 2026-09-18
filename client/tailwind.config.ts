import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep charcoal / near-black — primary text, primary buttons, headings.
        ink: {
          50: '#F6F4F1',
          100: '#E9E4DC',
          200: '#CFC6B7',
          300: '#A99D87',
          400: '#7D7361',
          500: '#5C5245',
          600: '#453D31',
          700: '#332C23',
          800: '#241F19',
          900: '#1B1712',
          950: '#120F0B',
        },
        // Warm ivory / stone — page backgrounds and neutral surfaces.
        stone: {
          50: '#FBF8F3',
          100: '#F5EFE5',
          200: '#EAE1D0',
          300: '#DACBAE',
          400: '#C1AC87',
        },
        // Warm gray — borders and secondary text.
        warmgray: {
          200: '#E4DDCD',
          300: '#D2C7B0',
          400: '#B4A78D',
          500: '#93876E',
          600: '#746A55',
          700: '#5A5242',
        },
        // Burnt orange / terracotta — the single accent color.
        terracotta: {
          50: '#FCEEE4',
          100: '#F8DAC4',
          200: '#F0B98F',
          300: '#E4975F',
          400: '#D67A3F',
          500: '#C1602A',
          600: '#A24E22',
          700: '#7F3D1B',
        },
        // Muted sage — success / accepted states.
        sage: {
          50: '#EFF3E9',
          100: '#DEE8D1',
          200: '#C2D4AC',
          300: '#A3BE85',
          400: '#85A566',
          500: '#6B8A4E',
          600: '#55703E',
          700: '#435930',
        },
        // Muted brick — destructive / rejected states.
        rust: {
          50: '#F7E9E4',
          100: '#EDD0C4',
          300: '#C77C63',
          500: '#9C3B2E',
          600: '#7E2F25',
        },
        // Muted gold — pending / attention states.
        amber: {
          50: '#FBF1DF',
          100: '#F3DDAF',
          300: '#D9AB57',
          500: '#B8862E',
          600: '#93691F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(27, 23, 18, 0.05)',
        card: '0 1px 2px 0 rgba(27, 23, 18, 0.04), 0 1px 6px -2px rgba(27, 23, 18, 0.06)',
        raised: '0 8px 24px -6px rgba(27, 23, 18, 0.16)',
      },
    },
  },
  plugins: [],
} satisfies Config;
