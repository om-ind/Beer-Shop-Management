import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import 'analytics_provider.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(analyticsProvider.notifier).load();
    });
  }

  String _fmtCurrency(double v) =>
      NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(v);

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(analyticsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: state.isLoading
            ? const LoadingShimmer(itemCount: 4, itemHeight: 120)
            : state.error != null
                ? ErrorState(message: state.error!, onRetry: () => ref.read(analyticsProvider.notifier).load())
                : RefreshIndicator(
                    color: AppColors.primary,
                    backgroundColor: AppColors.surface,
                    onRefresh: () => ref.read(analyticsProvider.notifier).load(),
                    child: CustomScrollView(
                      slivers: [
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
                            child: Text('Analytics', style: Theme.of(context).textTheme.displayMedium),
                          ),
                        ),

                        // Weekly Sales Bar Chart
                        if (state.weeklySales.isNotEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                              child: Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                                  border: Border.all(color: AppColors.divider, width: 0.5),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.bar_chart, color: AppColors.primary, size: 20),
                                        const SizedBox(width: 8),
                                        Text('Weekly Sales', style: Theme.of(context).textTheme.headlineSmall),
                                      ],
                                    ),
                                    const SizedBox(height: 20),
                                    SizedBox(
                                      height: 180,
                                      child: BarChart(
                                        BarChartData(
                                          gridData: FlGridData(
                                            show: true,
                                            drawVerticalLine: false,
                                            horizontalInterval: 1000,
                                            getDrawingHorizontalLine: (_) => FlLine(color: AppColors.divider, strokeWidth: 0.5),
                                          ),
                                          titlesData: FlTitlesData(
                                            bottomTitles: AxisTitles(
                                              sideTitles: SideTitles(
                                                showTitles: true,
                                                getTitlesWidget: (value, _) {
                                                  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                                                  return Text(
                                                    days[value.toInt() % 7],
                                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                                  );
                                                },
                                              ),
                                            ),
                                            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                          ),
                                          borderData: FlBorderData(show: false),
                                          barGroups: state.weeklySales
                                              .asMap()
                                              .entries
                                              .map((e) => BarChartGroupData(
                                                    x: e.key,
                                                    barRods: [
                                                      BarChartRodData(
                                                        toY: e.value,
                                                        gradient: AppColors.goldGradient,
                                                        width: 20,
                                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                                                      ),
                                                    ],
                                                  ))
                                              .toList(),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn(delay: 100.ms),
                            ),
                          ),

                        // Monthly trend line chart
                        if (state.monthlySales.isNotEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                              child: Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                                  border: Border.all(color: AppColors.divider, width: 0.5),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.show_chart, color: AppColors.success, size: 20),
                                        const SizedBox(width: 8),
                                        Text('Monthly Sales Trend', style: Theme.of(context).textTheme.headlineSmall),
                                      ],
                                    ),
                                    const SizedBox(height: 20),
                                    SizedBox(
                                      height: 180,
                                      child: LineChart(
                                        LineChartData(
                                          gridData: FlGridData(
                                            show: true,
                                            drawVerticalLine: false,
                                            getDrawingHorizontalLine: (_) => FlLine(color: AppColors.divider, strokeWidth: 0.5),
                                          ),
                                          titlesData: FlTitlesData(
                                            bottomTitles: AxisTitles(
                                              sideTitles: SideTitles(
                                                showTitles: true,
                                                interval: 2,
                                                getTitlesWidget: (v, _) => Text(
                                                  'M${v.toInt() + 1}',
                                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                                                ),
                                              ),
                                            ),
                                            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                          ),
                                          borderData: FlBorderData(show: false),
                                          lineBarsData: [
                                            LineChartBarData(
                                              spots: state.monthlySales
                                                  .asMap()
                                                  .entries
                                                  .map((e) => FlSpot(e.key.toDouble(), e.value))
                                                  .toList(),
                                              isCurved: true,
                                              color: AppColors.success,
                                              barWidth: 3,
                                              dotData: const FlDotData(show: false),
                                              belowBarData: BarAreaData(
                                                show: true,
                                                gradient: LinearGradient(
                                                  colors: [AppColors.success.withOpacity(0.3), Colors.transparent],
                                                  begin: Alignment.topCenter,
                                                  end: Alignment.bottomCenter,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn(delay: 200.ms),
                            ),
                          ),

                        // Top products pie chart
                        if (state.topProducts.isNotEmpty)
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                              child: Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                                  border: Border.all(color: AppColors.divider, width: 0.5),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.pie_chart, color: AppColors.accent, size: 20),
                                        const SizedBox(width: 8),
                                        Text('Top Products by Sales', style: Theme.of(context).textTheme.headlineSmall),
                                      ],
                                    ),
                                    const SizedBox(height: 20),
                                    ...state.topProducts.asMap().entries.take(5).map((entry) {
                                      final colors = [AppColors.primary, AppColors.info, AppColors.success, AppColors.accent, AppColors.warning];
                                      final color = colors[entry.key % colors.length];
                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 10),
                                        child: Row(
                                          children: [
                                            Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                                            const SizedBox(width: 10),
                                            Expanded(child: Text(entry.value['name'] ?? '', style: const TextStyle(color: AppColors.textPrimary, fontSize: 13))),
                                            Text(_fmtCurrency(_toDouble(entry.value['total_qty'])), style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13)),
                                          ],
                                        ),
                                      );
                                    }),
                                  ],
                                ),
                              ).animate().fadeIn(delay: 300.ms),
                            ),
                          ),

                        const SliverToBoxAdapter(child: SizedBox(height: 20)),
                      ],
                    ),
                  ),
      ),
    );
  }

  double _toDouble(dynamic v) =>
      v == null ? 0.0 : double.tryParse(v.toString()) ?? 0.0;
}
