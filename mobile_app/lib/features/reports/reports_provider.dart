import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/providers/auth_provider.dart';

class ReportsState {
  final bool isLoading;
  final List<Map<String, dynamic>> salesReport;
  final List<Map<String, dynamic>> profitReport;
  final Map<String, dynamic> summary;
  final String? error;

  const ReportsState({
    this.isLoading = false,
    this.salesReport = const [],
    this.profitReport = const [],
    this.summary = const {},
    this.error,
  });
}

class ReportsNotifier extends StateNotifier<ReportsState> {
  final ApiClient _api;
  ReportsNotifier(this._api) : super(const ReportsState());

  Future<void> load() async {
    state = const ReportsState(isLoading: true);
    try {
      final res = await _api.get('/reports/summary');
      final data = res.data as Map<String, dynamic>;

      final sales = (data['sales'] as List<dynamic>? ?? [])
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      final profit = (data['profit'] as List<dynamic>? ?? [])
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      final summary = Map<String, dynamic>.from(data['summary'] ?? {});

      state = ReportsState(salesReport: sales, profitReport: profit, summary: summary);
    } catch (e) {
      state = ReportsState(error: e.toString());
    }
  }
}

final reportsProvider = StateNotifierProvider<ReportsNotifier, ReportsState>(
  (ref) => ReportsNotifier(ref.read(apiClientProvider)),
);
