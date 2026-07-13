import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/models/misc_models.dart';
import '../../core/providers/auth_provider.dart';

class PurchasesState {
  final bool isLoading;
  final List<PurchaseModel> purchases;
  final String? error;
  const PurchasesState({this.isLoading = false, this.purchases = const [], this.error});
}

class PurchasesNotifier extends StateNotifier<PurchasesState> {
  final ApiClient _api;
  PurchasesNotifier(this._api) : super(const PurchasesState());

  Future<void> load() async {
    state = const PurchasesState(isLoading: true);
    try {
      final res = await _api.get('/purchases');
      final list = (res.data as List).map((e) => PurchaseModel.fromJson(e)).toList();
      state = PurchasesState(purchases: list);
    } catch (e) {
      state = PurchasesState(error: e.toString());
    }
  }
}

final purchasesProvider = StateNotifierProvider<PurchasesNotifier, PurchasesState>(
  (ref) => PurchasesNotifier(ref.read(apiClientProvider)),
);
