import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import '../../core/utils/pdf_helper.dart';
import '../../core/models/sale_model.dart';
import 'sales_provider.dart';

class SalesScreen extends ConsumerStatefulWidget {
  const SalesScreen({super.key});

  @override
  ConsumerState<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends ConsumerState<SalesScreen> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(salesProvider.notifier).load();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  String _fmtCurrency(double v) =>
      NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(v);

  String _fmtDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy, hh:mm a').format(dt);
    } catch (_) {
      return dateStr;
    }
  }

  Future<void> _printInvoice(WidgetRef ref, SaleModel saleSummary) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );

      final api = ref.read(apiClientProvider);
      final res = await api.get('/sales/${saleSummary.id}');
      if (mounted) Navigator.pop(context); // Dismiss loading spinner

      final fullSale = SaleModel.fromJson(res.data as Map<String, dynamic>);
      await PdfHelper.generateAndPrintInvoice(fullSale);
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Dismiss loading spinner
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load sale details: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final salesState = ref.watch(salesProvider);
    final filtered = salesState.sales.where((s) {
      if (_searchQuery.isEmpty) return true;
      return s.customerName?.toLowerCase().contains(_searchQuery) == true ||
          s.id.toString().contains(_searchQuery);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('Sales', style: Theme.of(context).textTheme.displayMedium),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                        ),
                        child: Text(
                          '${filtered.length} records',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Search
                  TextField(
                    controller: _searchCtrl,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'Search by customer or sale ID...',
                      prefixIcon: Icon(Icons.search),
                    ),
                    onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),

            // List
            Expanded(
              child: salesState.isLoading
                  ? const LoadingShimmer()
                  : salesState.error != null
                      ? ErrorState(
                          message: salesState.error!,
                          onRetry: () => ref.read(salesProvider.notifier).load(),
                        )
                      : filtered.isEmpty
                          ? const EmptyState(
                              icon: Icons.receipt_long_outlined,
                              title: 'No Sales Found',
                              subtitle: 'No sales records match your search.',
                            )
                          : RefreshIndicator(
                              color: AppColors.primary,
                              backgroundColor: AppColors.surface,
                              onRefresh: () => ref.read(salesProvider.notifier).load(),
                              child: ListView.separated(
                                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                                itemCount: filtered.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (context, i) {
                                  final sale = filtered[i];
                                  return Container(
                                    padding: const EdgeInsets.all(16),
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
                                            Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: BoxDecoration(
                                                color: AppColors.primary.withOpacity(0.12),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: const Icon(
                                                Icons.receipt,
                                                color: AppColors.primary,
                                                size: 20,
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    sale.customerName ?? 'Walk-in Customer',
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.w600,
                                                      fontSize: 15,
                                                      color: AppColors.textPrimary,
                                                    ),
                                                  ),
                                                  Text(
                                                    'Sale #${sale.id}',
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      color: AppColors.textSecondary,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Text(
                                              _fmtCurrency(sale.totalAmount),
                                              style: const TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.w700,
                                                color: AppColors.primary,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 10),
                                        const Divider(),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            const Icon(Icons.access_time, size: 13, color: AppColors.textSecondary),
                                            const SizedBox(width: 4),
                                            Text(
                                              _fmtDate(sale.saleDate),
                                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                            ),
                                            const Spacer(),
                                            _PaymentBadge(method: sale.paymentMethod),
                                            const SizedBox(width: 8),
                                            IconButton(
                                              icon: const Icon(Icons.picture_as_pdf, color: AppColors.primary, size: 18),
                                              onPressed: () => _printInvoice(ref, sale),
                                              constraints: const BoxConstraints(),
                                              padding: EdgeInsets.zero,
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ).animate().fadeIn(delay: (i * 40).ms).slideY(begin: 0.05);
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

class _PaymentBadge extends StatelessWidget {
  final String method;
  const _PaymentBadge({required this.method});

  @override
  Widget build(BuildContext context) {
    final isCard = method.toLowerCase() == 'card';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isCard ? AppColors.info.withOpacity(0.12) : AppColors.success.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isCard ? AppColors.info.withOpacity(0.3) : AppColors.success.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isCard ? Icons.credit_card : Icons.payments_outlined,
            size: 12,
            color: isCard ? AppColors.info : AppColors.success,
          ),
          const SizedBox(width: 4),
          Text(
            method,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isCard ? AppColors.info : AppColors.success,
            ),
          ),
        ],
      ),
    );
  }
}
