# Flip Clock Page Notes

Last updated: 2026-04-02 00:36:16 +10:00

## Purpose
- Hosts the standalone Flip Clock project under `/projects/flipclock/`.
- Includes timer controls, preset management, and timer settings.

## Key Files
- `flipClock.html`: main markup for the clock and preset modal.
- `flipClock.css`: all layout and visual styling.
- `flipClock.js`: timer logic, preset interactions, and settings behavior.
- `flipClock.json`: persisted preset/config data.

## Mobile Behavior (Small Screens)
- Preset timer frame now uses full-screen layout on mobile (`max-width: 767px`).
- Modal scrolling now uses the full overlay viewport so long preset/settings content stays reachable.
- Panel body no longer traps scroll on small screens; content can flow naturally with page scroll.
- In portrait mobile, preset frame is pinned to top-left edge with no top/left margin or gap.
- Fullscreen portrait behavior now applies for small screens up to tablet width (`max-width: 1023px`) to keep alignment consistent on mobile/tablet devices.
- Portrait/mobile table layout is tuned to avoid right-side clipping (responsive column widths, tighter action buttons, and horizontal fallback scroll only when needed).
- JS modal positioning now bypasses drag/desktop centering in portrait small screens, forcing panel position to top-left (`left: 0`, `top: 0`) to prevent inline inset offsets like `16px auto auto 16px`.

## Implementation Notes
- Mobile full-screen behavior is implemented in `flipClock.css` with a dedicated media query.
- The modal panel switches from fixed/capped layout to a full-viewport flow layout on small screens.
