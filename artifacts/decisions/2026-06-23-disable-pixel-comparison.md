# Decision: Disable Pixel Comparison As A Workflow Gate

Date: 2026-06-23

## Decision

Disable prototype-versus-Flutter pixel-by-pixel comparison in the default workflow.

Screenshot and golden generation remain useful visual evidence, but pixel drift is no longer treated as a pass/fail signal until the visual pipeline is mature enough.

## Reason

The latest visual comparisons show real generator maturity gaps:

- icon glyph and asset mapping is not fully stable
- RTL internal component slots still need shared-rule cleanup
- spacing and alignment extraction needs refinement
- prototype capture and Flutter golden capture are not yet guaranteed to represent identical visual regions

Pixel comparison at this stage creates noisy failures and can incentivize threshold weakening or baseline churn instead of fixing component mapping.

## Current Policy

- `npm run compare:payment` exits successfully and reports that comparison is disabled.
- `npm run compare:all` exits successfully and writes a disabled comparison report.
- `npm run compare:payment:strict` keeps the old payment pixel comparison available.
- `npm run compare:all:strict` keeps all-screen pixel comparison available.

## Re-Enable Criteria

Re-enable strict comparison only after:

- Arabic and icon fonts render consistently in goldens
- prototype capture and golden capture use the same 390x844 visual region
- status bar handling is deterministic
- RTL slot mapping is correct for shared components
- major component mapping gaps are fixed
- dimension guards pass before diffing

