import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/sale_model.dart';
import '../../core/providers/auth_provider.dart';

class SalesState {
  final bool isLoading;
  final List<SaleModel> sales;
  final String? error;

  const SalesState({this.isLoading = false, this.sales = const [], this.error});
}

class SalesNotifier extends StateNotifier<SalesState> {
  final ApiClient _api;
  SalesNotifier(this._api) : super(const SalesState());

  Future<void> load() async {
    state = const SalesState(isLoading: true);
    try {
      final res = await _api.get('/sales');
      final list = (res.data as List).map((e) => SaleModel.fromJson(e)).toList();
      state = SalesState(sales: list);
    } catch (e) {
      state = SalesState(error: e.toString());
    }
  }
}

final salesProvider = StateNotifierProvider<SalesNotifier, SalesState>(
  (ref) => SalesNotifier(ref.read(apiClientProvider)),
);
