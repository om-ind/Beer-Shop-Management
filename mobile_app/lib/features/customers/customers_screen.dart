import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/models/customer_model.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import 'customers_provider.dart';

class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});

  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
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
    final state = ref.watch(customersProvider);
    final filtered = state.customers.where((c) {
      if (_searchQuery.isEmpty) return true;
      return c.name.toLowerCase().contains(_searchQuery) ||
          (c.phone?.contains(_searchQuery) ?? false);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(context, null),
        icon: const Icon(Icons.person_add),
        label: const Text('Add Customer'),
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
                      Text('Customers', style: Theme.of(context).textTheme.displayMedium),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.success.withOpacity(0.3)),
                        ),
                        child: Text(
                          '${filtered.length} customers',
                          style: const TextStyle(color: AppColors.success, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _searchCtrl,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'Search by name or phone...',
                      prefixIcon: Icon(Icons.search),
                    ),
                    onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const LoadingShimmer()
                  : state.error != null
                      ? ErrorState(message: state.error!, onRetry: () => ref.read(customersProvider.notifier).load())
                      : filtered.isEmpty
                          ? EmptyState(
                              icon: Icons.people_outline,
                              title: 'No Customers',
                              subtitle: 'Add your first customer.',
                              actionLabel: 'Add Customer',
                              onAction: () => _showForm(context, null),
                            )
                          : RefreshIndicator(
                              color: AppColors.primary,
                              backgroundColor: AppColors.surface,
                              onRefresh: () => ref.read(customersProvider.notifier).load(),
                              child: ListView.separated(
                                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                                itemCount: filtered.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (ctx, i) {
                                  final c = filtered[i];
                                  return Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: AppColors.surface,
                                      borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                                      border: Border.all(color: AppColors.divider, width: 0.5),
                                    ),
                                    child: Row(
                                      children: [
                                        CircleAvatar(
                                          radius: 24,
                                          backgroundColor: AppColors.primary.withOpacity(0.15),
                                          child: Text(
                                            c.name.isNotEmpty ? c.name[0].toUpperCase() : '?',
                                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 18),
                                          ),
                                        ),
                                        const SizedBox(width: 14),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(c.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary)),
                                              if (c.phone != null)
                                                Text(c.phone!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                            ],
                                          ),
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text(
                                              _fmtCurrency(c.totalPurchases),
                                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.primary),
                                            ),
                                            const Text('total spent', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                          ],
                                        ),
                                        const SizedBox(width: 8),
                                        PopupMenuButton(
                                          icon: const Icon(Icons.more_vert, color: AppColors.textSecondary, size: 18),
                                          itemBuilder: (_) => [
                                            const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 16), SizedBox(width: 8), Text('Edit')])),
                                            const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 16, color: AppColors.error), SizedBox(width: 8), Text('Delete', style: TextStyle(color: AppColors.error))])),
                                          ],
                                          onSelected: (v) {
                                            if (v == 'edit') _showForm(context, c);
                                            if (v == 'delete') _confirmDelete(context, c);
                                          },
                                        ),
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

  void _showForm(BuildContext context, CustomerModel? customer) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        final nameCtrl = TextEditingController(text: customer?.name ?? '');
        final phoneCtrl = TextEditingController(text: customer?.phone ?? '');
        final emailCtrl = TextEditingController(text: customer?.email ?? '');
        final addressCtrl = TextEditingController(text: customer?.address ?? '');
        final formKey = GlobalKey<FormState>();

        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2)))),
                  const SizedBox(height: 20),
                  Text(customer == null ? 'Add Customer' : 'Edit Customer', style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 20),
                  TextFormField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name *'), style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null),
                  const SizedBox(height: 12),
                  TextFormField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone'), keyboardType: TextInputType.phone, style: const TextStyle(color: AppColors.textPrimary)),
                  const SizedBox(height: 12),
                  TextFormField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress, style: const TextStyle(color: AppColors.textPrimary)),
                  const SizedBox(height: 12),
                  TextFormField(controller: addressCtrl, decoration: const InputDecoration(labelText: 'Address'), maxLines: 2, style: const TextStyle(color: AppColors.textPrimary)),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        if (formKey.currentState!.validate()) {
                          Navigator.pop(ctx);
                          final data = {
                            'name': nameCtrl.text,
                            'phone': phoneCtrl.text,
                            'email': emailCtrl.text,
                            'address': addressCtrl.text,
                          };
                          if (customer == null) {
                            ref.read(customersProvider.notifier).add(data);
                          } else {
                            ref.read(customersProvider.notifier).update(customer.id, data);
                          }
                        }
                      },
                      child: Text(customer == null ? 'Add Customer' : 'Save Changes'),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, CustomerModel c) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Customer'),
        content: Text('Delete "${c.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () { Navigator.pop(context); ref.read(customersProvider.notifier).delete(c.id); },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
