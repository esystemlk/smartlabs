# Accessibility Suite V6.5 - Setup Guide (Pro Porting)

This document provides everything you need to implement the **Smart Labs Accessibility Suite** on any other React/Next.js website.

## 📦 1. Installation
Install the required animation and icon libraries:
```bash
npm install lucide-react framer-motion clsx tailwind-merge
```

---

## 📄 2. Component Logic (`accessibility-widget.tsx`)
Create a new file at `src/components/accessibility-widget.tsx` and paste the following code. This file handles the UI, state, and the advanced engines (Auto-Scroll, Dynamic Magnifier, etc).

```tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Accessibility, X, Eye, Type, MousePointer, 
  ZoomIn, ZoomOut, MoveVertical, 
  Sun, Moon, Contrast, Palette, 
  WrapText, Image as ImageIcon, PauseCircle,
  RotateCcw, Ruler, Speaker, Droplet,
  Maximize, Search, Underline,
  LayoutTemplate, Mic, BoxSelect, ShieldAlert,
  PinOff, PlayCircle, MousePointerClick, Info, Lightbulb,
  BookOpen, ListFilter, EyeOff, Keyboard,
  Settings2, Activity, Sparkles, MessageSquare,
  Torus, MousePointer2, Languages, CaseSensitive,
  MoreHorizontal, Ghost
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

// PASTE THE ENTIRE COMPONENT CODE HERE (Refer to the official source file)
// Note: Ensure your 'Button', 'cn', and 'useToast' paths match your new project structure.
```

*(Refer to the full `accessibility-widget.tsx` file for the 500+ lines of logic)*

---

## 🎨 3. Universal Styles (`globals.css`)
Add these CSS classes to your global stylesheet. These are the visual "engines" that the Javascript toggles on and off.

```css
/* Accessibility Support Classes */
.access-highlight-links a {
  text-decoration: underline !important;
  background-color: #fca311 !important;
  color: #000000 !important;
  font-weight: 800 !important;
  padding: 2px 4px !important;
  border-radius: 4px !important;
}

.access-highlight-headings h1, .access-highlight-headings h2, .access-highlight-headings h3 {
  background-color: #00f3ff !important;
  color: #000000 !important;
  border-left: 6px solid #0000ff !important;
  padding-left: 12px !important;
}

/* Dynamic Cursor Logic */
.access-cursor-big-black, .access-cursor-big-black * {
  cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='black' stroke='white' stroke-width='2'><path d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'/></svg>") 0 0, auto !important;
}

/* Master Themes */
.theme-solarized { background-color: #fdf6e3 !important; color: #657b83 !important; }
.theme-solarized p, .theme-solarized span { color: #586e75 !important; }

.theme-matrix { background-color: #000b00 !important; color: #00ff41 !important; }
.theme-matrix * { color: #00ff41 !important; text-shadow: 0 0 5px rgba(0, 255, 65, 0.5) !important; }

/* Epilepsy & Performance */
.access-epilepsy-safe *, .access-epilepsy-safe *::before, .access-epilepsy-safe *::after {
  animation: none !important;
  transition: none !important;
  background-image: none !important;
}
```

---

## 🛠️ 4. Activation
Go to your `layout.tsx` (the wrapper of your entire website) and import the component so it appears on every page:

```tsx
import { AccessibilityWidget } from '@/components/accessibility-widget';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AccessibilityWidget /> {/* Always at the end */}
      </body>
    </html>
  );
}
```

---

## 🌟 5. Features Included
*   🔍 **AI Magnifier**: Dynamic 1.6x zoom that follows mouse/touch.
*   📜 **Auto-Scroller**: Hands-free reading with adjustable speed.
*   🔊 **Point & Read**: Hover over text to hear it narrated automatically.
*   🕶️ **Irlen Overlays**: Color tinctures for reading clarity.
*   🌈 **Matrix/Solar Themes**: Ultra high contrast profiles.
*   🛠️ **Emergency Reset**: Escape key instantly cancels all active tools.

**Powered and Hosted by [Esystemlk](https://www.esystemlk.xyz)**
