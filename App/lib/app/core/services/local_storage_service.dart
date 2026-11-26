import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../data/models/survey_model.dart';
import '../../data/models/user_model.dart';
import '../constants/app_constants.dart';

class LocalStorageService extends GetxService {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userProfileKey = 'user_profile';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  late Box<Map<dynamic, dynamic>> _surveysBox;
  late Box<String> _authBox;

  Future<LocalStorageService> init() async {
    await Hive.initFlutter();
    _surveysBox = await Hive.openBox<Map<dynamic, dynamic>>(AppConstants.surveysBox);
    _authBox = await Hive.openBox<String>(AppConstants.authBox);
    return this;
  }

  // --- Auth Persistence (Secure Storage with Hive fallback for web/desktop) ---

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required UserModel user,
  }) async {
    try {
      await _secureStorage.write(key: _accessTokenKey, value: accessToken);
      await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
    } catch (_) {
      await _authBox.put(_accessTokenKey, accessToken);
      await _authBox.put(_refreshTokenKey, refreshToken);
    }
    await _authBox.put(_userProfileKey, jsonEncode(user.toJson()));
  }

  Future<String?> getAccessToken() async {
    try {
      final token = await _secureStorage.read(key: _accessTokenKey);
      if (token != null) return token;
    } catch (_) {}
    return _authBox.get(_accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    try {
      final token = await _secureStorage.read(key: _refreshTokenKey);
      if (token != null) return token;
    } catch (_) {}
    return _authBox.get(_refreshTokenKey);
  }

  UserModel? getSavedUser() {
    final raw = _authBox.get(_userProfileKey);
    if (raw == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearSession() async {
    try {
      await _secureStorage.delete(key: _accessTokenKey);
      await _secureStorage.delete(key: _refreshTokenKey);
    } catch (_) {}
    await _authBox.delete(_accessTokenKey);
    await _authBox.delete(_refreshTokenKey);
    await _authBox.delete(_userProfileKey);
  }

  // --- Offline-First Survey Persistence ---

  Future<void> saveSurvey(SurveyModel survey) async {
    await _surveysBox.put(survey.clientSurveyId, survey.toLocalMap());
  }

  List<SurveyModel> getAllSurveys() {
    final list = _surveysBox.values
        .map((raw) => SurveyModel.fromLocalMap(raw))
        .toList();
    list.sort((a, b) => b.collectedAt.compareTo(a.collectedAt));
    return list;
  }

  List<SurveyModel> getPendingSurveys() {
    return getAllSurveys().where((s) => !s.isSynced).toList();
  }

  Future<void> markSurveysSynced({
    required List<String> clientSurveyIds,
    required Map<String, String> serverIdByClientId,
    String? collectorId,
  }) async {
    final now = DateTime.now();
    for (final clientId in clientSurveyIds) {
      final existingMap = _surveysBox.get(clientId);
      if (existingMap == null) continue;
      final survey = SurveyModel.fromLocalMap(existingMap);
      final updated = survey.copyWith(
        serverId: serverIdByClientId[clientId] ?? survey.serverId,
        collectorId: collectorId ?? survey.collectorId,
        syncStatus: AppConstants.syncStatusSynced,
        syncedAt: now,
      );
      await _surveysBox.put(clientId, updated.toLocalMap());
    }
  }

  /// Merges remote surveys fetched from `GET /api/surveys` into local Hive storage
  /// without ever overwriting unsynced local `Pending Sync` entries.
  Future<void> upsertRemoteSurveys(List<SurveyModel> remoteSurveys) async {
    for (final remote in remoteSurveys) {
      final existingMap = _surveysBox.get(remote.clientSurveyId);
      if (existingMap != null) {
        final existing = SurveyModel.fromLocalMap(existingMap);
        if (!existing.isSynced) {
          continue;
        }
      }
      await _surveysBox.put(remote.clientSurveyId, remote.toLocalMap());
    }
  }

  /// Clears previously cached synced records belonging to another account on login,
  /// while preserving any unsynced `Pending Sync` surveys safely.
  Future<void> clearSyncedSurveysForOtherUsers(String activeUserId) async {
    final keysToDelete = <dynamic>[];
    for (final entry in _surveysBox.toMap().entries) {
      final survey = SurveyModel.fromLocalMap(entry.value);
      if (survey.isSynced &&
          survey.collectorId != null &&
          survey.collectorId != activeUserId) {
        keysToDelete.add(entry.key);
      }
    }
    if (keysToDelete.isNotEmpty) {
      await _surveysBox.deleteAll(keysToDelete);
    }
  }

  /// Clears synced records on explicit logout while keeping offline pending items.
  Future<void> clearSyncedSurveys() async {
    final keysToDelete = <dynamic>[];
    for (final entry in _surveysBox.toMap().entries) {
      final survey = SurveyModel.fromLocalMap(entry.value);
      if (survey.isSynced) {
        keysToDelete.add(entry.key);
      }
    }
    if (keysToDelete.isNotEmpty) {
      await _surveysBox.deleteAll(keysToDelete);
    }
  }
}
