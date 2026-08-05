export interface DescribeImageItem {
  id: string;
  title: string;
  /** Inline SVG shown to the student (self-contained — no external hosting). */
  svg: string;
  /** The key facts a good description should cover (sent to the AI as the content reference). */
  describe: string;
}

const bar = (title: string, bars: { label: string; v: number; color: string }[]) => {
  const max = Math.max(...bars.map(b => b.v));
  const bw = 60, gap = 28, h = 180, base = 210;
  const width = bars.length * (bw + gap) + gap;
  const rects = bars.map((b, i) => {
    const x = gap + i * (bw + gap);
    const bh = Math.round((b.v / max) * h);
    return `<rect x="${x}" y="${base - bh}" width="${bw}" height="${bh}" rx="4" fill="${b.color}"/>
      <text x="${x + bw / 2}" y="${base - bh - 8}" font-size="13" text-anchor="middle" fill="#334155">${b.v}</text>
      <text x="${x + bw / 2}" y="${base + 18}" font-size="12" text-anchor="middle" fill="#64748b">${b.label}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} 250" xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width:${width}px">
    <text x="${width / 2}" y="22" font-size="15" font-weight="700" text-anchor="middle" fill="#0f172a">${title}</text>
    <line x1="${gap}" y1="${base}" x2="${width - gap / 2}" y2="${base}" stroke="#cbd5e1"/>${rects}</svg>`;
};

export const pteDescribeImageData: DescribeImageItem[] = [
  {
    id: 'di1',
    title: 'Coffee vs Tea Consumption',
    svg: bar('Cups per person per week', [
      { label: 'Coffee', v: 12, color: '#3b82f6' },
      { label: 'Tea', v: 9, color: '#22c55e' },
      { label: 'Water', v: 21, color: '#06b6d4' },
      { label: 'Juice', v: 5, color: '#f59e0b' },
    ]),
    describe: 'A bar chart of average drinks consumed per person per week: Water is highest at 21 cups, followed by Coffee at 12, Tea at 9, and Juice lowest at 5. Water is more than four times the amount of juice.',
  },
  {
    id: 'di2',
    title: 'Renewable Energy by Source',
    svg: bar('Share of renewable generation (%)', [
      { label: 'Solar', v: 34, color: '#f59e0b' },
      { label: 'Wind', v: 41, color: '#3b82f6' },
      { label: 'Hydro', v: 18, color: '#06b6d4' },
      { label: 'Other', v: 7, color: '#a855f7' },
    ]),
    describe: 'A bar chart showing the share of renewable electricity generation by source. Wind leads at 41%, then Solar at 34%, Hydro at 18%, and Other sources make up the smallest share at 7%. Wind and solar together account for three-quarters of the total.',
  },
  {
    id: 'di3',
    title: 'Monthly Website Visitors',
    svg: bar('Visitors (thousands)', [
      { label: 'Q1', v: 20, color: '#6366f1' },
      { label: 'Q2', v: 35, color: '#6366f1' },
      { label: 'Q3', v: 48, color: '#6366f1' },
      { label: 'Q4', v: 72, color: '#6366f1' },
    ]),
    describe: 'A bar chart of website visitors by quarter, in thousands. The trend rises steadily throughout the year: 20k in Q1, 35k in Q2, 48k in Q3, and peaking at 72k in Q4 — more than tripling from the first to the last quarter.',
  },
];
