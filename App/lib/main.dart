import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'app/core/services/connectivity_service.dart';
import 'app/core/services/local_storage_service.dart';
import 'app/core/theme/app_theme.dart';
import 'app/data/providers/api_provider.dart';
import 'app/routes/app_pages.dart';
import 'app/routes/app_routes.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final localStorage = await Get.putAsync(() => LocalStorageService().init());
  await Get.putAsync(() => ConnectivityService().init());
  Get.put(ApiProvider().init());

  final hasCachedSession = localStorage.getSavedUser() != null;

  runApp(
    MatdataPulseApp(
      initialRoute: hasCachedSession ? AppRoutes.home : AppRoutes.login,
    ),
  );
}

class MatdataPulseApp extends StatelessWidget {
  final String initialRoute;
  const MatdataPulseApp({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'Matdata Pulse',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: initialRoute,
      getPages: AppPages.pages,
    );
  }
}
