import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import 'reports_provider.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(reportsProvider.notifier).load();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _fmtCurrency(double v) =>
      NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(v);

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reportsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Text('Reports', style: Theme.of(context).textTheme.displayMedium),
            ),
            const SizedBox(height: 16),
            // Tabs
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.divider, width: 0.5),
              ),
              child: TabBar(
                controller: _tabController,
                indicatorColor: AppColors.primary,
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.textSecondary,
                indicatorSize: TabBarIndicatorSize.tab,
                indicator: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                tabs: const [
                  Tab(text: 'Sales'),
                  Tab(text: 'Profit'),
                  Tab(text: 'Summary'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: state.isLoading
                  ? const LoadingShimmer()
                  : TabBarView(
                      controller: _tabController,
                      children: [
                        // Sales Report
                        _ReportTab(
                          items: state.salesReport,
                          emptyTitle: 'No Sales Report',
                          fmtCurrency: _fmtCurrency,
                          valueKey: 'total_amount',
                          labelKey: 'sale_date',
                          color: AppColors.primary,
                          icon: Icons.point_of_sale,
                        ),
                        // Profit Report
                        _ReportTab(
                          items: state.profitReport,
                          emptyTitle: 'No Profit Report',
                          fmtCurrency: _fmtCurrency,
                          valueKey: 'profit',
                          labelKey: 'sale_date',
                          color: AppColors.success,
                          icon: Icons.trending_up,
                        ),
                        // Summary
                        _SummaryTab(data: state.summary, fmtCurrency: _fmtCurrency),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportTab extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final String emptyTitle;
  final String Function(double) fmtCurrency;
  final String valueKey;
  final String labelKey;
  final Color color;
  final IconData icon;

  const _ReportTab({
    required this.items,
    required this.emptyTitle,
    required this.fmtCurrency,
    required this.valueKey,
    required this.labelKey,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return EmptyState(icon: icon, title: emptyTitle);
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final item = items[i];
        final value = _toDouble(item[valueKey]);
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppSizes.cardRadius),
            border: Border.all(color: AppColors.divider, width: 0.5),
          ),
          child: Row(
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  item[labelKey]?.toString() ?? '',
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                ),
              ),
              Text(fmtCurrency(value), style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 14)),
            ],
          ),
        ).animate().fadeIn(delay: (i * 20).ms);
      },
    );
  }

  static double _toDouble(dynamic v) =>
      v == null ? 0.0 : double.tryParse(v.toString()) ?? 0.0;
}

class _SummaryTab extends StatelessWidget {
  final Map<String, dynamic> data;
  final String Function(double) fmtCurrency;
  const _SummaryTab({required this.data, required this.fmtCurrency});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const EmptyState(icon: Icons.summarize_outlined, title: 'No Summary Data');
    return ListView(
      padding: const EdgeInsets.all(20),
      children: data.entries.map((e) {
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppSizes.cardRadius),
            border: Border.all(color: AppColors.divider, width: 0.5),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  e.key.replaceAll('_', ' ').toUpperCase(),
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                ),
              ),
              Text(
                _formatValue(e.value),
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  String _formatValue(dynamic v) {
    if (v is double || v is int) {
      return fmtCurrency((v is int ? v.toDouble() : v as double));
    }
    return v.toString();
  }
}
