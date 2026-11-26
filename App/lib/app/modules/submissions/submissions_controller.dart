import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/constants/app_constants.dart';
import '../../core/services/connectivity_service.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/survey_model.dart';
import '../../data/repositories/survey_repository.dart';

class SubmissionsController extends GetxController {
  final SurveyRepository _surveyRepo = SurveyRepository();
  final ConnectivityService _connectivity = Get.find<ConnectivityService>();

  final RxList<SurveyModel> surveys = <SurveyModel>[].obs;
  final RxString filterStatus = 'All'.obs; // All | Pending Sync | Synced
  final RxBool isSyncing = false.obs;
  final RxBool isLoadingRemote = false.obs;

  int get totalCount => surveys.length;
  int get pendingCount => surveys.where((s) => !s.isSynced).length;
  int get syncedCount => surveys.where((s) => s.isSynced).length;

  List<SurveyModel> get filteredSurveys {
    if (filterStatus.value == AppConstants.syncStatusPending) {
      return surveys.where((s) => !s.isSynced).toList();
    }
    if (filterStatus.value == AppConstants.syncStatusSynced) {
      return surveys.where((s) => s.isSynced).toList();
    }
    return surveys;
  }

  @override
  void onInit() {
    super.onInit();
    loadLocalSurveys();
    unawaited(pullRemoteSurveys());
  }

  void loadLocalSurveys() {
    surveys.assignAll(_surveyRepo.loadAllLocalSurveys());
  }

  Future<void> pullRemoteSurveys({bool showFeedbackOnError = false}) async {
    if (isLoadingRemote.value) return;
    final online = await _connectivity.checkNow();
    if (!online) return;

    isLoadingRemote.value = true;
    try {
      await _surveyRepo.fetchRemoteSurveys();
      loadLocalSurveys();
    } catch (e) {
      if (showFeedbackOnError) {
        Get.snackbar(
          'Offline / Sync Notice',
          e.toString().replaceFirst('Exception: ', ''),
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: AppTheme.navyPrimary,
          colorText: Colors.white,
          margin: const EdgeInsets.all(12),
        );
      }
    } finally {
      isLoadingRemote.value = false;
    }
  }

  Future<void> refreshAndSync() async {
    loadLocalSurveys();
    if (pendingCount > 0) {
      await syncNow();
    } else {
      await pullRemoteSurveys(showFeedbackOnError: true);
    }
  }

  Future<void> syncNow() async {
    if (isSyncing.value) return;
    if (pendingCount == 0) {
      await pullRemoteSurveys(showFeedbackOnError: true);
      Get.snackbar(
        'All Synced',
        'Submissions refreshed from server.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppTheme.navyPrimary,
        colorText: Colors.white,
        margin: const EdgeInsets.all(12),
      );
      return;
    }

    final online = await _connectivity.checkNow();
    if (!online) {
      Get.snackbar(
        'Device Offline',
        '$pendingCount surveys remain safely stored locally. Reconnect to sync.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppTheme.pendingOrange,
        colorText: Colors.white,
        margin: const EdgeInsets.all(12),
      );
      return;
    }

    isSyncing.value = true;
    try {
      final result = await _surveyRepo.syncPendingSurveys();
      try {
        await _surveyRepo.fetchRemoteSurveys();
      } catch (_) {
        // Non-fatal if pull fails right after push
      }
      loadLocalSurveys();
      Get.snackbar(
        'Sync Completed',
        'Uploaded ${result.insertedCount} survey(s)'
            '${result.skippedDuplicates > 0 ? ' (${result.skippedDuplicates} already synced)' : ''}.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppTheme.syncedGreen,
        colorText: Colors.white,
        margin: const EdgeInsets.all(12),
      );
    } catch (e) {
      Get.dialog(
        AlertDialog(
          title: const Text('Sync Failed'),
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          actions: [
            TextButton(
              onPressed: () => Get.back(),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } finally {
      isSyncing.value = false;
    }
  }
}
