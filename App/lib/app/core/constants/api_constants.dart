class ApiConstants {
  ApiConstants._();

  /// Override at build time with:
  /// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:5000/api`
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);

  static const String loginEndpoint = '/auth/login';
  static const String refreshEndpoint = '/auth/refresh';
  static const String logoutEndpoint = '/auth/logout';
  static const String surveysEndpoint = '/surveys';
}
