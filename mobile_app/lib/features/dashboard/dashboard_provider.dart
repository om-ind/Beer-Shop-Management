import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/models/dashboard_stats.dart';
import '../../core/providers/auth_provider.dart';

class DashboardState {
  final bool isLoading;
  final DashboardStats? stats;
  final String? error;

  const DashboardState({
    this.isLoading = false,
    this.stats,
    this.error,
  });

  DashboardState copyWith({
    bool? isLoading,
    DashboardStats? stats,
    String? error,
  }) =>
      DashboardState(
        isLoading: isLoading ?? this.isLoading,
        stats: stats ?? this.stats,
        error: error,
      );
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  final ApiClient _api;

  DashboardNotifier(this._api) : super(const DashboardState());

  Future<void> load() async {
    state = const DashboardState(isLoading: true);
    try {
      final response = await _api.get('/dashboard');
      final stats = DashboardStats.fromJson(response.data);
      state = DashboardState(stats: stats);
    } catch (e) {
      state = DashboardState(error: e.toString());
    }
  }
}

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>(
  (ref) => DashboardNotifier(ref.read(apiClientProvider)),
);
