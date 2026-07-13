import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/product_model.dart';
import '../../core/providers/auth_provider.dart';

class InventoryState {
  final bool isLoading;
  final List<ProductModel> products;
  final String? error;

  const InventoryState({this.isLoading = false, this.products = const [], this.error});
}

class InventoryNotifier extends StateNotifier<InventoryState> {
  final ApiClient _api;
  InventoryNotifier(this._api) : super(const InventoryState());

  Future<void> load() async {
    state = const InventoryState(isLoading: true);
    try {
      final res = await _api.get('/inventory');
      final list = (res.data as List).map((e) => ProductModel.fromJson(e)).toList();
      state = InventoryState(products: list);
    } catch (e) {
      state = InventoryState(error: e.toString());
    }
  }

  Future<void> add(Map<String, dynamic> data) async {
    try {
      await _api.post('/inventory', data: data);
      await load();
    } catch (_) {}
  }

  Future<void> update(int id, Map<String, dynamic> data) async {
    try {
      await _api.put('/inventory/$id', data: data);
      await load();
    } catch (_) {}
  }

  Future<void> delete(int id) async {
    try {
      await _api.delete('/inventory/$id');
      state = InventoryState(products: state.products.where((p) => p.id != id).toList());
    } catch (_) {}
  }
}

final inventoryProvider = StateNotifierProvider<InventoryNotifier, InventoryState>(
  (ref) => InventoryNotifier(ref.read(apiClientProvider)),
);
