import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/survey_model.dart';
import 'submissions_controller.dart';

class SubmissionsView extends GetView<SubmissionsController> {
  const SubmissionsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Column(
            children: [
              Obx(
                () => Row(
                  children: [
                    _StatPill(
                      label: 'Total',
                      count: controller.totalCount,
                      color: AppTheme.navyPrimary,
                    ),
                    const SizedBox(width: 8),
                    _StatPill(
                      label: 'Synced',
                      count: controller.syncedCount,
                      color: AppTheme.syncedGreen,
                    ),
                    const SizedBox(width: 8),
                    _StatPill(
                      label: 'Pending',
                      count: controller.pendingCount,
                      color: AppTheme.pendingOrange,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Obx(
                      () => SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            'All',
                            AppConstants.syncStatusPending,
                            AppConstants.syncStatusSynced,
                          ].map((filter) {
                            final active = controller.filterStatus.value == filter;
                            return Padding(
                              padding: const EdgeInsets.only(right: 6),
                              child: FilterChip(
                                label: Text(filter, style: const TextStyle(fontSize: 12)),
                                selected: active,
                                onSelected: (_) => controller.filterStatus.value = filter,
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Obx(
                    () => ElevatedButton.icon(
                      onPressed: controller.isSyncing.value ? null : controller.syncNow,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        backgroundColor: controller.pendingCount > 0
                            ? AppTheme.indigoAccent
                            : const Color(0xFF475569),
                      ),
                      icon: controller.isSyncing.value
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.cloud_upload_outlined, size: 18),
                      label: Text(
                        controller.isSyncing.value
                            ? 'Syncing...'
                            : 'Sync Now (${controller.pendingCount})',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: RefreshIndicator(
            onRefresh: controller.refreshAndSync,
            child: Obx(() {
              final items = controller.filteredSurveys;
              if (items.isEmpty) {
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    SizedBox(height: 120),
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.inbox_outlined, size: 48, color: Color(0xFF94A3B8)),
                          SizedBox(height: 10),
                          Text(
                            'No captured surveys yet',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF475569),
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Submit a voter survey in the Form tab to get started.',
                            style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              }

              return ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(14),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, index) => _SurveyCard(survey: items[index]),
              );
            }),
          ),
        ),
      ],
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _StatPill({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
            ),
            Text(
              '$count',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ),
    );
  }
}

class _SurveyCard extends StatelessWidget {
  final SurveyModel survey;
  const _SurveyCard({required this.survey});

  @override
  Widget build(BuildContext context) {
    final badgeColor = survey.isSynced ? AppTheme.syncedGreen : AppTheme.pendingOrange;
    final formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(survey.collectedAt);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        survey.voterFullName,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.navyPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${survey.assemblyConstituency} · ${survey.wardNumber}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: badgeColor.withValues(alpha: 0.35)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        survey.isSynced
                            ? Icons.check_circle_rounded
                            : Icons.schedule_rounded,
                        size: 14,
                        color: badgeColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        survey.syncStatus,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: badgeColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _TagChip(label: survey.priorityCivicIssue, color: AppTheme.indigoAccent),
                const SizedBox(width: 6),
                _TagChip(
                  label: survey.sentimentRating,
                  color: survey.sentimentRating == 'Positive'
                      ? AppTheme.syncedGreen
                      : survey.sentimentRating == 'Negative'
                          ? AppTheme.errorRed
                          : const Color(0xFF64748B),
                ),
                const Spacer(),
                Text(
                  formattedDate,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TagChip extends StatelessWidget {
  final String label;
  final Color color;
  const _TagChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}
