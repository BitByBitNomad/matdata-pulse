import 'package:flutter_test/flutter_test.dart';
import 'package:matdata_pulse_app/app/core/constants/app_constants.dart';
import 'package:matdata_pulse_app/app/core/utils/validators.dart';
import 'package:matdata_pulse_app/app/data/models/survey_model.dart';

void main() {
  group('SurveyValidators', () {
    test('validates 10-digit mobile number', () {
      expect(SurveyValidators.validateMobile('9876543210'), isNull);
      expect(SurveyValidators.validateMobile('12345'), isNotNull);
      expect(SurveyValidators.validateMobile('987654321a'), isNotNull);
    });

    test('validates voter age between 18 and 120', () {
      expect(SurveyValidators.validateAge('18'), isNull);
      expect(SurveyValidators.validateAge('65'), isNull);
      expect(SurveyValidators.validateAge('17'), isNotNull);
      expect(SurveyValidators.validateAge('125'), isNotNull);
      expect(SurveyValidators.validateAge('abc'), isNotNull);
    });
  });

  group('SurveyModel serialization', () {
    test('round-trips local Hive map and builds API payload', () {
      final now = DateTime.utc(2026, 11, 25, 10, 30);
      final model = SurveyModel(
        clientSurveyId: '11111111-1111-4111-8111-111111111111',
        voterFullName: 'Rajeshwari Deshpande',
        age: 42,
        gender: 'Female',
        mobileNumber: '9823011223',
        assemblyConstituency: 'Shivajinagar',
        wardNumber: 'Ward 14',
        priorityCivicIssue: 'Water',
        sentimentRating: 'Positive',
        surveyorNotes: 'Good water pressure',
        syncStatus: AppConstants.syncStatusPending,
        collectedAt: now,
      );

      final restored = SurveyModel.fromLocalMap(model.toLocalMap());
      expect(restored.voterFullName, 'Rajeshwari Deshpande');
      expect(restored.isSynced, isFalse);

      final apiPayload = restored.toApiPayload();
      expect(apiPayload['mobileNumber'], '9823011223');
      expect(apiPayload['priorityCivicIssue'], 'Water');
      expect(apiPayload['sentimentRating'], 'Positive');
    });
  });
}
