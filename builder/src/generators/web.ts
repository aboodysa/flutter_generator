/**
 * WebScaffoldGenerator — structural, deterministic, 0% LLM (G5).
 * `index.ts` only ever emitted lib/+test/+pubspec — the web/ platform directory (index.html,
 * manifest.json, icons) was never part of generator output, so a full `rm -rf <outDir> &&
 * regenerate` (the normal clean-regen pattern) silently destroyed it, and every regen that needed
 * to be served on the web required a manual `flutter create . --platforms web` follow-up step
 * (documented as a workaround in AGENTS.md's G5 note — now obsolete). index.ts writes these when
 * `web/` doesn't already exist (see writeWebScaffold) — same-shaped text as `flutter create`
 * produces, but generated deterministically instead of shelling out to a Flutter-SDK-version-
 * dependent command. Icons/favicon are static Flutter template assets (identical across every
 * `flutter create`), shipped once as generator assets (builder/assets/web-template/) and copied,
 * not regenerated per app.
 */
export function generateWebIndexHtml(pkg: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <!--
    If you are serving your web app in a path other than the root, change the
    href value below to reflect the base path you are serving from.

    The path provided below has to start and end with a slash "/" in order for
    it to work correctly.

    For more details:
    * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base

    This is a placeholder for base href that will be replaced by the value of
    the \`--base-href\` argument provided to \`flutter build\`.
  -->
  <base href="$FLUTTER_BASE_HREF">

  <meta charset="UTF-8">
  <meta content="IE=Edge" http-equiv="X-UA-Compatible">
  <meta name="description" content="A new Flutter project.">

  <!-- iOS meta tags & icons -->
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="apple-mobile-web-app-title" content="${pkg}">
  <link rel="apple-touch-icon" href="icons/Icon-192.png">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="favicon.png"/>

  <title>${pkg}</title>
  <link rel="manifest" href="manifest.json">
</head>
<body>
  <!--
    You can customize the "flutter_bootstrap.js" script.
    This is useful to provide a custom configuration to the Flutter loader
    or to give the user feedback during the initialization process.

    For more details:
    * https://docs.flutter.dev/platform-integration/web/initialization
  -->
  <script src="flutter_bootstrap.js" async></script>
</body>
</html>
`;
}

export function generateWebManifest(pkg: string): string {
  return `{
    "name": "${pkg}",
    "short_name": "${pkg}",
    "start_url": ".",
    "display": "standalone",
    "background_color": "#0175C2",
    "theme_color": "#0175C2",
    "description": "A new Flutter project.",
    "orientation": "portrait-primary",
    "prefer_related_applications": false,
    "icons": [
        {
            "src": "icons/Icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "icons/Icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        },
        {
            "src": "icons/Icon-maskable-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
        },
        {
            "src": "icons/Icon-maskable-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
        }
    ]
}
`;
}
