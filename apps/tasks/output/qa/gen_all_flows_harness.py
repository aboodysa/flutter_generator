#!/usr/bin/env python3
"""Generate an all-flows golden test for a generated Flutter app (one screen per case).

For each screen: login captures the persona gate; non-login screens sign in (if the app has
auth) by tapping the first persona card, then navigate to the screen's route and capture.
Usage: python3 gen_all_flows_harness.py <app-dir> <pkg> <screens-file>
screens-file lines:  ScreenClass|kind|route|libPath
  kind: login | list | detail | form | wizard
  route: the go_router path for that screen (e.g. /task, /task/x, /task/new, /work-auth/wizard)
  libPath: optional lib-relative file to import when the class isn't in generated.dart
"""
import sys
import os

appdir, pkg = sys.argv[1], sys.argv[2]
screens_file = sys.argv[3]

screens = []
for line in open(screens_file):
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    parts = [x.strip() for x in line.split("|")]
    name, kind, route = parts[0], parts[1], parts[2]
    sfile = parts[3] if len(parts) > 3 else ""
    screens.append((name, kind, route, sfile))

authed = any(k == "login" for _, k, _, _ in screens)

setup = """// TEMP harness — all flows (not committed; source of apps/<app>/output/goldens/)
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:%s/main.dart';
import 'package:%s/core/di.dart';
import 'package:%s/core/router.dart';
import 'package:%s/generated.dart';
import 'package:%s/core/theme.dart';
import 'package:%s/core/components.dart';
""" % (pkg, pkg, pkg, pkg, pkg, pkg)

screen_imports = "\n".join(f"import 'package:{pkg}/{sf}';" for _, _, _, sf in screens if sf)

cases = []
for name, kind, route, sfile in screens:
    klass = name
    body = "    await tester.pumpWidget(const ReplicaApp());\n    await tester.pumpAndSettle();"
    if kind == "login":
        nav = ""
    else:
        if authed:
            # sign in via the first persona card, then navigate
            body += """
    if (find.byType(AuthLoginScreen).evaluate().isNotEmpty) {
      await tester.tap(find.byType(AppListCard).first);
      await tester.pumpAndSettle();
    }"""
        nav = f"\n    appRouter.go('{route}');\n    await tester.pumpAndSettle();"
    cases.append(f"""
  testWidgets('{name} (golden)', (tester) async {{
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
{body}{nav}
    await expectLater(find.byType({klass}), matchesGoldenFile('goldens/{name}_all.png'));
  }});""")

out = setup + screen_imports + "\n\nvoid main() {\n  setUpAll(() async {\n    final font = FontLoader('Roboto');\n    for (final f in const ['Roboto-Regular', 'Roboto-Medium', 'Roboto-Bold']) {\n      font.addFont(rootBundle.load('assets/fonts/$f.ttf'));\n    }\n    await font.load();\n    final icons = FontLoader('MaterialIcons')\n      ..addFont(rootBundle.load('assets/fonts/MaterialIcons-Regular.otf'));\n    await icons.load();\n  });\n" + "\n".join(cases) + "\n}\n"

path = os.path.join(appdir, "test", "temp_all_flows_test.dart")
with open(path, "w") as f:
    f.write(out)
print(f"wrote {path} with {len(screens)} screen cases")
