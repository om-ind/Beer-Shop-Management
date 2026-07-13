import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/models/product_model.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import '../inventory/inventory_provider.dart';
import 'cash_register_provider.dart';

class CashRegisterScreen extends ConsumerStatefulWidget {
  const CashRegisterScreen({super.key});

  @override
  ConsumerState<CashRegisterScreen> createState() => _CashRegisterScreenState();
}

class _CashRegisterScreenState extends ConsumerState<CashRegisterScreen> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';
  String _paymentMethod = 'Cash';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(inventoryProvider.notifier).load();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  String _fmtCurrency(double v) =>
      NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(v);

  @override
  Widget build(BuildContext context) {
    final inventoryState = ref.watch(inventoryProvider);
    final cartState = ref.watch(cashRegisterProvider);

    final filtered = inventoryState.products.where((p) {
      if (_searchQuery.isEmpty) return true;
      return p.name.toLowerCase().contains(_searchQuery) ||
          (p.brand?.toLowerCase().contains(_searchQuery) ?? false);
    }).where((p) => p.stock > 0).toList();

    final subtotal = cartState.items.fold(0.0, (s, i) => s + (i.unitPrice * i.qty));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Row(
                children: [
                  Text('Cash Register', style: Theme.of(context).textTheme.headlineLarge),
                  const Spacer(),
                  if (cartState.items.isNotEmpty)
                    GestureDetector(
                      onTap: () => ref.read(cashRegisterProvider.notifier).clear(),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.error.withOpacity(0.3)),
                        ),
                        child: const Text('Clear', style: TextStyle(color: AppColors.error, fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ),
                ],
              ),
            ),

            // Main content — split
            Expanded(
              child: Row(
                children: [
                  // Left: Product search
                  Expanded(
                    flex: 3,
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: TextField(
                            controller: _searchCtrl,
                            style: const TextStyle(color: AppColors.textPrimary),
                            decoration: const InputDecoration(
                              hintText: 'Search products...',
                              prefixIcon: Icon(Icons.search),
                              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            ),
                            onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Expanded(
                          child: inventoryState.isLoading
                              ? const LoadingShimmer()
                              : ListView.separated(
                                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                                  itemCount: filtered.length,
                                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                                  itemBuilder: (ctx, i) {
                                    final p = filtered[i];
                                    return GestureDetector(
                                      onTap: () => ref.read(cashRegisterProvider.notifier).addItem(p),
                                      child: Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: AppColors.surface,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: AppColors.divider, width: 0.5),
                                        ),
                                        child: Row(
                                          children: [
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                                  Text('Stock: ${p.stock}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                                ],
                                              ),
                                            ),
                                            Text(_fmtCurrency(p.sellingPrice), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                          ],
                                        ),
                                      ).animate().fadeIn(delay: (i * 20).ms),
                                    );
                                  },
                                ),
                        ),
                      ],
                    ),
                  ),

                  // Divider
                  Container(width: 1, color: AppColors.divider),

                  // Right: Cart
                  Expanded(
                    flex: 2,
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text('Cart (${cartState.items.length})', style: Theme.of(context).textTheme.headlineSmall),
                        ),
                        Expanded(
                          child: cartState.items.isEmpty
                              ? const Center(child: Text('Add items\nfrom the left', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)))
                              : ListView.builder(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  itemCount: cartState.items.length,
                                  itemBuilder: (ctx, i) {
                                    final item = cartState.items[i];
                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppColors.surface,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: AppColors.divider, width: 0.5),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(child: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                              GestureDetector(
                                                onTap: () => ref.read(cashRegisterProvider.notifier).removeItem(item.productId),
                                                child: const Icon(Icons.close, size: 16, color: AppColors.error),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              GestureDetector(
                                                onTap: () => ref.read(cashRegisterProvider.notifier).decrementItem(item.productId),
                                                child: Container(
                                                  width: 24, height: 24,
                                                  decoration: BoxDecoration(color: AppColors.surface2, borderRadius: BorderRadius.circular(6)),
                                                  child: const Icon(Icons.remove, size: 14, color: AppColors.textPrimary),
                                                ),
                                              ),
                                              Padding(
                                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                                child: Text('${item.qty}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
                                              ),
                                              GestureDetector(
                                                onTap: () => ref.read(cashRegisterProvider.notifier).incrementItem(item.productId),
                                                child: Container(
                                                  width: 24, height: 24,
                                                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(6)),
                                                  child: const Icon(Icons.add, size: 14, color: Colors.white),
                                                ),
                                              ),
                                              const Spacer(),
                                              Text(_fmtCurrency(item.unitPrice * item.qty), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                            ],
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                        ),

                        // Payment & Total
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: const BoxDecoration(
                            border: Border(top: BorderSide(color: AppColors.divider, width: 0.5)),
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Total', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary, fontSize: 13)),
                                  Text(_fmtCurrency(subtotal), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppColors.primary)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              // Payment method
                              Row(
                                children: ['Cash', 'Card', 'UPI'].map((m) {
                                  final sel = _paymentMethod == m;
                                  return Expanded(
                                    child: GestureDetector(
                                      onTap: () => setState(() => _paymentMethod = m),
                                      child: Container(
                                        margin: const EdgeInsets.only(right: 4),
                                        padding: const EdgeInsets.symmetric(vertical: 6),
                                        decoration: BoxDecoration(
                                          color: sel ? AppColors.primary : AppColors.surface2,
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: sel ? AppColors.primary : AppColors.divider, width: 0.5),
                                        ),
                                        child: Text(m, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: sel ? Colors.white : AppColors.textSecondary)),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 8),
                              SizedBox(
                                width: double.infinity,
                                height: 42,
                                child: ElevatedButton(
                                  onPressed: cartState.items.isEmpty || cartState.isProcessing
                                      ? null
                                      : () => _completeSale(subtotal),
                                  child: cartState.isProcessing
                                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                      : const Text('Complete Sale', style: TextStyle(fontSize: 13)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _completeSale(double subtotal) async {
    final success = await ref.read(cashRegisterProvider.notifier).completeSale(
          paymentMethod: _paymentMethod,
          totalAmount: subtotal,
        );
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle, color: AppColors.success),
              SizedBox(width: 8),
              Text('Sale completed successfully!'),
            ],
          ),
          backgroundColor: AppColors.surface2,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}
