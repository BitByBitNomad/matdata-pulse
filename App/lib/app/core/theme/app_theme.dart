import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  static const Color navyPrimary = Color(0xFF0F172A);
  static const Color indigoAccent = Color(0xFF4F46E5);
  static const Color saffronHighlight = Color(0xFFF59E0B);
  static const Color syncedGreen = Color(0xFF059669);
  static const Color pendingOrange = Color(0xFFD97706);
  static const Color errorRed = Color(0xFFDC2626);
  static const Color surfaceBg = Color(0xFFF8FAFC);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: indigoAccent,
        primary: indigoAccent,
        secondary: navyPrimary,
        surface: Colors.white,
      ),
      scaffoldBackgroundColor: surfaceBg,
      appBarTheme: const AppBarTheme(
        backgroundColor: navyPrimary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: indigoAccent, width: 1.6),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: indigoAccent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
    );
  }
}
