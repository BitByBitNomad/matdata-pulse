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

    test('validates assembly constituency and rejects numeric/junk inputs', () {
      expect(SurveyValidators.validateConstituency('Shivajinagar'), isNull);
      expect(SurveyValidators.validateConstituency('Bandra West'), isNull);
      expect(SurveyValidators.validateConstituency('12345'), isNotNull);
      expect(SurveyValidators.validateConstituency('aaaa'), isNotNull);
      expect(SurveyValidators.validateConstituency('ab'), isNotNull);
    });

    test('validates and normalizes ward numbers between 1 and 300', () {
      expect(SurveyValidators.validateWardNumber('14'), isNull);
      expect(SurveyValidators.validateWardNumber('Ward 14'), isNull);
      expect(SurveyValidators.validateWardNumber('8A'), isNull);
      expect(SurveyValidators.validateWardNumber('0'), isNotNull);
      expect(SurveyValidators.validateWardNumber('Ward 999'), isNotNull);
      expect(SurveyValidators.validateWardNumber('abc'), isNotNull);

      expect(SurveyValidators.normalizeWardNumber('8'), 'Ward 08');
      expect(SurveyValidators.normalizeWardNumber('ward-14a'), 'Ward 14A');
    });
  });

  group('SurveyModel serialization', () {
    test('round-trips local Hive map and builds API payload with state & city', () {
      final now = DateTime.utc(2026, 11, 25, 10, 30);
      final model = SurveyModel(
        clientSurveyId: '11111111-1111-4111-8111-111111111111',
        voterFullName: 'Rajeshwari Deshpande',
        age: 42,
        gender: 'Female',
        mobileNumber: '9823011223',
        state: 'Maharashtra',
        city: 'Pune',
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
      expect(restored.state, 'Maharashtra');
      expect(restored.city, 'Pune');
      expect(restored.isSynced, isFalse);

      final apiPayload = restored.toApiPayload();
      expect(apiPayload['state'], 'Maharashtra');
      expect(apiPayload['city'], 'Pune');
      expect(apiPayload['mobileNumber'], '9823011223');
      expect(apiPayload['priorityCivicIssue'], 'Water');
      expect(apiPayload['sentimentRating'], 'Positive');
    });

    test('hydrates remote survey JSON from GET /api/surveys as Synced', () {
      final remote = SurveyModel.fromApiJson({
        'id': '99999999-9999-4999-8999-999999999999',
        'clientSurveyId': '11111111-1111-4111-8111-111111111111',
        'collectorId': '22222222-2222-4222-8222-222222222222',
        'voterFullName': 'Sunita Patwardhan',
        'age': 61,
        'gender': 'Female',
        'mobileNumber': '9765011998',
        'state': 'Maharashtra',
        'city': 'Pune',
        'assemblyConstituency': 'Shivajinagar',
        'wardNumber': 'Ward 11',
        'priorityCivicIssue': 'Healthcare',
        'sentimentRating': 'Positive',
        'surveyorNotes': 'Verified at clinic',
        'auditStatus': 'Verified',
        'collectedAt': '2026-11-26T10:00:00.000Z',
        'syncedAt': '2026-11-26T10:01:00.000Z',
      });

      expect(remote.isSynced, isTrue);
      expect(remote.serverId, '99999999-9999-4999-8999-999999999999');
      expect(remote.collectorId, '22222222-2222-4222-8222-222222222222');
      expect(remote.auditStatus, 'Verified');
    });
  });
}
