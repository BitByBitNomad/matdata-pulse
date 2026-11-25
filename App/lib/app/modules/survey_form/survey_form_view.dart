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
        padding: const EdgeInsets.all(16),
        children: [
          _SectionCard(
            title: 'Voter Details',
            subtitle: 'Capture citizen demographic & contact details',
            children: [
              TextFormField(
                controller: controller.voterNameController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Voter Full Name *',
                  hintText: 'e.g., Rajeshwari Deshpande',
                  prefixIcon: Icon(Icons.person_outline_rounded),
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
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                      validator: SurveyValidators.validateMobile,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const Text(
                'Gender *',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 6),
              Obx(
                () => Row(
                  children: AppConstants.genders.map((g) {
                    final selected = controller.selectedGender.value == g;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: ChoiceChip(
                          label: Center(child: Text(g)),
                          selected: selected,
                          selectedColor: AppTheme.indigoAccent.withValues(alpha: 0.16),
                          labelStyle: TextStyle(
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            color: selected ? AppTheme.indigoAccent : const Color(0xFF475569),
                          ),
                          onSelected: (_) => controller.selectedGender.value = g,
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
            title: 'Booth & Civic Intelligence',
            subtitle: 'Constituency mapping and voter sentiment',
            children: [
              TextFormField(
                controller: controller.constituencyController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Assembly Constituency *',
                  hintText: 'e.g., Shivajinagar',
                  prefixIcon: Icon(Icons.location_city_rounded),
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
                  prefixIcon: Icon(Icons.map_outlined),
                ),
                validator: (v) => SurveyValidators.validateRequiredField(v, 'Ward Number'),
              ),
              const SizedBox(height: 12),
              Obx(
                () => DropdownButtonFormField<String>(
                  initialValue: controller.selectedIssue.value,
                  decoration: const InputDecoration(
                    labelText: 'Priority Civic Issue *',
                    prefixIcon: Icon(Icons.report_problem_outlined),
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
                        child: ChoiceChip(
                          avatar: Icon(icon, size: 18, color: color),
                          label: Text(sentiment, style: const TextStyle(fontSize: 12)),
                          selected: selected,
                          selectedColor: color.withValues(alpha: 0.14),
                          labelStyle: TextStyle(
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            color: selected ? color : const Color(0xFF475569),
                          ),
                          onSelected: (_) => controller.selectedSentiment.value = sentiment,
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
                  hintText: 'Key citizen feedback, booth observations...',
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
                  : const Icon(Icons.save_alt_rounded),
              label: Text(
                controller.isSubmitting.value
                    ? 'Saving Survey...'
                    : 'Save Survey Entry',
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Widget> children;

  const _SectionCard({
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
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.navyPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }
}
