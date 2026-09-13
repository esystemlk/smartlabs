/**
 * Matches the main website's colour theme (smartlabs.lk).
 *
 * The site's design tokens (src/app/globals.css) define a light theme with a
 * blue primary and a rose / emerald / violet / amber accent set:
 *   --background 240 10% 99%   --foreground 240 10% 3.9%
 *   --primary    217 91% 60%   (blue #3B82F6)
 *   --muted      210 40% 96.1% --muted-foreground 240 3.8% 46.1%
 *   --border     214 32% 91%   --destructive 0 84% 60%
 *   --accent-1 rose  --accent-2 emerald  --accent-3 violet  --accent-4 amber
 *   --radius 1rem
 * The hex values below are those HSL tokens converted to RGB.
 */
export const theme = {
  colors: {
    bg: '#FAFBFC', // --background 240 10% 99%
    surface: '#FFFFFF', // --card 0 0% 100%
    surfaceAlt: '#F1F5F9', // --muted / --secondary 210 40% 96.1%
    border: '#E2E8F0', // --border 214 32% 91%
    text: '#0A0A0B', // --foreground 240 10% 3.9%
    textMuted: '#71717A', // --muted-foreground 240 3.8% 46.1%
    textFaint: '#A1A1AA',
    accent: '#3B82F6', // --primary 217 91% 60%
    accentDeep: '#2563EB',
    accentSoft: 'rgba(59, 130, 246, 0.12)',
    coral: '#F43F6D', // --accent-1 rose 347 89% 68%
    amber: '#F59E0B', // --accent-4 amber 38 92% 60%
    success: '#10B981', // --accent-2 emerald 159 70% 55%
    danger: '#EF4444', // --destructive 0 84% 60%
    onAccent: '#FFFFFF', // --primary-foreground
  },
  radius: { sm: 10, md: 14, lg: 16, xl: 22, pill: 999 }, // --radius 1rem
  spacing: (n: number) => n * 4,
  font: {
    h1: 30,
    h2: 22,
    h3: 18,
    body: 15,
    small: 13,
    tiny: 11,
  },
} as const;

/**
 * Per-task accent hues — the website cycles task colours through this palette.
 * Tuned to the 500/600 level so they stay legible on the light background.
 */
export const TASK_HUES: Record<string, string> = {
  orange: '#EA580C',
  violet: '#7C3AED',
  blue: '#2563EB',
  emerald: '#059669',
  rose: '#E11D48',
  amber: '#D97706',
  cyan: '#0891B2',
  indigo: '#4F46E5',
  teal: '#0D9488',
  fuchsia: '#C026D3',
  sky: '#0284C7',
  lime: '#65A30D',
};

export function hueFor(color?: string): string {
  return (color && TASK_HUES[color]) || theme.colors.accent;
}

/**
 * Design-system palette for the SmartLabs mobile UI (matches the app mockups).
 * A single source of truth so every screen shares the same blues, greys and
 * gradients. `C` is intentionally flat and verbose for readability in screens.
 */
export const C = {
  // Brand blues
  blue: '#2563EB',
  blueDeep: '#1D4ED8',
  blueDark: '#1E3A8A',
  sky: '#38BDF8',
  cyan: '#22B0E6',

  // Surfaces
  white: '#FFFFFF',
  bg: '#F4F7FB',
  card: '#FFFFFF',
  tintBlue: '#EAF1FD',
  tintBlueSoft: '#F1F6FE',
  track: '#E4EBF5',
  border: '#EDF1F7',
  borderStrong: '#E2E8F0',

  // Text
  navy: '#0F1E3D',
  ink: '#12203C',
  slate: '#556482',
  slateLight: '#8A97AC',
  faint: '#AEB8C9',

  // Skill accents (Speaking / Reading / Writing / Listening)
  speaking: '#2563EB',
  speakingBg: '#E7F0FE',
  reading: '#16A34A',
  readingBg: '#E4F7EB',
  writing: '#F59E0B',
  writingBg: '#FEF3DA',
  listening: '#7C3AED',
  listeningBg: '#EFE8FE',

  // Status
  success: '#16A34A',
  successBg: '#E4F7EB',
  amber: '#F59E0B',
  danger: '#EF4444',
  dangerBg: '#FEECEC',
} as const;

/** Gradient stop sets used with expo-linear-gradient across the brand UI. */
export const GRADIENTS = {
  brand: ['#2563EB', '#1D4ED8', '#1E3A8A'] as const,
  splash: ['#0E2A6B', '#122E74', '#0A1C4A'] as const,
  button: ['#2C7BF2', '#2563EB'] as const,
  sky: ['#EAF2FE', '#F5F9FF'] as const,
};
