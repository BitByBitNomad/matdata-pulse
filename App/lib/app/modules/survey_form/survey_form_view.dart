import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validators.dart';
import 'survey_form_controller.dart';

class SurveyFormView extends GetView<SurveyFormController> {
  const SurveyFormView({super.key});

  @override
  Widget build(BuildContext context) {
    return Form(
      key: controller.formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
        children: [
          _CompletionHeader(controller: controller),
          const SizedBox(height: 14),
          _SectionCard(
            stepNumber: '1',
            title: 'Citizen Identity',
            subtitle: 'Demographics and contact verification',
            children: [
              TextFormField(
                controller: controller.voterNameController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Voter Full Name *',
                  hintText: 'e.g., Rajeshwari Deshpande',
                  prefixIcon: Icon(Icons.person_outline_rounded, size: 20),
                ),
                validator: SurveyValidators.validateName,
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: controller.ageController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(3),
                      ],
                      decoration: const InputDecoration(
                        labelText: 'Age *',
                        hintText: '18–120',
                      ),
                      validator: SurveyValidators.validateAge,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      controller: controller.mobileController,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                      decoration: const InputDecoration(
                        labelText: '10-Digit Mobile *',
                        hintText: '98XXXXXXXX',
                        prefixIcon: Icon(Icons.phone_outlined, size: 20),
                      ),
                      validator: SurveyValidators.validateMobile,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'Gender *',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 8),
              Obx(
                () => Row(
                  children: AppConstants.genders.map((g) {
                    final selected = controller.selectedGender.value == g;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: _AnimatedOptionTile(
                          label: g,
                          selected: selected,
                          activeColor: AppTheme.cobaltAccent,
                          onTap: () => controller.selectedGender.value = g,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _SectionCard(
            stepNumber: '2',
            title: 'Booth & Civic Pulse',
            subtitle: 'Constituency, priority issue, and citizen mood',
            children: [
              TextFormField(
                controller: controller.constituencyController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Assembly Constituency *',
                  hintText: 'e.g., Shivajinagar',
                  prefixIcon: Icon(Icons.location_city_rounded, size: 20),
                ),
                validator: (v) =>
                    SurveyValidators.validateRequiredField(v, 'Assembly Constituency'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: controller.wardController,
                decoration: const InputDecoration(
                  labelText: 'Ward Number *',
                  hintText: 'e.g., Ward 14',
                  prefixIcon: Icon(Icons.map_outlined, size: 20),
                ),
                validator: (v) => SurveyValidators.validateRequiredField(v, 'Ward Number'),
              ),
              const SizedBox(height: 12),
              Obx(
                () => DropdownButtonFormField<String>(
                  initialValue: controller.selectedIssue.value,
                  decoration: const InputDecoration(
                    labelText: 'Priority Civic Issue *',
                    prefixIcon: Icon(Icons.report_problem_outlined, size: 20),
                  ),
                  items: AppConstants.civicIssues
                      .map((issue) => DropdownMenuItem(value: issue, child: Text(issue)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) controller.selectedIssue.value = val;
                  },
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Sentiment Rating *',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 8),
              Obx(
                () => Row(
                  children: AppConstants.sentiments.map((sentiment) {
                    final selected = controller.selectedSentiment.value == sentiment;
                    final color = sentiment == 'Positive'
                        ? AppTheme.syncedGreen
                        : sentiment == 'Negative'
                            ? AppTheme.errorRed
                            : const Color(0xFF475569);
                    final icon = sentiment == 'Positive'
                        ? Icons.sentiment_satisfied_alt_rounded
                        : sentiment == 'Negative'
                            ? Icons.sentiment_dissatisfied_rounded
                            : Icons.sentiment_neutral_rounded;

                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: _AnimatedOptionTile(
                          label: sentiment,
                          icon: icon,
                          selected: selected,
                          activeColor: color,
                          onTap: () => controller.selectedSentiment.value = sentiment,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: controller.notesController,
                maxLines: 3,
                maxLength: 500,
                decoration: const InputDecoration(
                  labelText: 'Surveyor Notes',
                  hintText: 'Key citizen feedback or booth remarks...',
                  alignLabelWithHint: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Obx(
            () => ElevatedButton.icon(
              onPressed: controller.isSubmitting.value ? null : controller.submitSurvey,
              icon: controller.isSubmitting.value
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.check_circle_outline_rounded, size: 20),
              label: Text(
                controller.isSubmitting.value ? 'Saving Entry...' : 'Save Survey Entry',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CompletionHeader extends StatelessWidget {
  final SurveyFormController controller;
  const _CompletionHeader({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final pct = (controller.completionRatio.value * 100).round();
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderHairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'New Household Survey',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.navyPrimary,
                  ),
                ),
                Text(
                  '$pct% ready',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.cobaltAccent,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: controller.completionRatio.value),
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOutCubic,
                builder: (_, val, __) => LinearProgressIndicator(
                  value: val,
                  minHeight: 6,
                  backgroundColor: const Color(0xFFE2E8F0),
                  color: val >= 0.99 ? AppTheme.syncedGreen : AppTheme.cobaltAccent,
                ),
              ),
            ),
          ],
        ),
      );
    });
  }
}

class _SectionCard extends StatelessWidget {
  final String stepNumber;
  final String title;
  final String subtitle;
  final List<Widget> children;

  const _SectionCard({
    required this.stepNumber,
    required this.title,
    required this.subtitle,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppTheme.navyPrimary,
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: Text(
                    stepNumber,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.navyPrimary,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: const TextStyle(fontSize: 12, color: AppTheme.mutedText),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _AnimatedOptionTile extends StatelessWidget {
  final String label;
  final IconData? icon;
  final bool selected;
  final Color activeColor;
  final VoidCallback onTap;

  const _AnimatedOptionTile({
    required this.label,
    this.icon,
    required this.selected,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(11),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 6),
          decoration: BoxDecoration(
            color: selected ? activeColor.withValues(alpha: 0.1) : const Color(0xFFFAFBFD),
            borderRadius: BorderRadius.circular(11),
            border: Border.all(
              color: selected ? activeColor : AppTheme.borderHairline,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  size: 16,
                  color: selected ? activeColor : AppTheme.mutedText,
                ),
                const SizedBox(width: 4),
              ],
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    color: selected ? activeColor : const Color(0xFF475569),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
