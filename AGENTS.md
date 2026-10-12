<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history - force pushing, or rebasing/amending/squashing commits
> that are already pushed - as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Strict Production Design and Content Standards

Under no circumstances should the project look like an AI "vibe product". The following rules are absolute:

1. **Colors & Gradients**: Never use purple, violet, or fuchsia gradients or color palettes. Use a clean enterprise B2B palette (Navy/Slate, Cobalt/Primary Blue, Emerald, and neutral dark/light surfaces).
2. **Button Geometry**: Never use pill-shaped buttons or badges (`rounded-full`, `rounded-3xl`, `rounded-2xl`). All interactive buttons and cards must adhere to standard enterprise geometric corners (`rounded-md` or `rounded-lg`).
3. **High-Integrity Copy**:
   - No fake reviews, testimonials, ratings, or fake metrics.
   - No fake customer counters (e.g. "Trusted by 10,000+ teams").
   - No vague hero texts or AI hype copy ("Revolutionize with AI"). State exact technical functionality clearly (timetables, GIS routes, crew shifts, constraint optimization).
4. **Punctuation & Typography**:
   - Never use em dashes (`—`) anywhere in copy, titles, or code comments. Use colons or standard hyphens instead.
   - Never use emoji icons in UI elements or headers. Use Lucide SVG icons.
5. **Media & Assets**:
   - Never use AI-slop stock photos, surreal illustrations, or fake avatars. Use authentic UI previews, OpenStreetMap map tiles, or technical schematics.
   - Favicon must remain present and configured (`/favicon.svg`, `/favicon.ico`).
6. **Interaction**:
   - No custom cursor animations or over-the-top scroll animations.
7. **Launch Prerequisites**:
   - Maintain custom domain readiness.
   - Maintain favicon in `<head>`.
   - Never include any "Made with AI" or watermark badges.
   - Keep dedicated, high-integrity `/privacy` and `/terms` pages accessible in the footer and router.
8. **Precision**: Make no mistakes. Always verify TypeScript compliance and run builds to ensure zero regressions.
9. **Git Remote**: Default remote `origin` is set to `https://github.com/arul-vhs/transitOS.git`. All commits and pushes must target `origin`.

