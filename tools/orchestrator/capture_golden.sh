#!/usr/bin/env bash
# capture_golden.sh — generate + run a one-off golden capture harness for a generated app.
# Usage:
#   capture_golden.sh --app <out/app> --pkg <rasheed_replica_X> --screen <ScreenClass> \
#     --cubit <CubitClass> --route </r> [--auth]
# Writes test/cap_test.dart from one of two known-good templates and runs
# `flutter test test/cap_test.dart --update-goldens` inside the app dir.
#   default (no --auth):  BlocProvider<cubit>+MaterialApp(theme) around the bare screen widget —
#                          for a non-auth, top-level (non-child) screen.
#   --auth:                pumps the real ReplicaApp, signs in (reusing the app's own existing
#                          `Session.instance.signIn(...)` line so no persona is invented here),
#                          then `appRouter.push(<route>)` to the target screen — for auth-gated or
#                          routed/child screens that need real router+session context to render.
set -uo pipefail

usage() {
  cat >&2 <<'EOF'
usage: capture_golden.sh --app <out/app> --pkg <pkg_name> --screen <ScreenClass> \
         --cubit <CubitClass> --route </route> [--auth]
EOF
}

app=""
pkg=""
screen=""
cubit=""
route=""
auth=false

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app) app="${2:-}"; shift 2 ;;
    --pkg) pkg="${2:-}"; shift 2 ;;
    --screen) screen="${2:-}"; shift 2 ;;
    --cubit) cubit="${2:-}"; shift 2 ;;
    --route) route="${2:-}"; shift 2 ;;
    --auth) auth=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done

if [[ -z "$app" || -z "$pkg" || -z "$screen" || -z "$cubit" || -z "$route" ]]; then
  usage
  exit 1
fi
if [[ ! -d "$app" || ! -f "$app/pubspec.yaml" ]]; then
  echo "capture_golden.sh: not a Flutter app dir (no pubspec.yaml): $app" >&2
  exit 1
fi

golden_name="$(echo "$screen" | sed -E 's/([a-z0-9])([A-Z])/\1_\2/g' | tr '[:upper:]' '[:lower:]')"

font_loader="  setUpAll(() async {
    final font = FontLoader('Roboto');
    for (final f in const ['Roboto-Regular', 'Roboto-Medium', 'Roboto-Bold']) {
      font.addFont(rootBundle.load('assets/fonts/\$f.ttf'));
    }
    await font.load();
    final icons = FontLoader('MaterialIcons')
      ..addFont(rootBundle.load('assets/fonts/MaterialIcons-Regular.otf'));
    await icons.load();
  });"

if [[ "$auth" == true ]]; then
  # Reuse the app's own already-generated sign-in line rather than inventing persona values here.
  session_line="$(grep -h -o "Session\.instance\.signIn([^;]*);" "$app"/test/*.dart 2>/dev/null | sort -u | head -1)"
  if [[ -z "$session_line" ]]; then
    echo "capture_golden.sh: --auth given but no existing 'Session.instance.signIn(...)' line found in $app/test/*.dart to reuse" >&2
    exit 1
  fi
  cat > "$app/test/cap_test.dart" <<EOF
// [capture_golden.sh] one-off golden capture harness — NOT committed generator output.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:get_it/get_it.dart';
import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
import 'package:${pkg}/core/di.dart';
import 'package:${pkg}/generated.dart';
import 'package:flutter/material.dart';

void main() {
${font_loader}

  setUp(() => GetIt.instance.reset());

  testWidgets('${screen} capture (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    ${session_line}
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('${route}');
    await tester.pumpAndSettle();
    await expectLater(find.byType(${screen}), matchesGoldenFile('goldens/cap_${golden_name}.png'));
  });
}
EOF
else
  cat > "$app/test/cap_test.dart" <<EOF
// [capture_golden.sh] one-off golden capture harness — NOT committed generator output.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:${pkg}/core/di.dart';
import 'package:${pkg}/generated.dart';
import 'package:${pkg}/core/theme.dart';
import 'package:flutter/material.dart';

void main() {
${font_loader}

  setUp(() => GetIt.instance.reset());

  testWidgets('${screen} capture (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<${cubit}>(
      create: (_) => sl<${cubit}>()..load(),
      child: MaterialApp(theme: buildTheme(), home: ${screen}()),
    ));
    await tester.pumpAndSettle();
    await expectLater(find.byType(${screen}), matchesGoldenFile('goldens/cap_${golden_name}.png'));
  });
}
EOF
fi

echo "[capture_golden] wrote $app/test/cap_test.dart (template=$([[ "$auth" == true ]] && echo router_session || echo bloc_theme))"

(cd "$app" && flutter test test/cap_test.dart --update-goldens)
status=$?
if [[ $status -eq 0 ]]; then
  echo "[capture_golden] PASS — goldens/cap_${golden_name}.png"
else
  echo "[capture_golden] FAIL (exit $status)"
fi
exit $status
