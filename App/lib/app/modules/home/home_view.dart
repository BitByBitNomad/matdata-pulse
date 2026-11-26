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
        titleSpacing: 16,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Matdata Pulse',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.2,
              ),
            ),
            Text(
              'Booth Survey Collector',
              style: TextStyle(fontSize: 11.5, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
        actions: [
          Obx(() {
            final online = controller.connectivity.isOnline.value;
            return _LiveConnectivityPill(online: online);
          }),
          IconButton(
            tooltip: 'Sign Out',
            icon: const Icon(Icons.logout_rounded, size: 21),
            onPressed: controller.logout,
          ),
        ],
      ),
      body: Obx(
        () => AnimatedSwitcher(
          duration: const Duration(milliseconds: 240),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          transitionBuilder: (child, animation) {
            return FadeTransition(
              opacity: animation,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0.03, 0),
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            );
          },
          child: controller.currentTabIndex.value == 0
              ? const KeyedSubtree(key: ValueKey('tab_form'), child: SurveyFormView())
              : const KeyedSubtree(key: ValueKey('tab_subs'), child: SubmissionsView()),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppTheme.borderHairline)),
        ),
        child: Obx(
          () => NavigationBar(
            selectedIndex: controller.currentTabIndex.value,
            onDestinationSelected: controller.changeTab,
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.assignment_outlined),
                selectedIcon: Icon(Icons.assignment_rounded, color: AppTheme.cobaltAccent),
                label: 'Survey Form',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: submissionsCtrl.pendingCount > 0,
                  backgroundColor: AppTheme.pendingOrange,
                  label: Text('${submissionsCtrl.pendingCount}'),
                  child: const Icon(Icons.cloud_sync_outlined),
                ),
                selectedIcon: Badge(
                  isLabelVisible: submissionsCtrl.pendingCount > 0,
                  backgroundColor: AppTheme.pendingOrange,
                  label: Text('${submissionsCtrl.pendingCount}'),
                  child: const Icon(Icons.cloud_sync_rounded, color: AppTheme.cobaltAccent),
                ),
                label: 'Submissions',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LiveConnectivityPill extends StatefulWidget {
  final bool online;
  const _LiveConnectivityPill({required this.online});

  @override
  State<_LiveConnectivityPill> createState() => _LiveConnectivityPillState();
}

class _LiveConnectivityPillState extends State<_LiveConnectivityPill>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = widget.online
        ? AppTheme.syncedGreen.withValues(alpha: 0.22)
        : AppTheme.pendingOrange.withValues(alpha: 0.25);
    final borderColor = widget.online ? const Color(0xFF10B981) : const Color(0xFFF59E0B);
    final dotColor = widget.online ? const Color(0xFF34D399) : const Color(0xFFFBBF24);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      margin: const EdgeInsets.symmetric(vertical: 12),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor.withValues(alpha: 0.7)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FadeTransition(
            opacity: Tween<double>(begin: 0.4, end: 1.0).animate(_pulseCtrl),
            child: Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            widget.online ? 'Online' : 'Offline',
            style: const TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
