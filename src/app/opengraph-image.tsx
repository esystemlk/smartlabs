import { ImageResponse } from 'next/og';

// 1200x630 share card (link previews used the square logo before).
export const alt = 'Smart Labs — PTE Academic classes and AI practice in Sri Lanka';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '80px', color: 'white',
          background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #7c3aed 100%)',
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.85, letterSpacing: 4 }}>SMART LABS</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
          PTE Academic classes &amp; AI-scored practice
        </div>
        <div style={{ fontSize: 34, marginTop: 32, opacity: 0.9 }}>
          Online and in Nugegoda, Sri Lanka · 7,100+ learners trained
        </div>
        <div style={{ fontSize: 30, marginTop: 'auto', opacity: 0.8 }}>smartlabs.lk</div>
      </div>
    ),
    size,
  );
}
