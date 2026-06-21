import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  AppTextStyles._();

  static const String fontFamily = 'Tajawal';

  static const TextStyle display = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w800,
    fontSize: 34,
    color: AppColors.textPrimary,
  );

  static const TextStyle heading = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w800,
    fontSize: 24,
    color: AppColors.textPrimary,
  );

  static const TextStyle title = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w800,
    fontSize: 17,
    color: AppColors.textPrimary,
  );

  static const TextStyle body = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w500,
    fontSize: 15,
    color: AppColors.textPrimary,
  );

  static const TextStyle bodyRegular = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w400,
    fontSize: 14,
    color: AppColors.textPrimary,
  );

  static const TextStyle caption = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w400,
    fontSize: 12,
    color: AppColors.textMuted,
  );

  static const TextStyle label = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w800,
    fontSize: 13,
    color: AppColors.textPrimary,
  );

  static const TextStyle button = TextStyle(
    fontFamily: fontFamily,
    fontWeight: FontWeight.w700,
    fontSize: 15,
    color: AppColors.textOnPrimary,
  );
}
