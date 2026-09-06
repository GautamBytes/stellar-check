# Navigation and hero motion

The user requested an icon-only theme switch, a stronger navbar and playful hero motion appropriate to Stellar payment checks. The header now uses a contained glass surface, a compact brand mark, grouped navigation with current-section feedback, a sun/moon control and primary checker action. Mobile retains icon controls and a collapsible navigation menu.

The hero adds illustrated XLM and issued-asset tokens, compact readiness-related labels and a moving packet along a sample readiness path. These are decorative HTML/SVG elements, not simulated transactions. Movement uses transforms and opacity. The hero has a pause/resume control; all ambient animation pauses offscreen, and reduced-motion CSS disables it. The checker remains immediately usable.

Implementation is isolated in demo/navigation-hero.css and demo/motion.ts. The existing theme initializer retains its accessible toggle state and tooltip without visible text. The existing theme regression test was adjusted to reflect the icon-only control.

Verification: npm run check passed (typecheck, 98 tests, library and demo builds). Chrome desktop review covered both themes, running and paused animation states, offscreen suspension and section navigation. At a 390px mobile viewport, there was no horizontal overflow; menu navigation, the theme toggle and a missing-trustline report worked together. Reduced-motion handling was reviewed in CSS.
