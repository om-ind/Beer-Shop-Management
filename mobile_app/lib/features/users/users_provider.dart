import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/providers/auth_provider.dart';

class UsersState {
  final bool isLoading;
  final List<Map<String, dynamic>> users;
  final String? error;
  const UsersState({this.isLoading = false, this.users = const [], this.error});
}

class UsersNotifier extends StateNotifier<UsersState> {
  final ApiClient _api;
  UsersNotifier(this._api) : super(const UsersState());

  Future<void> load() async {
    state = const UsersState(isLoading: true);
    try {
      final res = await _api.get('/users');
      final list = (res.data as List).map((e) => Map<String, dynamic>.from(e)).toList();
      state = UsersState(users: list);
    } catch (e) {
      state = UsersState(error: e.toString());
    }
  }

  Future<void> add(Map<String, dynamic> data) async {
    try { await _api.post('/users', data: data); await load(); } catch (_) {}
  }

  Future<void> update(dynamic id, Map<String, dynamic> data) async {
    try { await _api.put('/users/$id', data: data); await load(); } catch (_) {}
  }

  Future<void> delete(dynamic id) async {
    try {
      await _api.delete('/users/$id');
      state = UsersState(users: state.users.where((u) => u['id'] != id).toList());
    } catch (_) {}
  }
}

final usersProvider = StateNotifierProvider<UsersNotifier, UsersState>(
  (ref) => UsersNotifier(ref.read(apiClientProvider)),
);
