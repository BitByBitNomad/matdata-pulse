class ApiConstants {
  ApiConstants._();

  /// Override at build time with:
  /// `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api`
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://matdata-pulse.onrender.com/api',
  );

  // 45s accommodates cloud free-tier cold starts (e.g., Render) cleanly
  static const Duration connectTimeout = Duration(seconds: 45);
  static const Duration receiveTimeout = Duration(seconds: 45);

  static const String loginEndpoint = '/auth/login';
  static const String refreshEndpoint = '/auth/refresh';
  static const String logoutEndpoint = '/auth/logout';
  static const String surveysEndpoint = '/surveys';
}
