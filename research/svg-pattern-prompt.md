You are a senior SVG illustrator and pattern designer. Design a seamless, tileable line-art background pattern for a London home bakery's website.

## Brand context
Kensal Bakes — cupcakes, filled cookies and celebration cakes, made to order in a home kitchen in Kensal Rise. The site looks like a vintage bake-shop poster: bark-brown fields (#6B554C), pale butter type (#F4EEC6), huge condensed uppercase headlines. This pattern sits behind the page as a faint wallpaper texture at 4.5% opacity. It is decoration, never the focus.

## What to draw
One 320×320 px square tile containing exactly 7 hand-drawn bakery motifs and 4–6 tiny accent marks.

Required motifs:
- a celebration layer cake
- a cookie
- a heart
- a wheat sprig

Choose the remaining 3 from:
- cupcake with swirl frosting
- strawberry
- piping bag
- whisk
- croissant
- ribbon bow
- jam jar
- coffee cup

Motif treatment:
- Simple, confident continuous-line drawings, like a pastry chef's notebook doodles — not clip-art, emoji, or icon-pack icons.
- Each motif must be immediately recognisable from its silhouette alone.
- At most 2–4 interior detail strokes per motif (for example two chocolate chips in the cookie, one swirl line on the frosting). No shading, hatching, cross-hatching, stippling, or dense detail.
- Outline and a few interior strokes only. No filled areas anywhere.
- Size each motif roughly 44–96 px across, with natural variation.
- Use smooth curves, not jagged polygon approximations. Circles must be actual circles.
- Vary rotation naturally between -15° and +15°, but keep cakes and cupcakes nearly upright (-6° to +6°).
- Add 4–6 tiny accents (dots, three-point sparkles, or short sprinkle dashes, 2–4 px) in the gaps between motifs.

## Composition and tiling
- Canvas and viewBox exactly: 0 0 320 320.
- The tile must repeat perfectly with no visible seams. Keep every stroke fully inside a 12 px safe zone (x 12–308, y 12–308). Nothing may touch or cross the tile edge. This is mandatory.
- Arrange motifs in a loose, hand-placed scatter, not a grid. No two motif centres closer than 80 px.
- Balance visual weight across all four quadrants and leave 2–3 breathing gaps.
- Avoid motifs lining up horizontally or vertically across repeats, and avoid an obvious diagonal repeat rhythm.
- Do not draw a border or frame around the tile.

## Technical constraints (strict)
- The SVG root must be exactly this shell, with only geometry added inside:
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" fill="none" stroke="#F4EEC6" stroke-opacity="0.045" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  ...
  </svg>
- Children may use only: <path d>, <circle>, <ellipse>, <rect rx>, <line>, <polyline>, <polygon>, and <g transform>. Do not put stroke, fill or opacity attributes on individual elements — the artwork must inherit everything from the root.
- No <style>, CSS classes, <text>, <image>, filters, gradients, masks, clip paths, patterns, external references, animations, or scripts.
- Do not use ids at all. If unavoidable, prefix every id with kb-.
- Single colour only. Use an even stroke weight with round caps and joins. No tapered or variable-width strokes.
- Valid standalone SVG, under 6 KB, with no comments.

## Quality test before answering
Mentally render the tile at 320 px, then at 4.5% opacity on #6B554C behind large cream type:
- At 4.5%, every motif should read as a soft, legible ghost — not a smudge or a dark blob.
- At 100%, the drawings should feel charming, confident and evenly spaced, with no cramped clusters and no large dead areas.
- The repeat must be invisible: no cut-off shapes at the seams.
- It must not look like a grid of icons or a sticker sheet.

## Output
1. If you can create an HTML artifact, build one self-contained preview page:
   - a full-width hero mock with background #6B554C, the pattern repeated at its real settings (background-size: 320px 320px), a huge cream headline reading "CAKES & COOKIES", a short line of body text, and two buttons — this is for judging the real effect;
   - below it, an inspection area showing the tile once at 100% opacity and once at 4.5% on the same brown.
   - No external fonts, images, scripts or libraries.
2. Always finish your reply with one fenced code block labelled svg containing ONLY the final raw SVG, no explanation, so it can be copied straight into a stylesheet.
3. After the SVG block, add one fenced code block labelled css with the ready-to-paste rule, in exactly this shape:
   .doodles { background-image: url("data:image/svg+xml;utf8,<svg ...>...</svg>"); background-size: 320px 320px; }
   Use single quotes for all attributes inside the SVG, encode # as %23, and keep the URL on one line.

Do not add any other code blocks. Do not explain the symbols. Do not add a title, caption or signature to the SVG.
