class SurveyValidators {
  SurveyValidators._();

  static String? validateName(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return 'Voter full name is required';
    if (trimmed.length < 2) return 'Enter at least 2 characters';
    return null;
  }

  static String? validateAge(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return 'Age is required';
    final age = int.tryParse(trimmed);
    if (age == null) return 'Enter a valid numeric age';
    if (age < 18 || age > 120) return 'Voter age must be between 18 and 120';
    return null;
  }

  static String? validateMobile(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return '10-digit mobile number is required';
    if (!RegExp(r'^\d{10}$').hasMatch(trimmed)) {
      return 'Enter a valid 10-digit mobile number';
    }
    return null;
  }

  static String? validateRequiredField(String? value, String fieldLabel) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return '$fieldLabel is required';
    return null;
  }
}
