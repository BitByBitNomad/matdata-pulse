import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/theme/app_theme.dart';
import '../submissions/submissions_controller.dart';
import '../submissions/submissions_view.dart';
import '../survey_form/survey_form_view.dart';
import 'home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final submissionsCtrl = Get.find<SubmissionsController>();

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Matdata Pulse',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            Text(
              'Field Voter Operations',
              style: TextStyle(fontSize: 11, color: Color(0xFFCBD5E1)),
            ),
          ],
        ),
        actions: [
          Obx(() {
            final online = controller.connectivity.isOnline.value;
            return Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: online
                    ? AppTheme.syncedGreen.withValues(alpha: 0.2)
                    : AppTheme.pendingOrange.withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: online ? AppTheme.syncedGreen : AppTheme.pendingOrange,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    online ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                    size: 14,
                    color: online ? const Color(0xFF6EE7B7) : const Color(0xFFFCD34D),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    online ? 'Online' : 'Offline',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            );
          }),
          IconButton(
            tooltip: 'Sign Out',
            icon: const Icon(Icons.logout_rounded),
            onPressed: controller.logout,
          ),
        ],
      ),
      body: Obx(
        () => IndexedStack(
          index: controller.currentTabIndex.value,
          children: const [
            SurveyFormView(),
            SubmissionsView(),
          ],
        ),
      ),
      bottomNavigationBar: Obx(
        () => NavigationBar(
          selectedIndex: controller.currentTabIndex.value,
          onDestinationSelected: controller.changeTab,
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.assignment_outlined),
              selectedIcon: Icon(Icons.assignment_rounded),
              label: 'Survey Form',
            ),
            NavigationDestination(
              icon: Badge(
                isLabelVisible: submissionsCtrl.pendingCount > 0,
                label: Text('${submissionsCtrl.pendingCount}'),
                child: const Icon(Icons.sync_outlined),
              ),
              selectedIcon: Badge(
                isLabelVisible: submissionsCtrl.pendingCount > 0,
                label: Text('${submissionsCtrl.pendingCount}'),
                child: const Icon(Icons.sync_rounded),
              ),
              label: 'Submissions',
            ),
          ],
        ),
      ),
    );
  }
}
