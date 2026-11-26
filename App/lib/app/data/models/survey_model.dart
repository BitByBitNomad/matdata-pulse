import '../../core/constants/app_constants.dart';

class SurveyModel {
  final String clientSurveyId;
  final String? serverId;
  final String? collectorId;
  final String voterFullName;
  final int age;
  final String gender;
  final String mobileNumber;
  final String state;
  final String city;
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
    this.collectorId,
    required this.voterFullName,
    required this.age,
    required this.gender,
    required this.mobileNumber,
    this.state = 'Maharashtra',
    this.city = 'Pune',
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
    String? collectorId,
    String? syncStatus,
    String? auditStatus,
    DateTime? syncedAt,
  }) {
    return SurveyModel(
      clientSurveyId: clientSurveyId,
      serverId: serverId ?? this.serverId,
      collectorId: collectorId ?? this.collectorId,
      voterFullName: voterFullName,
      age: age,
      gender: gender,
      mobileNumber: mobileNumber,
      state: state,
      city: city,
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
      'state': state,
      'city': city,
      'assemblyConstituency': assemblyConstituency,
      'wardNumber': wardNumber,
      'priorityCivicIssue': priorityCivicIssue,
      'sentimentRating': sentimentRating,
      'surveyorNotes': surveyorNotes,
      'collectedAt': collectedAt.toUtc().toIso8601String(),
    };
  }

  /// Hydrates a server record from `GET /api/surveys` into local Hive storage.
  factory SurveyModel.fromApiJson(Map<String, dynamic> json) {
    final serverId = json['id'] as String?;
    final clientId = (json['clientSurveyId'] as String?) ?? serverId ?? '';
    return SurveyModel(
      clientSurveyId: clientId,
      serverId: serverId,
      collectorId: json['collectorId'] as String?,
      voterFullName: json['voterFullName'] as String,
      age: (json['age'] as num).toInt(),
      gender: json['gender'] as String,
      mobileNumber: json['mobileNumber'] as String,
      state: (json['state'] as String?) ?? 'Maharashtra',
      city: (json['city'] as String?) ?? 'Pune',
      assemblyConstituency: json['assemblyConstituency'] as String,
      wardNumber: json['wardNumber'] as String,
      priorityCivicIssue: json['priorityCivicIssue'] as String,
      sentimentRating: json['sentimentRating'] as String,
      surveyorNotes: (json['surveyorNotes'] as String?) ?? '',
      syncStatus: AppConstants.syncStatusSynced,
      auditStatus: (json['auditStatus'] as String?) ?? 'Pending',
      collectedAt: DateTime.parse(json['collectedAt'] as String).toLocal(),
      syncedAt: json['syncedAt'] != null
          ? DateTime.tryParse(json['syncedAt'] as String)?.toLocal()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toLocalMap() {
    return {
      'clientSurveyId': clientSurveyId,
      'serverId': serverId,
      'collectorId': collectorId,
      'voterFullName': voterFullName,
      'age': age,
      'gender': gender,
      'mobileNumber': mobileNumber,
      'state': state,
      'city': city,
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
      collectorId: map['collectorId'] as String?,
      voterFullName: map['voterFullName'] as String,
      age: (map['age'] as num).toInt(),
      gender: map['gender'] as String,
      mobileNumber: map['mobileNumber'] as String,
      state: (map['state'] as String?) ?? 'Maharashtra',
      city: (map['city'] as String?) ?? 'Pune',
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
