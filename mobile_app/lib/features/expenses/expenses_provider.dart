import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/models/misc_models.dart';
import '../../core/providers/auth_provider.dart';

class ExpensesState {
  final bool isLoading;
  final List<ExpenseModel> expenses;
  final String? error;
  const ExpensesState({this.isLoading = false, this.expenses = const [], this.error});
}

class ExpensesNotifier extends StateNotifier<ExpensesState> {
  final ApiClient _api;
  ExpensesNotifier(this._api) : super(const ExpensesState());

  Future<void> load() async {
    state = const ExpensesState(isLoading: true);
    try {
      final res = await _api.get('/expenses');
      final list = (res.data as List).map((e) => ExpenseModel.fromJson(e)).toList();
      state = ExpensesState(expenses: list);
    } catch (e) {
      state = ExpensesState(error: e.toString());
    }
  }

  Future<void> add(Map<String, dynamic> data) async {
    try { await _api.post('/expenses', data: data); await load(); } catch (_) {}
  }

  Future<void> delete(int id) async {
    try {
      await _api.delete('/expenses/$id');
      state = ExpensesState(expenses: state.expenses.where((e) => e.id != id).toList());
    } catch (_) {}
  }
}

final expensesProvider = StateNotifierProvider<ExpensesNotifier, ExpensesState>(
  (ref) => ExpensesNotifier(ref.read(apiClientProvider)),
);
