import 'package:dio/dio.dart';
import 'package:get/get.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/local_storage_service.dart';
import '../models/survey_model.dart';
import '../providers/api_provider.dart';

class SyncBatchResult {
  final int insertedCount;
  final int skippedDuplicates;
  final List<String> syncedClientIds;

  const SyncBatchResult({
    required this.insertedCount,
    required this.skippedDuplicates,
    required this.syncedClientIds,
  });
}

class SurveyRepository {
  final ApiProvider _api = Get.find<ApiProvider>();
  final LocalStorageService _storage = Get.find<LocalStorageService>();

  Future<void> saveSurveyLocally(SurveyModel survey) async {
    await _storage.saveSurvey(survey);
  }

  List<SurveyModel> loadAllLocalSurveys() => _storage.getAllSurveys();

  List<SurveyModel> loadPendingSurveys() => _storage.getPendingSurveys();

  Future<SyncBatchResult> syncPendingSurveys() async {
    final pending = _storage.getPendingSurveys();
    if (pending.isEmpty) {
      return const SyncBatchResult(
        insertedCount: 0,
        skippedDuplicates: 0,
        syncedClientIds: [],
      );
    }

    try {
      final payload = pending.map((s) => s.toApiPayload()).toList();
      final res = await _api.post(
        ApiConstants.surveysEndpoint,
        data: payload,
      );

      final data = res.data?['data'] as Map<String, dynamic>;
      final syncedIds = (data['syncedClientIds'] as List<dynamic>)
          .map((e) => e.toString())
          .toList();

      final serverSurveys = (data['surveys'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      final serverIdByClientId = <String, String>{};
      for (final s in serverSurveys) {
        final clientId = s['clientSurveyId'] as String?;
        final serverId = s['id'] as String?;
        if (clientId != null && serverId != null) {
          serverIdByClientId[clientId] = serverId;
        }
      }

      await _storage.markSurveysSynced(
        clientSurveyIds: syncedIds,
        serverIdByClientId: serverIdByClientId,
      );

      return SyncBatchResult(
        insertedCount: (data['insertedCount'] as num?)?.toInt() ?? syncedIds.length,
        skippedDuplicates: (data['skippedDuplicates'] as num?)?.toInt() ?? 0,
        syncedClientIds: syncedIds,
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Sync timed out. Records remain safely stored offline.');
      }
      if (e.response?.statusCode == 429) {
        throw Exception('Rate limit reached. Please wait a few seconds and retry.');
      }
      if (e.response?.statusCode == 401) {
        throw Exception('Session expired. Please sign in again to sync.');
      }
      final apiMsg = (e.response?.data as Map<String, dynamic>?)?['error']?['message'];
      if (apiMsg is String && apiMsg.isNotEmpty) {
        throw Exception(apiMsg);
      }
      throw Exception('Network unreachable. Pending surveys are safe offline.');
    }
  }
}
