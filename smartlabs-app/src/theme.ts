/**
 * Fresh mobile design system — deliberately distinct from the website. A deep
 * navy canvas with a teal/cyan accent and warm coral for scores/alerts.
 */
export const theme = {
  colors: {
    bg: '#0B1120',
    surface: '#131C2E',
    surfaceAlt: '#1B2740',
    border: '#26334F',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textFaint: '#64748B',
    accent: '#2DD4BF',
    accentDeep: '#14B8A6',
    accentSoft: 'rgba(45, 212, 191, 0.12)',
    coral: '#FB7185',
    amber: '#FBBF24',
    success: '#34D399',
    danger: '#F87171',
    onAccent: '#04211D',
  },
  radius: { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 },
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

/** Rotating accent hues so each task tile feels distinct (mirrors the web catalog). */
export const TASK_HUES: Record<string, string> = {
  orange: '#FB923C',
  violet: '#A78BFA',
  blue: '#60A5FA',
  emerald: '#34D399',
  rose: '#FB7185',
  amber: '#FBBF24',
  cyan: '#22D3EE',
  indigo: '#818CF8',
  teal: '#2DD4BF',
  fuchsia: '#E879F9',
  sky: '#38BDF8',
  lime: '#A3E635',
};

export function hueFor(color?: string): string {
  return (color && TASK_HUES[color]) || theme.colors.accent;
}
