import DOMPurify from 'isomorphic-dompurify';

// Sanitize any HTML before rendering it with dangerouslySetInnerHTML.
// Blocks scripts, event handlers and other XSS vectors while keeping the
// formatting these features rely on (text styling, links, images, tables…).
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },      // standard HTML tags only (no SVG/MathML scripting)
    ADD_ATTR: ['target'],              // keep link targets
    FORBID_TAGS: ['style'],            // no injected <style> blocks
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  });
}
