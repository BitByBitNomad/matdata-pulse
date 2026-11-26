import 'package:dio/dio.dart';
import 'package:get/get.dart' hide Response;
import '../../core/constants/api_constants.dart';
import '../../core/services/local_storage_service.dart';
import '../models/user_model.dart';

class ApiProvider extends GetxService {
  late final Dio _dio;
  final LocalStorageService _storage = Get.find<LocalStorageService>();

  ApiProvider init() {
    final savedUrl = _storage.getApiBaseUrl();
    _dio = Dio(
      BaseOptions(
        baseUrl: (savedUrl != null && savedUrl.isNotEmpty)
            ? savedUrl
            : ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final req = error.requestOptions;
          final isAuthRoute = req.path.contains(ApiConstants.loginEndpoint) ||
              req.path.contains(ApiConstants.refreshEndpoint);

          if (error.response?.statusCode == 401 &&
              !isAuthRoute &&
              req.extra['retried'] != true) {
            final refreshed = await _attemptRefresh();
            if (refreshed) {
              req.extra['retried'] = true;
              final newToken = await _storage.getAccessToken();
              req.headers['Authorization'] = 'Bearer $newToken';
              try {
                final retryResponse = await _dio.fetch(req);
                handler.resolve(retryResponse);
                return;
              } catch (retryErr) {
                handler.next(retryErr is DioException ? retryErr : error);
                return;
              }
            }
          }
          handler.next(error);
        },
      ),
    );

    return this;
  }

  String get currentBaseUrl => _dio.options.baseUrl;

  Future<void> updateBaseUrl(String url) async {
    await _storage.saveApiBaseUrl(url);
    final saved = _storage.getApiBaseUrl();
    _dio.options.baseUrl =
        (saved != null && saved.isNotEmpty) ? saved : ApiConstants.baseUrl;
  }

  Future<bool> _attemptRefresh() async {
    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: _dio.options.baseUrl,
          connectTimeout: ApiConstants.connectTimeout,
          receiveTimeout: ApiConstants.receiveTimeout,
        ),
      );

      final res = await refreshDio.post<Map<String, dynamic>>(
        ApiConstants.refreshEndpoint,
        data: {'refreshToken': refreshToken},
      );
      final data = res.data?['data'] as Map<String, dynamic>?;
      if (data == null) return false;

      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      await _storage.saveSession(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
        user: user,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Response<Map<String, dynamic>>> post(
    String path, {
    dynamic data,
  }) {
    return _dio.post<Map<String, dynamic>>(path, data: data);
  }

  Future<Response<Map<String, dynamic>>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    return _dio.get<Map<String, dynamic>>(path, queryParameters: queryParameters);
  }
}
