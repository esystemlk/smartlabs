# Halloween generated assets

Created 18 October 2026 with the built-in image generation tool, using six separate requests including the expanded character collection. No reference photos were used. New characters used the original ghost illustration as a style reference. The mobile crop and delivery formats were optimised locally from the generated masters.

## Hero prompt

Use case: stylized-concept. Create one premium Halloween website hero background for Smart Labs English-learning website. Wide landscape 16:9 composition, enchanted moonlit learning laboratory, rounded storybook 3D illustration, stacks of study books, friendly glowing pumpkins, arched window and lavender moonlight. Midnight plum and warm orange palette. Left 55 percent calm dark negative space for real HTML headline; visual interest concentrated on right and lower edge. Tasteful welcoming family friendly Halloween, sophisticated detail. No text, letters, logo, watermark, gore, or foreground character. This is a website production background.

Files: `public/seasonal/halloween/hero.webp`, `public/seasonal/halloween/hero-mobile.webp`. Original: `docs/seasonal-asset-sources/hero.png`.

## Transparent character prompt

Use case stylized-concept. Production website cutout: one friendly rounded storybook 3D ghost scholar holding an open book, beside a small glowing smiling pumpkin and stack of study books, complete silhouette, generous margins, isolated on genuinely transparent background. Plum and lavender shadows, warm orange light. Premium welcoming Halloween education illustration. No scenery, no floor, no text or watermark. Full character visible including book and pumpkin.

Generated with transparent background enabled. File: `public/seasonal/halloween/ghost.webp`. Original: `docs/seasonal-asset-sources/ghost.png`. The delivered WebP has a verified alpha channel, dimensions 640 × 585.

## Footer prompt

Use case stylized-concept. Wide low website footer Halloween illustration for friendly premium English learning brand Smart Labs. Rounded storybook 3D pumpkins, closed study books, tiny lavender stars concentrated along bottom edge. Midnight plum background, warm orange glow, moonlight, upper two thirds mostly empty calm dark plum so real HTML footer links remain readable. Extra wide landscape composition. No text, logo, watermark, gore or frightening faces.

File: `public/seasonal/halloween/footer.webp`. Original: `docs/seasonal-asset-sources/footer.png`.

## Inspection

The desktop hero, character and footer were visually inspected. The hero was checked in a desktop browser layout, and the mobile crop was checked at a 390-pixel viewport. In the mobile visual fixture the document width was 375 pixels plus the browser scrollbar, with no horizontal overflow. The default popup reuses the hero background beneath a dark overlay and the transparent character; its image is independently configurable.

## Expanded character collection

Three new transparent characters were generated individually with the built-in tool. The existing `public/seasonal/halloween/ghost.webp` was supplied as a style reference only. The original ghost and default selection remain available.

Each request used this prompt template, substituting the subject listed below:

> Use case: stylized-concept. Production Halloween website character cutout for Smart Labs English learning. Reference image is STYLE REFERENCE ONLY: match its premium rounded 3D storybook rendering, friendly proportions, plum/lavender shadows, warm orange light and welcoming education mood. Generate a NEW character: {subject} Isolated complete silhouette centered with generous transparent margin. Genuinely transparent background, no floor, no scenery, no shadow backdrop, no text, no letters, no logo, no watermark, no gore. Make this a distinct companion to the ghost scholar, not another ghost.

| Character | Subject substituted into the prompt | Delivery asset | Size |
|---|---|---|---:|
| Wizard owl | One friendly little owl scholar wearing a soft plum wizard hat, holding a closed study book, with rounded complete wings and feet. | `public/seasonal/halloween/wizard-owl.webp` | 55,512 bytes |
| Witch kitten | One friendly black kitten with large warm amber eyes, a small purple witch hat and lavender scarf, sitting beside one closed study book and a tiny glowing pumpkin. | `public/seasonal/halloween/witch-cat.webp` | 67,340 bytes |
| Book bat | One friendly small lavender bat with fully visible spread wings, large kind eyes, a tiny plum academic cap, holding a little closed study book with its feet. | `public/seasonal/halloween/book-bat.webp` | 46,790 bytes |

All three delivered images are 640 × 585, have verified alpha channels, and were visually inspected for matching style and complete silhouettes. Original PNG masters are in `docs/seasonal-asset-sources/` using the corresponding base filenames. The bat illustration holds its book against its body; it remains a suitable readable silhouette at small sizes.

The shared catalogue in `src/lib/seasonal-theme/config.ts` drives both the admin character picker and the server's bundled-media allowlist. The picker is available under Hero & footer, Popup, and Assets. Selecting a character edits only the draft and reuses existing placement, visibility, animation, preview and publication controls.
