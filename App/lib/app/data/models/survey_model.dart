import '../../core/constants/app_constants.dart';

class SurveyModel {
  final String clientSurveyId;
  final String? serverId;
  final String voterFullName;
  final int age;
  final String gender;
  final String mobileNumber;
  final String assemblyConstituency;
  final String wardNumber;
  final String priorityCivicIssue;
  final String sentimentRating;
  final String surveyorNotes;
  final String syncStatus; // 'Pending Sync' | 'Synced'
  final String auditStatus; // 'Pending' | 'Verified' | 'Flagged' | 'Duplicate'
  final DateTime collectedAt;
  final DateTime? syncedAt;

  const SurveyModel({
    required this.clientSurveyId,
    this.serverId,
    required this.voterFullName,
    required this.age,
    required this.gender,
    required this.mobileNumber,
    required this.assemblyConstituency,
    required this.wardNumber,
    required this.priorityCivicIssue,
    required this.sentimentRating,
    required this.surveyorNotes,
    required this.syncStatus,
    this.auditStatus = 'Pending',
    required this.collectedAt,
    this.syncedAt,
  });

  bool get isSynced => syncStatus == AppConstants.syncStatusSynced;

  SurveyModel copyWith({
    String? serverId,
    String? syncStatus,
    String? auditStatus,
    DateTime? syncedAt,
  }) {
    return SurveyModel(
      clientSurveyId: clientSurveyId,
      serverId: serverId ?? this.serverId,
      voterFullName: voterFullName,
      age: age,
      gender: gender,
      mobileNumber: mobileNumber,
      assemblyConstituency: assemblyConstituency,
      wardNumber: wardNumber,
      priorityCivicIssue: priorityCivicIssue,
      sentimentRating: sentimentRating,
      surveyorNotes: surveyorNotes,
      syncStatus: syncStatus ?? this.syncStatus,
      auditStatus: auditStatus ?? this.auditStatus,
      collectedAt: collectedAt,
      syncedAt: syncedAt ?? this.syncedAt,
    );
  }

  /// Payload sent to backend `POST /api/surveys`.
  Map<String, dynamic> toApiPayload() {
    return {
      'clientSurveyId': clientSurveyId,
      'voterFullName': voterFullName,
      'age': age,
      'gender': gender,
      'mobileNumber': mobileNumber,
      'assemblyConstituency': assemblyConstituency,
      'wardNumber': wardNumber,
      'priorityCivicIssue': priorityCivicIssue,
      'sentimentRating': sentimentRating,
      'surveyorNotes': surveyorNotes,
      'collectedAt': collectedAt.toUtc().toIso8601String(),
    };
  }

  Map<String, dynamic> toLocalMap() {
    return {
      'clientSurveyId': clientSurveyId,
      'serverId': serverId,
      'voterFullName': voterFullName,
      'age': age,
      'gender': gender,
      'mobileNumber': mobileNumber,
      'assemblyConstituency': assemblyConstituency,
      'wardNumber': wardNumber,
      'priorityCivicIssue': priorityCivicIssue,
      'sentimentRating': sentimentRating,
      'surveyorNotes': surveyorNotes,
      'syncStatus': syncStatus,
      'auditStatus': auditStatus,
      'collectedAt': collectedAt.toIso8601String(),
      'syncedAt': syncedAt?.toIso8601String(),
    };
  }

  factory SurveyModel.fromLocalMap(Map<dynamic, dynamic> map) {
    return SurveyModel(
      clientSurveyId: map['clientSurveyId'] as String,
      serverId: map['serverId'] as String?,
      voterFullName: map['voterFullName'] as String,
      age: (map['age'] as num).toInt(),
      gender: map['gender'] as String,
      mobileNumber: map['mobileNumber'] as String,
      assemblyConstituency: map['assemblyConstituency'] as String,
      wardNumber: map['wardNumber'] as String,
      priorityCivicIssue: map['priorityCivicIssue'] as String,
      sentimentRating: map['sentimentRating'] as String,
      surveyorNotes: (map['surveyorNotes'] as String?) ?? '',
      syncStatus: map['syncStatus'] as String,
      auditStatus: (map['auditStatus'] as String?) ?? 'Pending',
      collectedAt: DateTime.parse(map['collectedAt'] as String),
      syncedAt: map['syncedAt'] != null
          ? DateTime.tryParse(map['syncedAt'] as String)
          : null,
    );
  }
}
