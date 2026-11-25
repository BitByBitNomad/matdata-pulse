import 'package:get/get.dart';
import '../../core/services/connectivity_service.dart';
import '../../data/repositories/auth_repository.dart';
import '../../routes/app_routes.dart';
import '../submissions/submissions_controller.dart';

class HomeController extends GetxController {
  final ConnectivityService connectivity = Get.find<ConnectivityService>();
  final AuthRepository _authRepo = AuthRepository();

  final RxInt currentTabIndex = 0.obs;

  @override
  void onInit() {
    super.onInit();
    // Auto-trigger sync when device transitions back online
    ever<bool>(connectivity.isOnline, (online) {
      if (online && Get.isRegistered<SubmissionsController>()) {
        final subs = Get.find<SubmissionsController>();
        if (subs.pendingCount > 0) {
          subs.syncNow();
        }
      }
    });
  }

  void changeTab(int index) {
    currentTabIndex.value = index;
    if (index == 1 && Get.isRegistered<SubmissionsController>()) {
      Get.find<SubmissionsController>().loadLocalSurveys();
    }
  }

  Future<void> logout() async {
    await _authRepo.logout();
    Get.offAllNamed(AppRoutes.login);
  }
}
