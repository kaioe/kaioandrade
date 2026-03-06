# UI Icons (lucide-animated)

All icons in this folder are from [lucide-animated](https://github.com/pqoqubbw/icons) — animated React icons built with Motion and Lucide.

## Source

- **Registry:** [lucide-animated.com](https://lucide-animated.com/)
- **Repo:** [pqoqubbw/icons](https://github.com/pqoqubbw/icons)
- **License:** MIT

## Conventions

- Each icon is a React component with `size?`, `className`, and standard div props.
- Icons expose `startAnimation` and `stopAnimation` via ref (optional).
- Hover triggers the animation by default unless the ref is used for controlled mode.
- Use `motion/react` for animations; import `cn` from `@/lib/utils`.

## Icons in use

| Icon | File | Used in |
|------|------|--------|
| Earth | `earth.tsx` | Home (client cards) |
| Cpu | `cpu.tsx` | Home (client cards) |
| BotMessageSquare | `bot-message-square.tsx` | Home (AI/automation section) |
| Sun | `sun.tsx` | CinematicThemeSwitcher |
| Moon | `moon.tsx` | CinematicThemeSwitcher |
| Layers | `layers.tsx` | MorphingCardStack (layout + demo) |
| Blocks | `blocks.tsx` | MorphingCardStack (layout + demo) |
| AlignVertical | `align-vertical.tsx` | MorphingCardStack (layout) |
| Clock | `clock.tsx` | MorphingCardStack demo |
| Sparkles | `sparkles.tsx` | MorphingCardStack demo |
| Contrast | `contrast.tsx` | MorphingCardStack demo (Gradient Mesh) |
| X | `x.tsx` | ProspectingClientPopup |
| Grip | `grip.tsx` | ProspectingClientPopup |

Other icons in this folder (cog, menu, delete, link, connect, panel-*, fingerprint, washing-machine, coffee, etc.) follow the same pattern and are available for use.

---

*Last updated: 2026-03-06*
