import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/models/product_model.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import 'inventory_provider.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';
  String _sortBy = 'name';

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
    final state = ref.watch(inventoryProvider);
    var filtered = state.products.where((p) {
      if (_searchQuery.isEmpty) return true;
      return p.name.toLowerCase().contains(_searchQuery) ||
          (p.brand?.toLowerCase().contains(_searchQuery) ?? false);
    }).toList();

    // Sort
    filtered.sort((a, b) {
      switch (_sortBy) {
        case 'stock':
          return a.stock.compareTo(b.stock);
        case 'price':
          return a.sellingPrice.compareTo(b.sellingPrice);
        default:
          return a.name.compareTo(b.name);
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddProduct(context),
        icon: const Icon(Icons.add),
        label: const Text('Add Product'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('Inventory', style: Theme.of(context).textTheme.displayMedium),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                        ),
                        child: Text(
                          '${filtered.length} items',
                          style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _searchCtrl,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'Search products...',
                      prefixIcon: Icon(Icons.search),
                    ),
                    onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
                  ),
                  const SizedBox(height: 10),
                  // Sort chips
                  Row(
                    children: ['name', 'stock', 'price'].map((s) {
                      final isSelected = _sortBy == s;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _sortBy = s),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primary : AppColors.surface2,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSelected ? AppColors.primary : AppColors.divider,
                                width: 0.5,
                              ),
                            ),
                            child: Text(
                              s[0].toUpperCase() + s.substring(1),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: isSelected ? AppColors.textOnPrimary : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const LoadingShimmer()
                  : state.error != null
                      ? ErrorState(message: state.error!, onRetry: () => ref.read(inventoryProvider.notifier).load())
                      : filtered.isEmpty
                          ? EmptyState(
                              icon: Icons.inventory_2_outlined,
                              title: 'No Products',
                              subtitle: 'Add your first product to get started.',
                              actionLabel: 'Add Product',
                              onAction: () => _showAddProduct(context),
                            )
                          : RefreshIndicator(
                              color: AppColors.primary,
                              backgroundColor: AppColors.surface,
                              onRefresh: () => ref.read(inventoryProvider.notifier).load(),
                              child: ListView.separated(
                                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                                itemCount: filtered.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (ctx, i) {
                                  final p = filtered[i];
                                  return _ProductTile(
                                    product: p,
                                    fmtCurrency: _fmtCurrency,
                                    onEdit: () => _showEditProduct(context, p),
                                    onDelete: () => _confirmDelete(context, p),
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

  void _showAddProduct(BuildContext context) {
    _showProductDialog(context, null);
  }

  void _showEditProduct(BuildContext context, ProductModel p) {
    _showProductDialog(context, p);
  }

  void _showProductDialog(BuildContext context, ProductModel? product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _ProductForm(
        product: product,
        onSave: (data) {
          Navigator.pop(ctx);
          if (product == null) {
            ref.read(inventoryProvider.notifier).add(data);
          } else {
            ref.read(inventoryProvider.notifier).update(product.id, data);
          }
        },
      ),
    );
  }

  void _confirmDelete(BuildContext context, ProductModel p) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Product'),
        content: Text('Are you sure you want to delete "${p.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(inventoryProvider.notifier).delete(p.id);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _ProductTile extends StatelessWidget {
  final ProductModel product;
  final String Function(double) fmtCurrency;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ProductTile({
    required this.product,
    required this.fmtCurrency,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isLow = product.isLowStock;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        border: Border.all(
          color: isLow ? AppColors.error.withOpacity(0.4) : AppColors.divider,
          width: isLow ? 1 : 0.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isLow ? AppColors.error.withOpacity(0.1) : AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.local_bar,
                  color: isLow ? AppColors.error : AppColors.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(product.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary)),
                    if (product.brand != null)
                      Text(product.brand!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              PopupMenuButton(
                icon: const Icon(Icons.more_vert, color: AppColors.textSecondary, size: 20),
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 16), SizedBox(width: 8), Text('Edit')])),
                  const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 16, color: AppColors.error), SizedBox(width: 8), Text('Delete', style: TextStyle(color: AppColors.error))])),
                ],
                onSelected: (v) {
                  if (v == 'edit') onEdit();
                  if (v == 'delete') onDelete();
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _Tag(label: 'Stock: ${product.stock}', color: isLow ? AppColors.error : AppColors.success),
              const SizedBox(width: 8),
              _Tag(label: 'Min: ${product.minimumStock}', color: AppColors.textSecondary),
              const Spacer(),
              Text(fmtCurrency(product.sellingPrice), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary)),
            ],
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;
  final Color color;
  const _Tag({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    );
  }
}

class _ProductForm extends StatefulWidget {
  final ProductModel? product;
  final Function(Map<String, dynamic>) onSave;
  const _ProductForm({this.product, required this.onSave});

  @override
  State<_ProductForm> createState() => _ProductFormState();
}

class _ProductFormState extends State<_ProductForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _brand;
  late final TextEditingController _category;
  late final TextEditingController _purchasePrice;
  late final TextEditingController _sellingPrice;
  late final TextEditingController _stock;
  late final TextEditingController _minStock;

  @override
  void initState() {
    super.initState();
    final p = widget.product;
    _name = TextEditingController(text: p?.name ?? '');
    _brand = TextEditingController(text: p?.brand ?? '');
    _category = TextEditingController(text: p?.category ?? '');
    _purchasePrice = TextEditingController(text: p?.purchasePrice.toString() ?? '');
    _sellingPrice = TextEditingController(text: p?.sellingPrice.toString() ?? '');
    _stock = TextEditingController(text: p?.stock.toString() ?? '');
    _minStock = TextEditingController(text: p?.minimumStock.toString() ?? '0');
  }

  @override
  void dispose() {
    for (final c in [_name, _brand, _category, _purchasePrice, _sellingPrice, _stock, _minStock]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 20),
              Text(widget.product == null ? 'Add Product' : 'Edit Product', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 20),
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Product Name *'),
                style: const TextStyle(color: AppColors.textPrimary),
                validator: (v) => v?.isEmpty == true ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: TextFormField(controller: _brand, decoration: const InputDecoration(labelText: 'Brand'), style: const TextStyle(color: AppColors.textPrimary))),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _category, decoration: const InputDecoration(labelText: 'Category'), style: const TextStyle(color: AppColors.textPrimary))),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: TextFormField(controller: _purchasePrice, decoration: const InputDecoration(labelText: 'Purchase Price *'), keyboardType: TextInputType.number, style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null)),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _sellingPrice, decoration: const InputDecoration(labelText: 'Selling Price *'), keyboardType: TextInputType.number, style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null)),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: TextFormField(controller: _stock, decoration: const InputDecoration(labelText: 'Stock *'), keyboardType: TextInputType.number, style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null)),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _minStock, decoration: const InputDecoration(labelText: 'Min Stock'), keyboardType: TextInputType.number, style: const TextStyle(color: AppColors.textPrimary))),
              ]),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      widget.onSave({
                        'name': _name.text,
                        'brand': _brand.text,
                        'category': _category.text,
                        'purchase_price': double.tryParse(_purchasePrice.text) ?? 0,
                        'selling_price': double.tryParse(_sellingPrice.text) ?? 0,
                        'stock': int.tryParse(_stock.text) ?? 0,
                        'minimum_stock': int.tryParse(_minStock.text) ?? 0,
                      });
                    }
                  },
                  child: Text(widget.product == null ? 'Add Product' : 'Save Changes'),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
