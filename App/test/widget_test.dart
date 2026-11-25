import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:matdata_pulse_app/app/core/services/local_storage_service.dart';
import 'package:matdata_pulse_app/app/core/theme/app_theme.dart';
import 'package:matdata_pulse_app/app/data/models/user_model.dart';
import 'package:matdata_pulse_app/app/data/providers/api_provider.dart';
import 'package:matdata_pulse_app/app/modules/auth/auth_binding.dart';
import 'package:matdata_pulse_app/app/modules/auth/auth_view.dart';

class _FakeLocalStorageService extends GetxService implements LocalStorageService {
  @override
  UserModel? getSavedUser() => null;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FakeApiProvider extends GetxService implements ApiProvider {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('AuthView renders login form and demo worker button', (WidgetTester tester) async {
    Get.reset();
    Get.testMode = true;
    Get.put<LocalStorageService>(_FakeLocalStorageService());
    Get.put<ApiProvider>(_FakeApiProvider());

    await tester.pumpWidget(
      GetMaterialApp(
        theme: AppTheme.lightTheme,
        initialBinding: AuthBinding(),
        home: const AuthView(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Matdata Pulse'), findsOneWidget);
    expect(find.text('Sign In to Field Ops'), findsOneWidget);
    expect(find.text('Fill Demo Field Worker Credentials'), findsOneWidget);

    await tester.tap(find.text('Fill Demo Field Worker Credentials'));
    await tester.pump();

    expect(find.text('rohan.field@matdatapulse.in'), findsOneWidget);
  });
}
