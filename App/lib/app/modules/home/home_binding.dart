import 'package:get/get.dart';
import '../submissions/submissions_controller.dart';
import '../survey_form/survey_form_controller.dart';
import 'home_controller.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(() => HomeController());
    Get.lazyPut<SurveyFormController>(() => SurveyFormController());
    Get.lazyPut<SubmissionsController>(() => SubmissionsController());
  }
}
