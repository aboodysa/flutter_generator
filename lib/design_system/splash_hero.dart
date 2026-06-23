import 'package:flutter/material.dart';
import '../core/theme/theme.dart';

class SplashHero extends StatelessWidget {
  const SplashHero({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFEDE7FF),
            Colors.white,
          ],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -92,
            bottom: 82,
            child: Container(
              width: 560,
              height: 560,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.16),
                  width: 1,
                ),
              ),
            ),
          ),
          Positioned(
            top: 392,
            right: 90,
            child: Container(
              width: 430,
              height: 2,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.55),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFB894FF).withValues(alpha: 0.85),
                    offset: const Offset(80, 128),
                    blurRadius: 0,
                  ),
                ],
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 126,
                  height: 126,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'فحص',
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                            height: 0.82,
                          ),
                        ),
                        Text(
                          'FAHS',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                            height: 0.82,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                Icon(
                  Icons.directions_car_rounded,
                  size: 132,
                  color: AppColors.primaryDark,
                  shadows: [
                    Shadow(
                      color: Colors.black.withValues(alpha: 0.18),
                      blurRadius: 18,
                      offset: const Offset(0, 18),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
