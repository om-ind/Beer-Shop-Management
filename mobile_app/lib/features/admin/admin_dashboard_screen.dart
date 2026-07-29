import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers/shops_provider.dart';
import '../../shared/widgets/loading_states.dart';

final currencyFmt = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(shopsProvider.notifier).loadShopsData());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(shopsProvider);
    final overview = state.overview;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(shopsProvider.notifier).loadShopsData(),
          ),
        ],
      ),
      body: state.isLoading
          ? const LoadingShimmer(itemCount: 6, itemHeight: 110)
          : state.error != null
              ? ErrorState(
                  message: state.error!,
                  onRetry: () => ref.read(shopsProvider.notifier).loadShopsData(),
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  backgroundColor: AppColors.surface,
                  onRefresh: () => ref.read(shopsProvider.notifier).loadShopsData(),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header Banner
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.purple.shade900.withValues(alpha: 0.7),
                                AppColors.surface,
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.purple.withValues(alpha: 0.4)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: Colors.purple.withValues(alpha: 0.3),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(Icons.admin_panel_settings, color: Colors.purpleAccent, size: 28),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: const [
                                    Text(
                                      'Global Overview',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Multi-shop management & global metrics',
                                      style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.storefront, color: Colors.purpleAccent),
                                tooltip: 'Manage Shops',
                                onPressed: () => context.go('/admin/shops'),
                              ),
                            ],
                          ),
                        ).animate().fadeIn().slideY(begin: 0.05),

                        const SizedBox(height: 20),

                        // 4 Stat Cards Grid
                        if (overview != null) ...[
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 1.25,
                            children: [
                              _AdminStatCard(
                                label: 'Active Shops',
                                value: overview.totalShops.toString(),
                                icon: Icons.storefront,
                                color: Colors.purpleAccent,
                                bgGradient: LinearGradient(
                                  colors: [Colors.purple.shade900.withValues(alpha: 0.4), AppColors.surface],
                                ),
                              ).animate().fadeIn(delay: 100.ms),
                              _AdminStatCard(
                                label: 'Total Users',
                                value: overview.totalUsers.toString(),
                                icon: Icons.people_alt_outlined,
                                color: Colors.blueAccent,
                                bgGradient: LinearGradient(
                                  colors: [Colors.blue.shade900.withValues(alpha: 0.4), AppColors.surface],
                                ),
                              ).animate().fadeIn(delay: 150.ms),
                              _AdminStatCard(
                                label: 'Total Revenue',
                                value: currencyFmt.format(overview.totalRevenue),
                                icon: Icons.currency_rupee,
                                color: AppColors.success,
                                bgGradient: LinearGradient(
                                  colors: [Colors.green.shade900.withValues(alpha: 0.4), AppColors.surface],
                                ),
                              ).animate().fadeIn(delay: 200.ms),
                              _AdminStatCard(
                                label: 'Total Sales',
                                value: overview.totalSales.toString(),
                                icon: Icons.trending_up,
                                color: AppColors.primary,
                                bgGradient: LinearGradient(
                                  colors: [Colors.amber.shade900.withValues(alpha: 0.4), AppColors.surface],
                                ),
                              ).animate().fadeIn(delay: 250.ms),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // Shop Revenue Breakdown Table / Cards
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.shopping_bag_outlined, color: Colors.purpleAccent, size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Shop Revenue Breakdown',
                                    style: Theme.of(context).textTheme.titleLarge,
                                  ),
                                ],
                              ),
                              TextButton.icon(
                                onPressed: () => context.go('/admin/shops'),
                                icon: const Icon(Icons.arrow_forward, size: 16, color: Colors.purpleAccent),
                                label: const Text(
                                  'Manage Shops',
                                  style: TextStyle(color: Colors.purpleAccent, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          if (overview.shopBreakdown.isEmpty)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Center(
                                child: Text('No shops found. Create a shop to get started.', style: TextStyle(color: AppColors.textSecondary)),
                              ),
                            )
                          else
                            ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: overview.shopBreakdown.length,
                              itemBuilder: (context, index) {
                                final shop = overview.shopBreakdown[index];
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: AppColors.divider, width: 0.5),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 36,
                                        height: 36,
                                        decoration: BoxDecoration(
                                          color: AppColors.surface2,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Center(
                                          child: Text(
                                            '#${index + 1}',
                                            style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold, fontSize: 12),
                                          ),
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
                                                fontSize: 15,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: (shop.isActive ? AppColors.success : AppColors.error).withValues(alpha: 0.15),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    shop.isActive ? 'Active' : 'Inactive',
                                                    style: TextStyle(
                                                      color: shop.isActive ? AppColors.success : AppColors.error,
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  '${shop.salesCount} sales',
                                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            currencyFmt.format(shop.revenue),
                                            style: const TextStyle(
                                              color: AppColors.success,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 15,
                                            ),
                                          ),
                                          GestureDetector(
                                            onTap: () => context.go('/admin/shops'),
                                            child: const Padding(
                                              padding: EdgeInsets.only(top: 4),
                                              child: Text(
                                                'View →',
                                                style: TextStyle(color: Colors.purpleAccent, fontSize: 12, fontWeight: FontWeight.w600),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ).animate().fadeIn(delay: (index * 40).ms);
                              },
                            ),
                        ],
                        const SizedBox(height: 60),
                      ],
                    ),
                  ),
                ),
    );
  }
}

class _AdminStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final Gradient bgGradient;

  const _AdminStatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.bgGradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: bgGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
            ],
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
