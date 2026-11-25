import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:uuid/uuid.dart';
import '../../core/constants/app_constants.dart';
import '../../core/services/connectivity_service.dart';
import '../../core/services/local_storage_service.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/survey_model.dart';
import '../../data/repositories/survey_repository.dart';
import '../submissions/submissions_controller.dart';

class SurveyFormController extends GetxController {
  final SurveyRepository _surveyRepo = SurveyRepository();
  final ConnectivityService _connectivity = Get.find<ConnectivityService>();
  final LocalStorageService _storage = Get.find<LocalStorageService>();
  final Uuid _uuid = const Uuid();

  final formKey = GlobalKey<FormState>();

  final voterNameController = TextEditingController();
  final ageController = TextEditingController();
  final mobileController = TextEditingController();
  final constituencyController = TextEditingController();
  final wardController = TextEditingController();
  final notesController = TextEditingController();

  final RxString selectedGender = 'Male'.obs;
  final RxString selectedIssue = AppConstants.civicIssues.first.obs;
  final RxString selectedSentiment = 'Positive'.obs;
  final RxBool isSubmitting = false.obs;

  @override
  void onInit() {
    super.onInit();
    final savedUser = _storage.getSavedUser();
    if (savedUser?.assignedConstituency != null &&
        savedUser!.assignedConstituency!.isNotEmpty) {
      constituencyController.text = savedUser.assignedConstituency!;
    } else {
      constituencyController.text = AppConstants.sampleConstituencies.first;
    }
  }

  Future<void> submitSurvey() async {
    if (!(formKey.currentState?.validate() ?? false)) return;

    isSubmitting.value = true;
    try {
      final survey = SurveyModel(
        clientSurveyId: _uuid.v4(),
        voterFullName: voterNameController.text.trim(),
        age: int.parse(ageController.text.trim()),
        gender: selectedGender.value,
        mobileNumber: mobileController.text.trim(),
        assemblyConstituency: constituencyController.text.trim(),
        wardNumber: wardController.text.trim(),
        priorityCivicIssue: selectedIssue.value,
        sentimentRating: selectedSentiment.value,
        surveyorNotes: notesController.text.trim(),
        syncStatus: AppConstants.syncStatusPending,
        collectedAt: DateTime.now(),
      );

      // Step 1: Always persist locally FIRST so offline data is never lost
      await _surveyRepo.saveSurveyLocally(survey);

      // Refresh Submissions list immediately
      if (Get.isRegistered<SubmissionsController>()) {
        Get.find<SubmissionsController>().loadLocalSurveys();
      }

      _resetFormFields();

      // Step 2: Attempt immediate cloud sync if device is online
      final online = await _connectivity.checkNow();
      if (online) {
        try {
          await _surveyRepo.syncPendingSurveys();
          if (Get.isRegistered<SubmissionsController>()) {
            Get.find<SubmissionsController>().loadLocalSurveys();
          }
          Get.snackbar(
            'Survey Saved & Synced',
            'Voter response recorded and uploaded to central cloud.',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: AppTheme.syncedGreen,
            colorText: Colors.white,
            margin: const EdgeInsets.all(12),
          );
          return;
        } catch (_) {
          // Fall through cleanly to offline-saved notice
        }
      }

      Get.snackbar(
        'Saved Offline (Pending Sync)',
        'Device is offline or server unreachable. Record safely queued locally.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppTheme.pendingOrange,
        colorText: Colors.white,
        margin: const EdgeInsets.all(12),
        duration: const Duration(seconds: 4),
      );
    } finally {
      isSubmitting.value = false;
    }
  }

  void _resetFormFields() {
    voterNameController.clear();
    ageController.clear();
    mobileController.clear();
    wardController.clear();
    notesController.clear();
    selectedGender.value = 'Male';
    selectedIssue.value = AppConstants.civicIssues.first;
    selectedSentiment.value = 'Positive';
  }

  @override
  void onClose() {
    voterNameController.dispose();
    ageController.dispose();
    mobileController.dispose();
    constituencyController.dispose();
    wardController.dispose();
    notesController.dispose();
    super.onClose();
  }
}
