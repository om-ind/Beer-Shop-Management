import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/models/shop_model.dart';
import '../../core/providers/shops_provider.dart';
import '../../shared/widgets/loading_states.dart';

final currencyFmt = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');

class ShopsScreen extends ConsumerStatefulWidget {
  const ShopsScreen({super.key});

  @override
  ConsumerState<ShopsScreen> createState() => _ShopsScreenState();
}

class _ShopsScreenState extends ConsumerState<ShopsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(shopsProvider.notifier).loadShopsData());
  }

  void _showCreateShopModal() {
    final formKey = GlobalKey<FormState>();
    final nameCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final ownerNameCtrl = TextEditingController();
    final ownerUserCtrl = TextEditingController();
    final ownerPassCtrl = TextEditingController();
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.divider,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.store, color: AppColors.primary),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Create New Shop',
                                style: Theme.of(modalCtx).textTheme.headlineSmall,
                              ),
                              const Text(
                                'Add a shop & set initial owner account',
                                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Section 1: Shop Details
                      const Text(
                        'SHOP DETAILS',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextFormField(
                        controller: nameCtrl,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Shop Name *',
                          prefixIcon: Icon(Icons.storefront_outlined),
                        ),
                        validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: addressCtrl,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Address',
                          prefixIcon: Icon(Icons.location_on_outlined),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: phoneCtrl,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Phone',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: ownerNameCtrl,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Owner Full Name *',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                      ),

                      const SizedBox(height: 20),
                      // Section 2: Owner Login Credentials
                      const Text(
                        'OWNER LOGIN CREDENTIALS',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextFormField(
                        controller: ownerUserCtrl,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Owner Username *',
                          prefixIcon: Icon(Icons.account_circle_outlined),
                        ),
                        validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: ownerPassCtrl,
                        obscureText: true,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Owner Password * (min 6 chars)',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                        validator: (v) => (v == null || v.length < 6) ? 'Min 6 characters required' : null,
                      ),

                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: saving
                              ? null
                              : () async {
                                  if (!formKey.currentState!.validate()) return;
                                  setModalState(() => saving = true);

                                  final res = await ref.read(shopsProvider.notifier).createShop({
                                    'name': nameCtrl.text.trim(),
                                    'address': addressCtrl.text.trim(),
                                    'phone': phoneCtrl.text.trim(),
                                    'owner_name': ownerNameCtrl.text.trim(),
                                    'owner_username': ownerUserCtrl.text.trim(),
                                    'owner_password': ownerPassCtrl.text,
                                  });

                                  if (modalCtx.mounted) {
                                    Navigator.pop(modalCtx);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(res['message'] ?? ''),
                                        backgroundColor: res['success'] == true ? AppColors.success : AppColors.error,
                                      ),
                                    );
                                  }
                                },
                          child: saving
                              ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                              : const Text('Create Shop'),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showEditShopModal(ShopModel shop) {
    final formKey = GlobalKey<FormState>();
    final nameCtrl = TextEditingController(text: shop.name);
    final addressCtrl = TextEditingController(text: shop.address);
    final phoneCtrl = TextEditingController(text: shop.phone);
    final ownerNameCtrl = TextEditingController(text: shop.ownerName);
    bool isActive = shop.isActive;
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.divider,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text('Edit Shop Details', style: Theme.of(modalCtx).textTheme.headlineSmall),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: nameCtrl,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Shop Name *',
                          prefixIcon: Icon(Icons.storefront_outlined),
                        ),
                        validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: addressCtrl,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Address',
                          prefixIcon: Icon(Icons.location_on_outlined),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: phoneCtrl,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Phone',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: ownerNameCtrl,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Owner Name',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SwitchListTile(
                        value: isActive,
                        onChanged: (val) => setModalState(() => isActive = val),
                        title: const Text('Active Shop Status', style: TextStyle(color: AppColors.textPrimary)),
                        subtitle: Text(
                          isActive ? 'Shop is enabled & operational' : 'Shop is deactivated',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                        activeThumbColor: AppColors.success,
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: saving
                              ? null
                              : () async {
                                  if (!formKey.currentState!.validate()) return;
                                  setModalState(() => saving = true);

                                  final res = await ref.read(shopsProvider.notifier).updateShop(
                                    shop.id,
                                    {
                                      'name': nameCtrl.text.trim(),
                                      'address': addressCtrl.text.trim(),
                                      'phone': phoneCtrl.text.trim(),
                                      'owner_name': ownerNameCtrl.text.trim(),
                                      'is_active': isActive,
                                    },
                                  );

                                  if (modalCtx.mounted) {
                                    Navigator.pop(modalCtx);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(res['message'] ?? ''),
                                        backgroundColor: res['success'] == true ? AppColors.success : AppColors.error,
                                      ),
                                    );
                                  }
                                },
                          child: saving
                              ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                              : const Text('Save Changes'),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showShopStatsModal(ShopModel shop) async {
    final stats = await ref.read(shopsProvider.notifier).loadShopStats(shop.id);
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetCtx) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.divider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          shop.name,
                          style: Theme.of(sheetCtx).textTheme.headlineSmall,
                        ),
                        Text(
                          'Owner: ${shop.ownerName.isEmpty ? "N/A" : shop.ownerName}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (shop.isActive ? AppColors.success : AppColors.error).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      shop.isActive ? 'Active' : 'Inactive',
                      style: TextStyle(
                        color: shop.isActive ? AppColors.success : AppColors.error,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              if (stats == null)
                const Center(child: CircularProgressIndicator())
              else ...[
                // Metrics grid
                Row(
                  children: [
                    _StatBox(label: 'Total Revenue', value: currencyFmt.format(stats.totalRevenue), color: AppColors.success),
                    const SizedBox(width: 10),
                    _StatBox(label: 'Net Profit', value: currencyFmt.format(stats.totalProfit), color: AppColors.primary),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _StatBox(label: 'Total Sales', value: stats.totalSales.toString(), color: AppColors.info),
                    const SizedBox(width: 10),
                    _StatBox(label: 'Products', value: stats.totalProducts.toString(), color: AppColors.accent),
                    const SizedBox(width: 10),
                    _StatBox(label: 'Customers', value: stats.totalCustomers.toString(), color: Colors.purpleAccent),
                  ],
                ),
                const SizedBox(height: 20),

                Text('Assigned Users (${stats.users.length})', style: Theme.of(sheetCtx).textTheme.titleMedium),
                const SizedBox(height: 10),
                stats.users.isEmpty
                    ? const Text('No users registered for this shop.', style: TextStyle(color: AppColors.textSecondary))
                    : Column(
                        children: stats.users.map((u) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColors.surface2,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      u['full_name'] ?? u['username'] ?? '',
                                      style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                                    ),
                                    Text('@${u['username']}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    u['role'] ?? '',
                                    style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  void _confirmDeactivate(ShopModel shop) {
    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Deactivate Shop', style: TextStyle(color: AppColors.textPrimary)),
          content: Text('Are you sure you want to deactivate "${shop.name}"?', style: const TextStyle(color: AppColors.textSecondary)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
              onPressed: () async {
                Navigator.pop(dialogCtx);
                final res = await ref.read(shopsProvider.notifier).deactivateShop(shop.id);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(res['message'] ?? ''),
                      backgroundColor: res['success'] == true ? AppColors.success : AppColors.error,
                    ),
                  );
                }
              },
              child: const Text('Deactivate'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(shopsProvider);
    final overview = state.overview;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('All Shops Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(shopsProvider.notifier).loadShopsData(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        onPressed: _showCreateShopModal,
        icon: const Icon(Icons.add, color: AppColors.textOnPrimary),
        label: const Text('New Shop', style: TextStyle(color: AppColors.textOnPrimary, fontWeight: FontWeight.bold)),
      ),
      body: state.isLoading
          ? const LoadingShimmer(itemCount: 5, itemHeight: 120)
          : RefreshIndicator(
              onRefresh: () => ref.read(shopsProvider.notifier).loadShopsData(),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Admin Overview Card
                    if (overview != null)
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.purple.shade900.withValues(alpha: 0.6),
                              AppColors.surface2,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.purple.withValues(alpha: 0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.admin_panel_settings, color: Colors.purpleAccent, size: 22),
                                const SizedBox(width: 8),
                                Text(
                                  'Global System Overview',
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                _OverviewStatTile(
                                  label: 'Active Shops',
                                  value: overview.totalShops.toString(),
                                  icon: Icons.store,
                                ),
                                const SizedBox(width: 8),
                                _OverviewStatTile(
                                  label: 'Total Users',
                                  value: overview.totalUsers.toString(),
                                  icon: Icons.people,
                                ),
                                const SizedBox(width: 8),
                                _OverviewStatTile(
                                  label: 'Total Revenue',
                                  value: currencyFmt.format(overview.totalRevenue),
                                  icon: Icons.currency_rupee,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ).animate().fadeIn().slideY(begin: 0.1),

                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Shops Directory (${state.shops.length})', style: Theme.of(context).textTheme.titleLarge),
                        TextButton.icon(
                          onPressed: _showCreateShopModal,
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text('Add Shop'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    if (state.shops.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 40),
                          child: Text('No shops found. Tap "New Shop" to create one.', style: TextStyle(color: AppColors.textSecondary)),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: state.shops.length,
                        itemBuilder: (context, index) {
                          final shop = state.shops[index];
                          final breakdown = overview?.shopBreakdown.firstWhere(
                            (b) => b.id == shop.id,
                            orElse: () => ShopBreakdownModel(id: shop.id, name: shop.name, isActive: shop.isActive, revenue: 0, salesCount: 0),
                          );

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: shop.isActive ? AppColors.divider : AppColors.error.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 42,
                                            height: 42,
                                            decoration: BoxDecoration(
                                              gradient: shop.isActive ? AppColors.goldGradient : AppColors.surfaceGradient,
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Icon(
                                              Icons.storefront,
                                              color: shop.isActive ? Colors.white : AppColors.textDisabled,
                                              size: 22,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  shop.name,
                                                  style: const TextStyle(
                                                    color: AppColors.textPrimary,
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                if (shop.ownerName.isNotEmpty)
                                                  Text(
                                                    'Owner: ${shop.ownerName}',
                                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                                  ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Active Status Tag
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: (shop.isActive ? AppColors.success : AppColors.error).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        shop.isActive ? 'Active' : 'Deactivated',
                                        style: TextStyle(
                                          color: shop.isActive ? AppColors.success : AppColors.error,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),

                                // Location & Phone info
                                Row(
                                  children: [
                                    if (shop.phone.isNotEmpty) ...[
                                      const Icon(Icons.phone, size: 14, color: AppColors.textSecondary),
                                      const SizedBox(width: 4),
                                      Text(shop.phone, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                      const SizedBox(width: 16),
                                    ],
                                    if (shop.address.isNotEmpty) ...[
                                      const Icon(Icons.location_on, size: 14, color: AppColors.textSecondary),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          shop.address,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Divider(color: AppColors.divider, height: 1),
                                const SizedBox(height: 8),

                                // Bottom Row with Revenue & Action Buttons
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Total Revenue', style: TextStyle(color: AppColors.textDisabled, fontSize: 11)),
                                        Text(
                                          currencyFmt.format(breakdown?.revenue ?? 0),
                                          style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                      ],
                                    ),
                                    Row(
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.bar_chart, color: AppColors.primary, size: 20),
                                          tooltip: 'View Stats',
                                          onPressed: () => _showShopStatsModal(shop),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.edit_outlined, color: AppColors.textSecondary, size: 20),
                                          tooltip: 'Edit Shop',
                                          onPressed: () => _showEditShopModal(shop),
                                        ),
                                        if (shop.isActive)
                                          IconButton(
                                            icon: const Icon(Icons.block, color: AppColors.error, size: 20),
                                            tooltip: 'Deactivate',
                                            onPressed: () => _confirmDeactivate(shop),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ).animate().fadeIn(delay: (index * 50).ms);
                        },
                      ),
                  const SizedBox(height: 60),
                ],
              ),
            ),
          ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatBox({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10), maxLines: 1),
          ],
        ),
      ),
    );
  }
}

class _OverviewStatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _OverviewStatTile({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.surface.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.purpleAccent, size: 16),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}
