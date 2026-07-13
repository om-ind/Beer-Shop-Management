import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/customer_model.dart';
import '../../core/providers/auth_provider.dart';

class CustomersState {
  final bool isLoading;
  final List<CustomerModel> customers;
  final String? error;

  const CustomersState({this.isLoading = false, this.customers = const [], this.error});
}

class CustomersNotifier extends StateNotifier<CustomersState> {
  final ApiClient _api;
  CustomersNotifier(this._api) : super(const CustomersState());

  Future<void> load() async {
    state = const CustomersState(isLoading: true);
    try {
      final res = await _api.get('/customers');
      final list = (res.data as List).map((e) => CustomerModel.fromJson(e)).toList();
      state = CustomersState(customers: list);
    } catch (e) {
      state = CustomersState(error: e.toString());
    }
  }

  Future<void> add(Map<String, dynamic> data) async {
    try {
      await _api.post('/customers', data: data);
      await load();
    } catch (_) {}
  }

  Future<void> update(int id, Map<String, dynamic> data) async {
    try {
      await _api.put('/customers/$id', data: data);
      await load();
    } catch (_) {}
  }

  Future<void> delete(int id) async {
    try {
      await _api.delete('/customers/$id');
      state = CustomersState(customers: state.customers.where((c) => c.id != id).toList());
    } catch (_) {}
  }
}

final customersProvider = StateNotifierProvider<CustomersNotifier, CustomersState>(
  (ref) => CustomersNotifier(ref.read(apiClientProvider)),
);
