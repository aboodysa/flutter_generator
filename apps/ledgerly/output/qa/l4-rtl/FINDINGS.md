# L4 RTL CDP findings — ledgerly (v2, after generator fix)

Slice: L4 (l10n AR/EN + RTL). Method: new_chrome_ext CDP probe on the served web build.
Date: 2026-08-16. Status: one bug FIXED (G-L4-1), one new finding (G-L4-2).

## G-L4-1 — AR unreachable (FIXED)
- Symptom: app booted EN/LTR even with AR locale; AR `AppStrings._ar` was dead code.
- Root cause: `titleAndLocaleBlock()` emitted `locale: const Locale('en')` for `"both"`, which makes
  MaterialApp ignore the system/browser locale.
- **Fix (committed in generator)**: for `"both"`, no explicit `locale:` line — the app resolves
  from `PlatformDispatcher`/`navigator.language` via `supportedLocales`.
- **Verified via CDP**: with `navigator.language='ar-SA'` injected pre-load, the app title renders
  `التطبيق المُنشأ` (Arabic) — AppStrings `_ar` is active. Before the fix it stayed English.
  Required driver note: use `Page.addScriptToEvaluateOnNewDocument` to override
  `navigator.language`; `Emulation.setLocaleOverride` alone does NOT change what Flutter's web
  engine reads.

## G-L4-2 — login screen + Directionality not localized (OPEN, enhancement)
- Symptom: with AR active, the auth login screen still shows "Sign in", "Choose a demo account",
  persona names; the document `dir` stays `ltr`.
- Root cause: (a) the auth login screen (MF2's `generateAuthLoginScreen`) hardcodes English labels
  instead of routing through `AppStrings`; (b) Directionality flip is not forced — Flutter RTL
  comes from MaterialApp's resolved locale, but the `dir` attribute / glass-pane transform for RTL
  was not observed, suggesting the screen content isn't re-resolving text direction per-locale.
- **Enhancement needed (generator)**: route the login screen's visible strings through
  `AppStrings` (or the per-locale mechanism) and verify `Directionality.of(context)` is `rtl` under
  an AR locale (the RTL l10n_test covers home/list screens — extend it to the auth login screen).
  Severity: medium (L4's goal is Arabic-first; the login is the first screen a user sees).

## Verified OK
- AppStrings `_ar` chrome vocabulary (appTitle/loading/error/retry/save/create/back/edit/delete/
  noData/newLabel) resolves correctly under `navigator.language='ar-SA'`.
- No overflow, zero console/network errors at 390×844 and 320×568 in both EN and AR.
- EN baseline: login personas (Sara employee / Khalid manager / Rana finance) render with roles.

## Re-run (after G-L4-2 fix)
`python3 apps/tasks/output/qa/cdp_rtl_probe.py http://127.0.0.1:8099/ apps/ledgerly/output/qa/l4-rtl`
plus the navigator.language override above; expect `dir=rtl` + Arabic login labels.
