class GeoConstants {
  GeoConstants._();

  static const String customConstituencyOption = 'Other (Enter Manually)';

  /// Canonical State -> City/District -> Assembly Constituency registry.
  /// Prevents AC name collisions (e.g. Shivajinagar in Pune vs Bengaluru).
  static const Map<String, Map<String, List<String>>> indiaHierarchy = {
    'Maharashtra': {
      'Pune': [
        'Shivajinagar',
        'Kothrud',
        'Kasba Peth',
        'Parvati',
        'Pune Cantonment',
        'Vadgaon Sheri',
        'Hadapsar',
        'Khadakwasla',
      ],
      'Mumbai': [
        'Colaba',
        'Malabar Hill',
        'Worli',
        'Bandra West',
        'Andheri West',
        'Andheri East',
        'Borivali',
        'Mulund',
      ],
      'Nagpur': [
        'Nagpur South West',
        'Nagpur South',
        'Nagpur East',
        'Nagpur Central',
        'Nagpur West',
        'Nagpur North',
      ],
      'Nashik': [
        'Nashik East',
        'Nashik Central',
        'Nashik West',
        'Deolali',
        'Igatpuri',
      ],
      'Thane': [
        'Thane',
        'Kopri-Pachpakhadi',
        'Ovala-Majiwada',
        'Airoli',
        'Belapur',
      ],
    },
    'Karnataka': {
      'Bengaluru': [
        'Shivajinagar',
        'Malleshwaram',
        'Jayanagar',
        'Indiranagar (CV Raman Nagar)',
        'Koramangala (BTM Layout)',
        'Hebbal',
      ],
      'Mysuru': [
        'Chamaraja',
        'Krishnaraja',
        'Narasimharaja',
        'Chamundeshwari',
      ],
    },
    'Delhi': {
      'New Delhi': [
        'New Delhi',
        'Karol Bagh',
        'Rajinder Nagar',
        'Greater Kailash',
        'Rohini',
        'Dwarka',
      ],
    },
    'Gujarat': {
      'Ahmedabad': [
        'Ellisbridge',
        'Naranpura',
        'Ghatlodia',
        'Maninagar',
        'Sabarmati',
      ],
      'Surat': [
        'Surat East',
        'Surat North',
        'Surat West',
        'Majura',
        'Katargam',
      ],
    },
  };

  static List<String> get states => indiaHierarchy.keys.toList();

  static List<String> citiesForState(String state) {
    return indiaHierarchy[state]?.keys.toList() ?? [];
  }

  static List<String> constituenciesForCity(String state, String city) {
    return indiaHierarchy[state]?[city] ?? [];
  }
}
