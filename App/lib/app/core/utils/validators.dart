class SurveyValidators {
  SurveyValidators._();

  static final RegExp _wardRegex =
      RegExp(r'^(?:ward\s*[-#]?\s*)?([1-9]\d{0,2})([a-zA-Z]?)$', caseSensitive: false);
  static final RegExp _placeNameRegex =
      RegExp(r'^[A-Za-z][A-Za-z0-9\s\-().]{2,119}$');

  static String? validateName(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return 'Voter full name is required';
    if (trimmed.length < 2) return 'Enter at least 2 characters';
    if (!RegExp(r'[A-Za-z]{2,}').hasMatch(trimmed)) {
      return 'Enter a valid alphabetic voter name';
    }
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

  static String? validateConstituency(String? value) {
    final trimmed = (value ?? '').trim().replaceAll(RegExp(r'\s+'), ' ');
    if (trimmed.isEmpty) return 'Assembly Constituency is required';
    if (trimmed.length < 3) return 'Enter at least 3 characters';
    if (!_placeNameRegex.hasMatch(trimmed)) {
      return 'Start with a letter (no pure numbers or symbols)';
    }
    final letters = RegExp(r'[A-Za-z]').allMatches(trimmed).length;
    if (letters < 3) {
      return 'Must contain at least 3 alphabetic characters';
    }
    final alphaOnly = trimmed.replaceAll(RegExp(r'[^a-zA-Z]'), '').toLowerCase();
    if (alphaOnly.length >= 3 && alphaOnly.split('').toSet().length == 1) {
      return 'Enter a valid Assembly Constituency name';
    }
    return null;
  }

  static String? validateWardNumber(String? value) {
    final trimmed = (value ?? '').trim().replaceAll(RegExp(r'\s+'), ' ');
    if (trimmed.isEmpty) return 'Ward number is required';
    final match = _wardRegex.firstMatch(trimmed);
    if (match == null) {
      return 'Use format "14", "Ward 14", or "14A" (1–300)';
    }
    final num = int.tryParse(match.group(1) ?? '');
    if (num == null || num < 1 || num > 300) {
      return 'Ward number must be between 1 and 300';
    }
    return null;
  }

  /// Normalizes `"14"` or `"ward-14a"` -> `"Ward 14"` / `"Ward 14A"` so analytics don't split.
  static String normalizeWardNumber(String raw) {
    final trimmed = raw.trim().replaceAll(RegExp(r'\s+'), ' ');
    final match = _wardRegex.firstMatch(trimmed);
    if (match == null) return trimmed;
    final num = int.parse(match.group(1)!);
    final suffix = (match.group(2) ?? '').toUpperCase();
    final padded = num < 10 ? '0$num' : '$num';
    return 'Ward $padded$suffix';
  }

  static String? validateRequiredField(String? value, String fieldLabel) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return '$fieldLabel is required';
    return null;
  }
}
