import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:uuid/uuid.dart';
import '../../core/constants/app_constants.dart';
import '../../core/constants/geo_constants.dart';
import '../../core/services/connectivity_service.dart';
import '../../core/services/local_storage_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validators.dart';
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
  final customConstituencyController = TextEditingController();
  final wardController = TextEditingController();
  final notesController = TextEditingController();

  final RxString selectedState = 'Maharashtra'.obs;
  final RxString selectedCity = 'Pune'.obs;
  final RxString selectedConstituency = 'Shivajinagar'.obs;
  final RxString selectedGender = 'Male'.obs;
  final RxString selectedIssue = AppConstants.civicIssues.first.obs;
  final RxString selectedSentiment = 'Positive'.obs;
  final RxBool isSubmitting = false.obs;
  final RxDouble completionRatio = 0.2.obs;

  List<String> get availableCities => GeoConstants.citiesForState(selectedState.value);

  List<String> get availableConstituencies => [
        ...GeoConstants.constituenciesForCity(selectedState.value, selectedCity.value),
        GeoConstants.customConstituencyOption,
      ];

  bool get isCustomConstituency =>
      selectedConstituency.value == GeoConstants.customConstituencyOption;

  @override
  void onInit() {
    super.onInit();
    final savedUser = _storage.getSavedUser();
    final assignedAc = savedUser?.assignedConstituency;
    if (assignedAc != null && assignedAc.isNotEmpty) {
      final matches = availableConstituencies.contains(assignedAc);
      if (matches) {
        selectedConstituency.value = assignedAc;
      } else {
        selectedConstituency.value = GeoConstants.customConstituencyOption;
        customConstituencyController.text = assignedAc;
      }
    }

    for (final ctrl in [
      voterNameController,
      ageController,
      mobileController,
      customConstituencyController,
      wardController,
    ]) {
      ctrl.addListener(_recalculateCompletion);
    }
    _recalculateCompletion();
  }

  void onStateChanged(String newState) {
    selectedState.value = newState;
    final cities = availableCities;
    selectedCity.value = cities.isNotEmpty ? cities.first : '';
    onCityChanged(selectedCity.value);
  }

  void onCityChanged(String newCity) {
    selectedCity.value = newCity;
    final acList = GeoConstants.constituenciesForCity(selectedState.value, newCity);
    selectedConstituency.value =
        acList.isNotEmpty ? acList.first : GeoConstants.customConstituencyOption;
    customConstituencyController.clear();
    _recalculateCompletion();
  }

  void onConstituencyChanged(String newAc) {
    selectedConstituency.value = newAc;
    if (newAc != GeoConstants.customConstituencyOption) {
      customConstituencyController.clear();
    }
    _recalculateCompletion();
  }

  void _recalculateCompletion() {
    var filled = 0;
    const totalRequired = 5;
    if (voterNameController.text.trim().length >= 2) filled++;
    if (int.tryParse(ageController.text.trim()) != null) filled++;
    if (mobileController.text.trim().length == 10) filled++;
    final hasAc = isCustomConstituency
        ? SurveyValidators.validateConstituency(customConstituencyController.text) == null
        : selectedConstituency.value.isNotEmpty;
    if (hasAc) filled++;
    if (SurveyValidators.validateWardNumber(wardController.text) == null) filled++;
    completionRatio.value = (filled / totalRequired).clamp(0.08, 1.0);
  }

  Future<void> submitSurvey() async {
    if (!(formKey.currentState?.validate() ?? false)) return;

    isSubmitting.value = true;
    try {
      final resolvedAc = isCustomConstituency
          ? customConstituencyController.text.trim().replaceAll(RegExp(r'\s+'), ' ')
          : selectedConstituency.value;
      final normalizedWard = SurveyValidators.normalizeWardNumber(wardController.text);

      final survey = SurveyModel(
        clientSurveyId: _uuid.v4(),
        voterFullName: voterNameController.text.trim(),
        age: int.parse(ageController.text.trim()),
        gender: selectedGender.value,
        mobileNumber: mobileController.text.trim(),
        state: selectedState.value,
        city: selectedCity.value,
        assemblyConstituency: resolvedAc,
        wardNumber: normalizedWard,
        priorityCivicIssue: selectedIssue.value,
        sentimentRating: selectedSentiment.value,
        surveyorNotes: notesController.text.trim(),
        syncStatus: AppConstants.syncStatusPending,
        collectedAt: DateTime.now(),
      );

      // Step 1: Always persist locally FIRST so offline data is never lost
      await _surveyRepo.saveSurveyLocally(survey);

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
        'Record safely queued on device and ready for sync.',
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
    customConstituencyController.clear();
    selectedGender.value = 'Male';
    selectedIssue.value = AppConstants.civicIssues.first;
    selectedSentiment.value = 'Positive';
    _recalculateCompletion();
  }

  @override
  void onClose() {
    voterNameController.dispose();
    ageController.dispose();
    mobileController.dispose();
    customConstituencyController.dispose();
    wardController.dispose();
    notesController.dispose();
    super.onClose();
  }
}
