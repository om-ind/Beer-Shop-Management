import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../shared/widgets/loading_states.dart';
import 'inventory_provider.dart';

class LowStockScreen extends ConsumerStatefulWidget {
  const LowStockScreen({super.key});

  @override
  ConsumerState<LowStockScreen> createState() => _LowStockScreenState();
}

class _LowStockScreenState extends ConsumerState<LowStockScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(inventoryProvider.notifier).load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(inventoryProvider);
    final lowStockItems = state.products.where((p) => p.isLowStock).toList()
      ..sort((a, b) => a.stock.compareTo(b.stock));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Row(
                children: [
                  Text('Low Stock', style: Theme.of(context).textTheme.displayMedium),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.error.withOpacity(0.3)),
                    ),
                    child: Text(
                      '${lowStockItems.length} alerts',
                      style: const TextStyle(color: AppColors.error, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const LoadingShimmer()
                  : lowStockItems.isEmpty
                      ? const EmptyState(
                          icon: Icons.check_circle_outline,
                          title: 'All Stock Levels OK',
                          subtitle: 'No products are below minimum stock.',
                        )
                      : RefreshIndicator(
                          color: AppColors.primary,
                          backgroundColor: AppColors.surface,
                          onRefresh: () => ref.read(inventoryProvider.notifier).load(),
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: lowStockItems.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (ctx, i) {
                              final p = lowStockItems[i];
                              final pct = p.minimumStock > 0 ? (p.stock / p.minimumStock).clamp(0.0, 1.0) : 0.0;
                              return Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                                  border: Border.all(color: AppColors.error.withOpacity(0.35), width: 1),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.warning_amber, color: AppColors.error, size: 20),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            p.name,
                                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary),
                                          ),
                                        ),
                                        Text(
                                          'Stock: ${p.stock}',
                                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.error),
                                        ),
                                      ],
                                    ),
                                    if (p.brand != null)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(p.brand!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                      ),
                                    const SizedBox(height: 12),
                                    LinearProgressIndicator(
                                      value: pct,
                                      backgroundColor: AppColors.surface2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        pct < 0.3 ? AppColors.error : AppColors.warning,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                      minHeight: 6,
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Min required: ${p.minimumStock} units',
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn(delay: (i * 40).ms).slideX(begin: 0.05);
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
