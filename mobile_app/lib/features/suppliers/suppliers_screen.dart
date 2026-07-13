import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/constants/app_constants.dart';
import '../../core/models/misc_models.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import 'suppliers_provider.dart';

class SuppliersScreen extends ConsumerStatefulWidget {
  const SuppliersScreen({super.key});

  @override
  ConsumerState<SuppliersScreen> createState() => _SuppliersScreenState();
}

class _SuppliersScreenState extends ConsumerState<SuppliersScreen> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(suppliersProvider.notifier).load();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(suppliersProvider);
    final filtered = state.suppliers.where((s) {
      if (_searchQuery.isEmpty) return true;
      return s.name.toLowerCase().contains(_searchQuery) ||
          (s.phone?.contains(_searchQuery) ?? false);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(context, null),
        icon: const Icon(Icons.add_business),
        label: const Text('Add Supplier'),
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
                      Text('Suppliers', style: Theme.of(context).textTheme.displayMedium),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.warning.withOpacity(0.3)),
                        ),
                        child: Text('${filtered.length} suppliers', style: const TextStyle(color: AppColors.warning, fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _searchCtrl,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(hintText: 'Search suppliers...', prefixIcon: Icon(Icons.search)),
                    onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const LoadingShimmer()
                  : filtered.isEmpty
                      ? EmptyState(
                          icon: Icons.local_shipping_outlined,
                          title: 'No Suppliers',
                          subtitle: 'Add your first supplier.',
                          actionLabel: 'Add Supplier',
                          onAction: () => _showForm(context, null),
                        )
                      : RefreshIndicator(
                          color: AppColors.primary,
                          backgroundColor: AppColors.surface,
                          onRefresh: () => ref.read(suppliersProvider.notifier).load(),
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (ctx, i) {
                              final s = filtered[i];
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
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: AppColors.warning.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Icon(Icons.local_shipping, color: AppColors.warning, size: 24),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(s.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary)),
                                          if (s.phone != null) Text(s.phone!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                          if (s.contactPerson != null) Text('Contact: ${s.contactPerson}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        ],
                                      ),
                                    ),
                                    PopupMenuButton(
                                      icon: const Icon(Icons.more_vert, color: AppColors.textSecondary, size: 18),
                                      itemBuilder: (_) => [
                                        const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 16), SizedBox(width: 8), Text('Edit')])),
                                        const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 16, color: AppColors.error), SizedBox(width: 8), Text('Delete', style: TextStyle(color: AppColors.error))])),
                                      ],
                                      onSelected: (v) {
                                        if (v == 'edit') _showForm(context, s);
                                        if (v == 'delete') _confirmDelete(context, s);
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

  void _showForm(BuildContext context, SupplierModel? supplier) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        final nameCtrl = TextEditingController(text: supplier?.name ?? '');
        final phoneCtrl = TextEditingController(text: supplier?.phone ?? '');
        final emailCtrl = TextEditingController(text: supplier?.email ?? '');
        final contactCtrl = TextEditingController(text: supplier?.contactPerson ?? '');
        final addressCtrl = TextEditingController(text: supplier?.address ?? '');
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
                  Text(supplier == null ? 'Add Supplier' : 'Edit Supplier', style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 20),
                  TextFormField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Supplier Name *'), style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null),
                  const SizedBox(height: 12),
                  TextFormField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone'), keyboardType: TextInputType.phone, style: const TextStyle(color: AppColors.textPrimary)),
                  const SizedBox(height: 12),
                  TextFormField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress, style: const TextStyle(color: AppColors.textPrimary)),
                  const SizedBox(height: 12),
                  TextFormField(controller: contactCtrl, decoration: const InputDecoration(labelText: 'Contact Person'), style: const TextStyle(color: AppColors.textPrimary)),
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
                          final data = {'name': nameCtrl.text, 'phone': phoneCtrl.text, 'email': emailCtrl.text, 'contact_person': contactCtrl.text, 'address': addressCtrl.text};
                          if (supplier == null) {
                            ref.read(suppliersProvider.notifier).add(data);
                          } else {
                            ref.read(suppliersProvider.notifier).update(supplier.id, data);
                          }
                        }
                      },
                      child: Text(supplier == null ? 'Add Supplier' : 'Save Changes'),
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

  void _confirmDelete(BuildContext context, SupplierModel s) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete Supplier'),
        content: Text('Delete "${s.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () { Navigator.pop(context); ref.read(suppliersProvider.notifier).delete(s.id); },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
