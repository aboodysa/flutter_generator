import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();

  final tajawalLoader = FontLoader('Tajawal')
    ..addFont(rootBundle.load('assets/fonts/Tajawal-Regular.ttf'));
  final materialIconsPath = File(
    'build/unit_test_assets/fonts/MaterialIcons-Regular.otf',
  );
  final fallbackMaterialIconsPath = File(
    'build/flutter_assets/fonts/MaterialIcons-Regular.otf',
  );
  final materialIconsBytes = await (materialIconsPath.existsSync()
      ? materialIconsPath.readAsBytes()
      : fallbackMaterialIconsPath.readAsBytes());
  final materialIconsLoader = FontLoader('MaterialIcons')
    ..addFont(
      Future<ByteData>.value(ByteData.sublistView(materialIconsBytes)),
    );

  await Future.wait([
    tajawalLoader.load(),
    materialIconsLoader.load(),
  ]);

  await testMain();
}
