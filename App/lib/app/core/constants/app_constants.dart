class AppConstants {
  AppConstants._();

  static const String appName = 'Matdata Pulse';
  static const String surveysBox = 'surveys_box';
  static const String authBox = 'auth_box';

  static const List<String> genders = ['Male', 'Female', 'Other'];

  static const List<String> civicIssues = [
    'Water',
    'Roads',
    'Electricity',
    'Healthcare',
    'Employment',
  ];

  static const List<String> sentiments = [
    'Positive',
    'Neutral',
    'Negative',
  ];

  static const List<String> sampleConstituencies = [
    'Shivajinagar',
    'Kothrud',
    'Kasba Peth',
    'Parvati',
    'Pune Cantonment',
    'Hadapsar',
  ];

  static const String syncStatusPending = 'Pending Sync';
  static const String syncStatusSynced = 'Synced';
}
