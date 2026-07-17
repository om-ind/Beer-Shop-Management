import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/stat_card.dart';
import '../../shared/widgets/loading_states.dart';
import 'dashboard_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refresh();
    });
  }

  Future<void> _refresh() async {
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    await ref.read(dashboardProvider.notifier).load(date: dateStr);
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
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
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
      _refresh();
    }
  }

  String _fmt(double v) => NumberFormat.currency(
        locale: 'en_IN',
        symbol: '₹',
        decimalDigits: 0,
      ).format(v);

  @override
  Widget build(BuildContext context) {
    final dashState = ref.watch(dashboardProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          onRefresh: _refresh,
          child: CustomScrollView(
            slivers: [
              // ─── Header ───────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getGreeting(),
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              user?.fullName ?? 'User',
                              style: Theme.of(context).textTheme.headlineLarge,
                            ).animate().fadeIn().slideX(begin: -0.1),
                          ],
                        ),
                      ),
                      // Role badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: AppColors.goldGradient,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          user?.role ?? '',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Date Selector Row
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: _selectDate,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.divider, width: 0.5),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.calendar_today, size: 14, color: AppColors.primary),
                              const SizedBox(width: 8),
                              Text(
                                DateFormat('dd MMM yyyy').format(_selectedDate),
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_drop_down, size: 16, color: AppColors.textSecondary),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 15)),

              // ─── Content ──────────────────────────────────────────────────
              if (dashState.isLoading)
                const SliverFillRemaining(
                  child: LoadingShimmer(itemCount: 8, itemHeight: 100),
                )
              else if (dashState.error != null)
                SliverFillRemaining(
                  child: ErrorState(
                    message: dashState.error!,
                    onRetry: () => ref.read(dashboardProvider.notifier).load(),
                  ),
                )
              else if (dashState.stats != null) ...[
                // Sales KPI cards
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.25,
                    ),
                    delegate: SliverChildListDelegate([
                      StatCard(
                        title: "Today's Sales",
                        value: _fmt(dashState.stats!.todaySales),
                        icon: Icons.today,
                        gradient: AppColors.goldGradient,
                        subtitle: 'Today',
                      ).animate().fadeIn(delay: 100.ms).scale(begin: const Offset(0.95, 0.95)),
                      StatCard(
                        title: 'Monthly Sales',
                        value: _fmt(dashState.stats!.monthlySales),
                        icon: Icons.calendar_month,
                        gradient: AppColors.blueGradient,
                        subtitle: 'This Month',
                      ).animate().fadeIn(delay: 150.ms).scale(begin: const Offset(0.95, 0.95)),
                      StatCard(
                        title: 'Net Profit',
                        value: _fmt(dashState.stats!.netProfit),
                        icon: Icons.trending_up,
                        gradient: AppColors.greenGradient,
                        subtitle: 'This Month',
                      ).animate().fadeIn(delay: 200.ms).scale(begin: const Offset(0.95, 0.95)),
                      StatCard(
                        title: 'Inventory Value',
                        value: _fmt(dashState.stats!.inventoryValue),
                        icon: Icons.inventory,
                        gradient: AppColors.purpleGradient,
                      ).animate().fadeIn(delay: 250.ms).scale(begin: const Offset(0.95, 0.95)),
                    ]),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 20)),

                // Section header
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      'Overview',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 12)),

                // Info cards
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      InfoCard(
                        title: 'Total Products',
                        value: dashState.stats!.totalProducts.toString(),
                        icon: Icons.inventory_2_outlined,
                        iconColor: AppColors.info,
                        onTap: () => context.go('/inventory'),
                      ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.05),
                      const SizedBox(height: 10),
                      InfoCard(
                        title: 'Total Customers',
                        value: dashState.stats!.totalCustomers.toString(),
                        icon: Icons.people_outline,
                        iconColor: AppColors.success,
                        onTap: () => context.go('/customers'),
                      ).animate().fadeIn(delay: 340.ms).slideX(begin: 0.05),
                      const SizedBox(height: 10),
                      InfoCard(
                        title: 'Total Suppliers',
                        value: dashState.stats!.totalSuppliers.toString(),
                        icon: Icons.local_shipping_outlined,
                        iconColor: AppColors.warning,
                        onTap: () => context.go('/suppliers'),
                      ).animate().fadeIn(delay: 380.ms).slideX(begin: 0.05),
                      const SizedBox(height: 10),
                      InfoCard(
                        title: 'Low Stock Alerts',
                        value: dashState.stats!.lowStock.toString(),
                        icon: Icons.warning_amber_outlined,
                        iconColor: AppColors.error,
                        onTap: () => context.go('/low-stock'),
                      ).animate().fadeIn(delay: 420.ms).slideX(begin: 0.05),
                      const SizedBox(height: 10),
                    ]),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 16)),

                // Top product highlight
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: AppColors.goldGradient,
                        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.emoji_events, color: Colors.white, size: 32),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Top Selling Product',
                                  style: TextStyle(color: Colors.white70, fontSize: 12),
                                ),
                                Text(
                                  dashState.stats!.topProduct,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text(
                                'Best Brand',
                                style: TextStyle(color: Colors.white70, fontSize: 12),
                              ),
                              Text(
                                dashState.stats!.highestProfitBrand,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  }
}
