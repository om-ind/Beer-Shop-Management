import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';

import '../../core/api/api_client.dart';
import '../../core/constants/app_constants.dart';
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
  DateTime? _fromDate;
  DateTime? _toDate;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _load();
    });
  }

  void _load() {
    ref.read(salesProvider.notifier).load(
          from: _fromDate != null ? DateFormat('yyyy-MM-dd').format(_fromDate!) : null,
          to: _toDate != null ? DateFormat('yyyy-MM-dd').format(_toDate!) : null,
        );
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

  Future<void> _selectDate(bool isFrom) async {
    final initial = isFrom ? (_fromDate ?? DateTime.now()) : (_toDate ?? DateTime.now());
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: AppColors.primary,
            onPrimary: Colors.white,
            surface: AppColors.surface,
            onSurface: AppColors.textPrimary,
          ),
          dialogBackgroundColor: AppColors.background,
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        if (isFrom) {
          _fromDate = picked;
        } else {
          _toDate = picked;
        }
      });
      _load();
    }
  }

  void _clearDateFilter() {
    setState(() {
      _fromDate = null;
      _toDate = null;
    });
    _load();
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
      if (mounted) Navigator.pop(context);

      final fullSale = SaleModel.fromJson(res.data as Map<String, dynamic>);
      await PdfHelper.generateAndPrintInvoice(fullSale);
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load sale details: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _confirmDelete(int saleId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Sale', style: TextStyle(color: AppColors.textPrimary)),
        content: Text(
          'Delete Sale #$saleId? This will restore stock for all items.',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final ok = await ref.read(salesProvider.notifier).deleteSale(saleId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ok ? 'Sale #$saleId deleted.' : 'Failed to delete sale.'),
            backgroundColor: ok ? AppColors.success : AppColors.error,
            behavior: SnackBarBehavior.floating,
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
                  const SizedBox(height: 12),
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
                  const SizedBox(height: 10),
                  // Date Filter Row
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _selectDate(true),
                          child: _DateChip(
                            label: _fromDate != null
                                ? DateFormat('dd MMM').format(_fromDate!)
                                : 'From date',
                            icon: Icons.calendar_today,
                            active: _fromDate != null,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _selectDate(false),
                          child: _DateChip(
                            label: _toDate != null
                                ? DateFormat('dd MMM').format(_toDate!)
                                : 'To date',
                            icon: Icons.calendar_today,
                            active: _toDate != null,
                          ),
                        ),
                      ),
                      if (_fromDate != null || _toDate != null) ...[
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: _clearDateFilter,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.error.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.error.withOpacity(0.3)),
                            ),
                            child: const Icon(Icons.close, size: 16, color: AppColors.error),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
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
                          onRetry: _load,
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
                              onRefresh: () async => _load(),
                              child: ListView.separated(
                                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                                itemCount: filtered.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (context, i) {
                                  final sale = filtered[i];
                                  return Slidable(
                                    key: ValueKey(sale.id),
                                    endActionPane: ActionPane(
                                      motion: const BehindMotion(),
                                      extentRatio: 0.28,
                                      children: [
                                        SlidableAction(
                                          onPressed: (_) => _confirmDelete(sale.id),
                                          backgroundColor: AppColors.error,
                                          foregroundColor: Colors.white,
                                          icon: Icons.delete_outline,
                                          label: 'Delete',
                                          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                                        ),
                                      ],
                                    ),
                                    child: Container(
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
                                              const SizedBox(width: 6),
                                              IconButton(
                                                icon: const Icon(Icons.edit_calendar, size: 14, color: AppColors.primary),
                                                constraints: const BoxConstraints(),
                                                padding: EdgeInsets.zero,
                                                onPressed: () async {
                                                  final current = DateTime.tryParse(sale.saleDate) ?? DateTime.now();
                                                  final picked = await showDatePicker(
                                                    context: context,
                                                    initialDate: current,
                                                    firstDate: DateTime(2020),
                                                    lastDate: DateTime.now(),
                                                    builder: (context, child) {
                                                      return Theme(
                                                        data: Theme.of(context).copyWith(
                                                          colorScheme: const ColorScheme.dark(
                                                            primary: AppColors.primary,
                                                            onPrimary: Colors.white,
                                                            surface: AppColors.surface,
                                                            onSurface: AppColors.textPrimary,
                                                          ),
                                                          dialogBackgroundColor: AppColors.background,
                                                        ),
                                                        child: child!,
                                                      );
                                                    },
                                                  );
                                                  if (picked != null) {
                                                    final newDateStr = DateFormat('yyyy-MM-dd').format(picked);
                                                    final success = await ref.read(salesProvider.notifier).updateSaleDate(sale.id, newDateStr);
                                                    if (mounted) {
                                                      ScaffoldMessenger.of(context).showSnackBar(
                                                        SnackBar(
                                                          content: Text(success ? 'Sale date updated!' : 'Failed to update sale date.'),
                                                          backgroundColor: success ? AppColors.success : AppColors.error,
                                                        ),
                                                      );
                                                    }
                                                  }
                                                },
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

class _DateChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool active;

  const _DateChip({required this.label, required this.icon, required this.active});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: active ? AppColors.primary.withOpacity(0.12) : AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: active ? AppColors.primary.withOpacity(0.4) : AppColors.divider,
          width: 0.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: active ? AppColors.primary : AppColors.textSecondary),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                color: active ? AppColors.primary : AppColors.textSecondary,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentBadge extends StatelessWidget {
  final String method;
  const _PaymentBadge({required this.method});

  @override
  Widget build(BuildContext context) {
    final m = method.toLowerCase();
    final Color color;
    final IconData icon;

    if (m == 'card') {
      color = AppColors.info;
      icon = Icons.credit_card;
    } else if (m == 'upi') {
      color = const Color(0xFF8B5CF6); // purple
      icon = Icons.qr_code_scanner;
    } else {
      // Cash and everything else
      color = AppColors.success;
      icon = Icons.payments_outlined;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            method,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
