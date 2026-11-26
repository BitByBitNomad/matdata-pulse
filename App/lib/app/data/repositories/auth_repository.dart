import 'package:dio/dio.dart';
import 'package:get/get.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/local_storage_service.dart';
import '../models/user_model.dart';
import '../providers/api_provider.dart';

class AuthRepository {
  final ApiProvider _api = Get.find<ApiProvider>();
  final LocalStorageService _storage = Get.find<LocalStorageService>();

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _api.post(
        ApiConstants.loginEndpoint,
        data: {'email': email.trim(), 'password': password},
      );
      final data = res.data?['data'] as Map<String, dynamic>;
      final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      await _storage.clearSyncedSurveysForOtherUsers(user.id);
      await _storage.saveSession(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
        user: user,
      );
      return user;
    } on DioException catch (e) {
      final msg = (e.response?.data as Map<String, dynamic>?)?['error']?['message'];
      if (msg is String && msg.isNotEmpty) {
        throw Exception(msg);
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Connection timed out. Please verify backend server URL.');
      }
      throw Exception('Unable to connect to server. Check network.');
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      await _api.post(
        ApiConstants.logoutEndpoint,
        data: {'refreshToken': refreshToken},
      );
    } catch (_) {
      // Clear local session even if offline
    } finally {
      await _storage.clearSyncedSurveys();
      await _storage.clearSession();
    }
  }

  UserModel? getCachedUser() => _storage.getSavedUser();
}
