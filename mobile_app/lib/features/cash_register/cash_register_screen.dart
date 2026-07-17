import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/models/product_model.dart';
import '../../core/models/sale_model.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import '../inventory/inventory_provider.dart';
import '../customers/customers_provider.dart';
import '../../core/utils/pdf_helper.dart';
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
  int? _selectedCustomerId;
  DateTime _saleDate = DateTime.now();

  Future<void> _selectSaleDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _saleDate,
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
    if (picked != null && picked != _saleDate) {
      setState(() {
        _saleDate = picked;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(inventoryProvider.notifier).load();
      ref.read(customersProvider.notifier).load();
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
    final customersState = ref.watch(customersProvider);

    final customers = customersState.customers;
    final selectedCustomerId = _selectedCustomerId ?? (customers.isNotEmpty ? customers.first.id : null);

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
                                    return _CartItemRow(
                                      key: ValueKey(item.productId),
                                      item: item,
                                      onDelete: () => ref.read(cashRegisterProvider.notifier).removeItem(item.productId),
                                      onDecrement: () => ref.read(cashRegisterProvider.notifier).decrementItem(item.productId),
                                      onIncrement: () => ref.read(cashRegisterProvider.notifier).incrementItem(item.productId),
                                      onQtyChanged: (q) => ref.read(cashRegisterProvider.notifier).updateQty(item.productId, q),
                                      onPriceChanged: (p) => ref.read(cashRegisterProvider.notifier).updatePrice(item.productId, p),
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
                              // Customer Selector
                              if (customers.isNotEmpty) ...[
                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text('Customer', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary, fontSize: 12)),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface2,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppColors.divider, width: 0.5),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<int>(
                                      value: selectedCustomerId,
                                      isExpanded: true,
                                      dropdownColor: AppColors.surface,
                                      icon: const Icon(Icons.arrow_drop_down, color: AppColors.textSecondary),
                                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w500),
                                      items: customers.map((c) {
                                        return DropdownMenuItem<int>(
                                          value: c.id,
                                          child: Text(c.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                                        );
                                      }).toList(),
                                      onChanged: (val) {
                                        setState(() => _selectedCustomerId = val);
                                      },
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                              ],

                              // Sale Date Selector
                              const Align(
                                alignment: Alignment.centerLeft,
                                child: Text('Sale Date', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary, fontSize: 12)),
                              ),
                              const SizedBox(height: 4),
                              GestureDetector(
                                onTap: _selectSaleDate,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface2,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppColors.divider, width: 0.5),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.calendar_today, size: 14, color: AppColors.primary),
                                      const SizedBox(width: 8),
                                      Text(
                                        DateFormat('dd MMM yyyy').format(_saleDate),
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
                                      ),
                                      const Spacer(),
                                      const Icon(Icons.arrow_drop_down, size: 16, color: AppColors.textSecondary),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),

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
                                      : () => _completeSale(subtotal, selectedCustomerId),
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

  Future<void> _completeSale(double subtotal, int? customerId) async {
    final cartItems = ref.read(cashRegisterProvider).items;
    for (final item in cartItems) {
      if (item.qty <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Item has invalid quantity.'), backgroundColor: AppColors.error),
        );
        return;
      }
      if (item.unitPrice < 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Item has negative price.'), backgroundColor: AppColors.error),
        );
        return;
      }
    }

    final completedSale = await ref.read(cashRegisterProvider.notifier).completeSale(
          paymentMethod: _paymentMethod,
          totalAmount: subtotal,
          customerId: customerId,
          saleDate: DateFormat('yyyy-MM-dd').format(_saleDate),
        );
    if (completedSale != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
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

      // Prompt to print invoice
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Print Receipt', style: TextStyle(color: AppColors.textPrimary)),
          content: Text('Would you like to print or save the PDF receipt for Invoice ${completedSale.invoiceNo ?? completedSale.id}?', style: const TextStyle(color: AppColors.textSecondary)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
            ),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                PdfHelper.generateAndPrintInvoice(completedSale!);
              },
              icon: const Icon(Icons.print, size: 18),
              label: const Text('Print PDF'),
            ),
          ],
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.error, color: AppColors.error),
              SizedBox(width: 8),
              Text('Failed to complete sale. Please try again.'),
            ],
          ),
          backgroundColor: AppColors.surface2,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

class _CartItemRow extends StatefulWidget {
  final CartItem item;
  final VoidCallback onDelete;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;
  final Function(int) onQtyChanged;
  final Function(double) onPriceChanged;

  const _CartItemRow({
    Key? key,
    required this.item,
    required this.onDelete,
    required this.onDecrement,
    required this.onIncrement,
    required this.onQtyChanged,
    required this.onPriceChanged,
  }) : super(key: key);

  @override
  State<_CartItemRow> createState() => _CartItemRowState();
}

class _CartItemRowState extends State<_CartItemRow> {
  late TextEditingController _qtyCtrl;
  late TextEditingController _priceCtrl;

  @override
  void initState() {
    super.initState();
    _qtyCtrl = TextEditingController(text: widget.item.qty.toString());
    _priceCtrl = TextEditingController(text: widget.item.unitPrice.toStringAsFixed(2));
  }

  @override
  void didUpdateWidget(covariant _CartItemRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.item.qty.toString() != _qtyCtrl.text) {
      _qtyCtrl.text = widget.item.qty.toString();
    }
    if (double.tryParse(_priceCtrl.text) != widget.item.unitPrice) {
      _priceCtrl.text = widget.item.unitPrice.toStringAsFixed(2);
    }
  }

  @override
  void dispose() {
    _qtyCtrl.dispose();
    _priceCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
              Expanded(
                child: Text(
                  widget.item.name,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppColors.textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              GestureDetector(
                onTap: widget.onDelete,
                child: const Icon(Icons.close, size: 16, color: AppColors.error),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              GestureDetector(
                onTap: widget.onDecrement,
                child: Container(
                  width: 24, height: 24,
                  decoration: BoxDecoration(color: AppColors.surface2, borderRadius: BorderRadius.circular(6)),
                  child: const Icon(Icons.remove, size: 14, color: AppColors.textPrimary),
                ),
              ),
              Container(
                width: 38,
                height: 24,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                child: TextField(
                  controller: _qtyCtrl,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.textPrimary),
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.zero,
                    border: InputBorder.none,
                    isDense: true,
                  ),
                  onSubmitted: (val) {
                    final q = int.tryParse(val) ?? widget.item.qty;
                    widget.onQtyChanged(q);
                  },
                ),
              ),
              GestureDetector(
                onTap: widget.onIncrement,
                child: Container(
                  width: 24, height: 24,
                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(6)),
                  child: const Icon(Icons.add, size: 14, color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              const Text('₹', style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
              Container(
                width: 60,
                height: 24,
                margin: const EdgeInsets.only(left: 2),
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: AppColors.surface2,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: TextField(
                  controller: _priceCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: AppColors.textPrimary),
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.symmetric(vertical: 6),
                    border: InputBorder.none,
                    isDense: true,
                  ),
                  onSubmitted: (val) {
                    final p = double.tryParse(val) ?? widget.item.unitPrice;
                    widget.onPriceChanged(p);
                  },
                ),
              ),
              const Spacer(),
              Text(
                NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(widget.item.unitPrice * widget.item.qty),
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
