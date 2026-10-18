/** Seasonal-only compatibility for older pages with fixed light-theme colours.
 * Corrections use private attributes/variables, never rewrite original styles.
 */
export type Colour = [number, number, number, number];
const clamp = (value: number) => Math.min(255, Math.max(0, value));
export function parseColour(value: string): Colour | null {
  if (value === 'transparent') return [0, 0, 0, 0];
  if (/^#[\da-f]{6}$/i.test(value)) return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16), 1];
  if (!/^rgba?\(/.test(value)) return null;
  const values = value.match(/[\d.]+%?/g);
  if (!values || values.length < 3) return null;
  return [0, 1, 2].map(i => clamp(parseFloat(values[i]) * (values[i].endsWith('%') ? 2.55 : 1))).concat(values[3] ? parseFloat(values[3]) / (values[3].endsWith('%') ? 100 : 1) : 1) as Colour;
}
export function compositeColour(top: Colour, bottom: Colour): Colour {
  const alpha = top[3] + bottom[3] * (1 - top[3]);
  if (!alpha) return [0, 0, 0, 0];
  return [0, 1, 2].map(i => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / alpha).concat(alpha) as Colour;
}
export function colourContrast(a: Colour, b: Colour) {
  const luminance = (colour: Colour) => colour.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const first = luminance(compositeColour(a, b)), second = luminance(b);
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
}
export function readableColour(original: Colour, backgrounds: Colour[], minimum = 4.5): Colour | null {
  if (backgrounds.every(background => colourContrast(original, background) >= minimum)) return original;
  // Move toward black/white gradually, retaining category hues where possible.
  for (let amount = .1; amount <= 1.001; amount += .1) {
    const choices = [255, 0].map(target => original.slice(0, 3).map(channel => channel + (target - channel) * amount).concat(1) as Colour);
    const match = choices.find(colour => backgrounds.every(background => colourContrast(colour, background) >= minimum));
    if (match) return match;
  }
  return null;
}
export function isLightNeutral(colour: Colour) {
  const channels = colour.slice(0, 3);
  return colour[3] >= .35 && Math.min(...channels) >= 210 && Math.max(...channels) - Math.min(...channels) <= 30;
}
const cssColour = (colour: Colour) => `rgb(${colour.slice(0, 3).map(v => Math.round(clamp(v))).join(', ')})`;

export function installSeasonalContrast(root: HTMLElement, eligible: (element: HTMLElement) => boolean = () => true) {
  const marked = new Set<HTMLElement>();
  const surfaces = new Set<HTMLElement>();
  let frame = 0, settleTimer = 0, stopped = false;
  const restore = () => {
    marked.forEach(element => {
      element.removeAttribute('data-seasonal-contrast');
      element.removeAttribute('data-seasonal-text-backplate');
      element.style.removeProperty('--seasonal-readable-color');
    });
    marked.clear();
    surfaces.forEach(element => element.removeAttribute('data-seasonal-surface'));
    surfaces.clear();
  };
  const scan = () => {
    frame = 0;
    if (stopped || document.hidden) return;
    restore();
    const elements = [root, ...root.querySelectorAll<HTMLElement>('*')].filter(element => eligible(element)
      && !element.closest('script,style,noscript,svg,img,video,canvas,iframe,.sr-only,.seasonal-snow,.seasonal-flight,.seasonal-hero-atmosphere') && element.getClientRects().length);
    // Convert legacy paper surfaces before measuring their text. Saturated
    // action/status colours are deliberately excluded from this conversion.
    const surfaceCandidates = elements.filter(element => {
      const computed = getComputedStyle(element);
      const colour = parseColour(computed.backgroundColor);
      const stops = (computed.backgroundImage.match(/rgba?\([^)]+\)/g) ?? []).map(parseColour).filter((value): value is Colour => !!value);
      return (colour && isLightNeutral(colour)) || (stops.length > 0 && !computed.backgroundClip.includes('text') && computed.webkitBackgroundClip !== 'text' && stops.every(isLightNeutral));
    });
    surfaceCandidates.forEach(element => { element.setAttribute('data-seasonal-surface', 'true'); surfaces.add(element); });
    const styles = new WeakMap<HTMLElement, CSSStyleDeclaration>();
    const backgrounds = new WeakMap<HTMLElement, Colour[]>();
    const style = (element: HTMLElement) => {
      let result = styles.get(element);
      if (!result) { result = getComputedStyle(element); styles.set(element, result); }
      return result;
    };
    const canvas = parseColour(style(root).backgroundColor) ?? [22, 15, 36, 1];
    const samples = (element: HTMLElement | null): Colour[] => {
      if (!element) return [compositeColour(canvas, [22, 15, 36, 1])];
      const cached = backgrounds.get(element);
      if (cached) return cached;
      const computed = style(element);
      const parent = samples(element.parentElement);
      const base = parseColour(computed.backgroundColor) ?? [0, 0, 0, 0];
      let result = parent.map(background => compositeColour(base, background));
      const textClip = computed.backgroundClip.includes('text') || computed.webkitBackgroundClip === 'text';
      if (!textClip && computed.backgroundImage.includes('gradient(')) {
        const stops = (computed.backgroundImage.match(/rgba?\([^)]+\)/g) ?? []).map(parseColour).filter((colour): colour is Colour => !!colour).slice(0, 4);
        if (stops.length) result = stops.flatMap(stop => result.map(background => compositeColour(stop, background))).slice(0, 8);
      }
      backgrounds.set(element, result);
      return result;
    };
    const corrections: { element: HTMLElement; colour: Colour; backplate: boolean }[] = [];
    for (const element of elements) {
      const hasText = [...element.childNodes].some(node => node.nodeType === 3 && node.textContent?.trim());
      const isControl = element.matches('input:not([type=checkbox]):not([type=radio]):not([type=hidden]),textarea,select,option');
      if (!hasText && !isControl) continue;
      const computed = style(element);
      const textClip = computed.backgroundClip.includes('text') || computed.webkitBackgroundClip === 'text';
      let original = parseColour(computed.color);
      if (!original) continue;
      const background = samples(element);
      if (textClip) {
        const stops = (computed.backgroundImage.match(/rgba?\([^)]+\)/g) ?? []).map(parseColour).filter((colour): colour is Colour => !!colour);
        if (stops.length && stops.every(stop => background.every(b => colourContrast(stop, b) >= 4.5))) continue;
        original = parseColour(getComputedStyle(root).getPropertyValue('--seasonal-text').trim()) ?? [255, 246, 232, 1];
      } else if (original[3] === 0) continue;
      const colour = readableColour(original, background);
      if (!colour) corrections.push({ element, colour: [255, 246, 232, 1], backplate: true });
      else if (textClip || colour.some((value, i) => Math.abs(value - original![i]) > .01)) corrections.push({ element, colour, backplate: false });
    }
    // Write only after measuring, so corrected ancestors cannot change a child's baseline.
    corrections.forEach(({ element, colour, backplate }) => {
      element.style.setProperty('--seasonal-readable-color', cssColour(colour));
      element.setAttribute('data-seasonal-contrast', 'true');
      if (backplate) element.setAttribute('data-seasonal-text-backplate', 'true');
      marked.add(element);
    });
  };
  const schedule = () => { if (!frame && !stopped) frame = requestAnimationFrame(scan); };
  const interaction = (event: Event) => {
    if (event.type === 'pointerover' && (!(event.target instanceof Element) || !event.target.closest('a,button,input,select,textarea,[role=button],[role=menuitem],[data-state]'))) return;
    schedule();
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(schedule, 350);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-state', 'open', 'aria-expanded'] });
  root.addEventListener('pointerover', interaction, { passive: true });
  root.addEventListener('focusin', interaction);
  window.addEventListener('resize', interaction);
  document.addEventListener('visibilitychange', schedule);
  scan();
  return () => {
    stopped = true; observer.disconnect(); cancelAnimationFrame(frame); clearTimeout(settleTimer);
    root.removeEventListener('pointerover', interaction); root.removeEventListener('focusin', interaction);
    window.removeEventListener('resize', interaction); document.removeEventListener('visibilitychange', schedule);
    restore();
  };
}
