import 'package:flutter/material.dart';

class AppColors {
  // Primary palette — amber/gold beer theme
  static const Color primary = Color(0xFFF4A300);
  static const Color primaryDark = Color(0xFFCC8800);
  static const Color primaryLight = Color(0xFFFFBF40);

  // Accent
  static const Color accent = Color(0xFFFF6B35);

  // Backgrounds
  static const Color background = Color(0xFF0F0F0F);
  static const Color surface = Color(0xFF1A1A1A);
  static const Color surface2 = Color(0xFF242424);
  static const Color surface3 = Color(0xFF2E2E2E);
  static const Color divider = Color(0xFF333333);

  // Status
  static const Color success = Color(0xFF22C55E);
  static const Color successDark = Color(0xFF16A34A);
  static const Color error = Color(0xFFEF4444);
  static const Color errorDark = Color(0xFFDC2626);
  static const Color warning = Color(0xFFFBBF24);
  static const Color info = Color(0xFF3B82F6);

  // Text
  static const Color textPrimary = Color(0xFFF5F5F5);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textDisabled = Color(0xFF4B5563);
  static const Color textOnPrimary = Color(0xFF0F0F0F);

  // Card gradients
  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFF4A300), Color(0xFFFF6B35)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient greenGradient = LinearGradient(
    colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient blueGradient = LinearGradient(
    colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient purpleGradient = LinearGradient(
    colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient redGradient = LinearGradient(
    colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient surfaceGradient = LinearGradient(
    colors: [Color(0xFF1A1A1A), Color(0xFF242424)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppSizes {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;

  static const double cardRadius = 16.0;
  static const double buttonRadius = 12.0;
  static const double inputRadius = 12.0;
  static const double chipRadius = 8.0;

  static const double iconSm = 16.0;
  static const double iconMd = 24.0;
  static const double iconLg = 32.0;
}

class AppConstants {
  // API — use 10.0.2.2 for Android emulator (maps to host localhost)
  // Change to your LAN IP when testing on a real device
  static const String baseUrl = 'http://10.0.2.2:5000';

  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'auth_user';

  // Roles
  static const String roleOwner = 'Owner';
  static const String roleManager = 'Manager';
  static const String roleCashier = 'Cashier';

  static const List<String> ownerManagerRoles = [roleOwner, roleManager];
  static const List<String> allRoles = [roleOwner, roleManager, roleCashier];
}
