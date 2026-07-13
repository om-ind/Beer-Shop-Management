import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/models/misc_models.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import 'purchases_provider.dart';

class PurchasesScreen extends ConsumerStatefulWidget {
  const PurchasesScreen({super.key});

  @override
  ConsumerState<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends ConsumerState<PurchasesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(purchasesProvider.notifier).load();
    });
  }

  String _fmtCurrency(double v) =>
      NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(v);

  String _fmtDate(String s) {
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(s));
    } catch (_) {
      return s;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(purchasesProvider);
    final total = state.purchases.fold(0.0, (sum, p) => sum + p.totalAmount);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Purchases', style: Theme.of(context).textTheme.displayMedium),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: AppColors.blueGradient,
                      borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                      boxShadow: [BoxShadow(color: AppColors.info.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.shopping_cart, color: Colors.white, size: 28),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Total Purchases', style: TextStyle(color: Colors.white70, fontSize: 13)),
                            Text(_fmtCurrency(total), style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
                          ],
                        ),
                        const Spacer(),
                        Text('${state.purchases.length} records', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const LoadingShimmer()
                  : state.purchases.isEmpty
                      ? const EmptyState(icon: Icons.shopping_cart_outlined, title: 'No Purchases', subtitle: 'No purchase records found.')
                      : RefreshIndicator(
                          color: AppColors.primary,
                          backgroundColor: AppColors.surface,
                          onRefresh: () => ref.read(purchasesProvider.notifier).load(),
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                            itemCount: state.purchases.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (ctx, i) {
                              final p = state.purchases[i];
                              return Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                                  border: Border.all(color: AppColors.divider, width: 0.5),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(color: AppColors.info.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                                      child: const Icon(Icons.shopping_cart, color: AppColors.info, size: 22),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(p.supplierName ?? 'Unknown Supplier', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary)),
                                          if (p.invoiceNumber != null) Text('Invoice: ${p.invoiceNumber}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                          Text(_fmtDate(p.purchaseDate), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        ],
                                      ),
                                    ),
                                    Text(_fmtCurrency(p.totalAmount), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.info)),
                                  ],
                                ),
                              ).animate().fadeIn(delay: (i * 30).ms).slideX(begin: 0.03);
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
