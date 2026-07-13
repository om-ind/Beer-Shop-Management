import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/models/misc_models.dart';
import '../../core/providers/auth_provider.dart';

class SuppliersState {
  final bool isLoading;
  final List<SupplierModel> suppliers;
  final String? error;
  const SuppliersState({this.isLoading = false, this.suppliers = const [], this.error});
}

class SuppliersNotifier extends StateNotifier<SuppliersState> {
  final ApiClient _api;
  SuppliersNotifier(this._api) : super(const SuppliersState());

  Future<void> load() async {
    state = const SuppliersState(isLoading: true);
    try {
      final res = await _api.get('/suppliers');
      final list = (res.data as List).map((e) => SupplierModel.fromJson(e)).toList();
      state = SuppliersState(suppliers: list);
    } catch (e) {
      state = SuppliersState(error: e.toString());
    }
  }

  Future<void> add(Map<String, dynamic> data) async {
    try { await _api.post('/suppliers', data: data); await load(); } catch (_) {}
  }

  Future<void> update(int id, Map<String, dynamic> data) async {
    try { await _api.put('/suppliers/$id', data: data); await load(); } catch (_) {}
  }

  Future<void> delete(int id) async {
    try {
      await _api.delete('/suppliers/$id');
      state = SuppliersState(suppliers: state.suppliers.where((s) => s.id != id).toList());
    } catch (_) {}
  }
}

final suppliersProvider = StateNotifierProvider<SuppliersNotifier, SuppliersState>(
  (ref) => SuppliersNotifier(ref.read(apiClientProvider)),
);
