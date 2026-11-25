import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:get/get.dart';

class ConnectivityService extends GetxService {
  final RxBool isOnline = true.obs;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  Future<ConnectivityService> init() async {
    final initial = await Connectivity().checkConnectivity();
    _updateFromResults(initial);

    _subscription = Connectivity().onConnectivityChanged.listen(_updateFromResults);
    return this;
  }

  void _updateFromResults(List<ConnectivityResult> results) {
    final connected = results.any((r) => r != ConnectivityResult.none);
    isOnline.value = connected;
  }

  Future<bool> checkNow() async {
    final results = await Connectivity().checkConnectivity();
    _updateFromResults(results);
    return isOnline.value;
  }

  @override
  void onClose() {
    _subscription?.cancel();
    super.onClose();
  }
}
