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
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: AppTheme.borderHairline)),
          ),
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Obx(() {
                final total = controller.totalCount;
                final synced = controller.syncedCount;
                final pending = controller.pendingCount;
                final ratio = total == 0 ? 1.0 : (synced / total);

                return Column(
                  children: [
                    Row(
                      children: [
                        _StatTile(
                          label: 'Captured',
                          count: total,
                          color: AppTheme.navyPrimary,
                        ),
                        const SizedBox(width: 8),
                        _StatTile(
                          label: 'Synced',
                          count: synced,
                          color: AppTheme.syncedGreen,
                        ),
                        const SizedBox(width: 8),
                        _StatTile(
                          label: 'Pending',
                          count: pending,
                          color: AppTheme.pendingOrange,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(99),
                      child: TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: ratio),
                        duration: const Duration(milliseconds: 380),
                        curve: Curves.easeOutCubic,
                        builder: (_, val, __) => LinearProgressIndicator(
                          value: val,
                          minHeight: 5,
                          backgroundColor: AppTheme.pendingOrange.withValues(alpha: 0.2),
                          color: AppTheme.syncedGreen,
                        ),
                      ),
                    ),
                  ],
                );
              }),
              const SizedBox(height: 12),
              Obx(
                () => Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    'All',
                    AppConstants.syncStatusPending,
                    AppConstants.syncStatusSynced,
                  ].map((filter) {
                    final active = controller.filterStatus.value == filter;
                    return ChoiceChip(
                      label: Text(filter, style: const TextStyle(fontSize: 12)),
                      selected: active,
                      visualDensity: VisualDensity.compact,
                      selectedColor: AppTheme.cobaltAccent.withValues(alpha: 0.14),
                      labelStyle: TextStyle(
                        fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                        color: active ? AppTheme.cobaltAccent : const Color(0xFF475569),
                      ),
                      onSelected: (_) => controller.filterStatus.value = filter,
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 10),
              Obx(
                () => ElevatedButton.icon(
                  onPressed: controller.isSyncing.value ? null : controller.syncNow,
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(46),
                    backgroundColor: controller.pendingCount > 0
                        ? AppTheme.cobaltAccent
                        : AppTheme.navyPrimary,
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
                        ? 'Syncing Pending Surveys...'
                        : 'Sync Now (${controller.pendingCount} Pending)',
                    style: const TextStyle(fontSize: 13.5),
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: controller.refreshAndSync,
            child: Obx(() {
              final items = controller.filteredSurveys;
              return AnimatedSwitcher(
                duration: const Duration(milliseconds: 240),
                child: items.isEmpty
                    ? ListView(
                        key: const ValueKey('empty'),
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: const [
                          SizedBox(height: 110),
                          Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(horizontal: 28),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.inbox_outlined,
                                    size: 46,
                                    color: Color(0xFF94A3B8),
                                  ),
                                  SizedBox(height: 12),
                                  Text(
                                    'No captured surveys yet',
                                    style: TextStyle(
                                      fontSize: 15.5,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.navyPrimary,
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    'Submit a voter response in the Survey Form tab. Offline entries queue safely here.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      color: AppTheme.mutedText,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        key: ValueKey('list_${items.length}_${controller.filterStatus.value}'),
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(14),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, index) => _AnimatedSurveyCard(
                          survey: items[index],
                          index: index,
                        ),
                      ),
              );
            }),
          ),
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _StatTile({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(11),
          border: Border.all(color: color.withValues(alpha: 0.16)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
            ),
            const SizedBox(height: 2),
            Text(
              '$count',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AnimatedSurveyCard extends StatefulWidget {
  final SurveyModel survey;
  final int index;

  const _AnimatedSurveyCard({
    required this.survey,
    required this.index,
  });

  @override
  State<_AnimatedSurveyCard> createState() => _AnimatedSurveyCardState();
}

class _AnimatedSurveyCardState extends State<_AnimatedSurveyCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final survey = widget.survey;
    final badgeColor = survey.isSynced ? AppTheme.syncedGreen : AppTheme.pendingOrange;
    final formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(survey.collectedAt);

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 240 + (widget.index.clamp(0, 6) * 45)),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 12 * (1 - value)),
            child: child,
          ),
        );
      },
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => setState(() => _expanded = !_expanded),
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
                              fontWeight: FontWeight.w700,
                              color: AppTheme.navyPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${survey.assemblyConstituency} · ${survey.wardNumber}',
                            style: const TextStyle(fontSize: 12.5, color: Color(0xFF475569)),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            survey.isSynced
                                ? Icons.check_circle_rounded
                                : Icons.schedule_rounded,
                            size: 13.5,
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
                    _TagChip(label: survey.priorityCivicIssue, color: AppTheme.cobaltAccent),
                    const SizedBox(width: 6),
                    _TagChip(
                      label: survey.sentimentRating,
                      color: survey.sentimentRating == 'Positive'
                          ? AppTheme.syncedGreen
                          : survey.sentimentRating == 'Negative'
                              ? AppTheme.errorRed
                              : const Color(0xFF475569),
                    ),
                    const Spacer(),
                    Text(
                      formattedDate,
                      style: const TextStyle(fontSize: 11, color: AppTheme.mutedText),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      _expanded
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      size: 16,
                      color: AppTheme.mutedText,
                    ),
                  ],
                ),
                AnimatedCrossFade(
                  duration: const Duration(milliseconds: 200),
                  crossFadeState: _expanded
                      ? CrossFadeState.showSecond
                      : CrossFadeState.showFirst,
                  firstChild: const SizedBox.shrink(),
                  secondChild: Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFAFBFD),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.borderHairline),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Age ${survey.age} · ${survey.gender} · Mobile ${survey.mobileNumber}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.navyPrimary,
                            ),
                          ),
                          if (survey.surveyorNotes.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              survey.surveyorNotes,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF475569),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
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
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}
