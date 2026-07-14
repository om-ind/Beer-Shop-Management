import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers/auth_provider.dart';

class AppShell extends ConsumerStatefulWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int _selectedIndex = 0;

  static const List<_NavItem> _ownerManagerItems = [
    _NavItem(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard, label: 'Dashboard', path: '/dashboard'),
    _NavItem(icon: Icons.point_of_sale_outlined, activeIcon: Icons.point_of_sale, label: 'Sales', path: '/sales'),
    _NavItem(icon: Icons.inventory_2_outlined, activeIcon: Icons.inventory_2, label: 'Inventory', path: '/inventory'),
    _NavItem(icon: Icons.people_outline, activeIcon: Icons.people, label: 'Customers', path: '/customers'),
    _NavItem(icon: Icons.menu, activeIcon: Icons.menu, label: 'More', path: ''),
  ];

  static const List<_NavItem> _cashierItems = [
    _NavItem(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard, label: 'Dashboard', path: '/dashboard'),
    _NavItem(icon: Icons.point_of_sale_outlined, activeIcon: Icons.point_of_sale, label: 'Sales', path: '/sales'),
    _NavItem(icon: Icons.calculate_outlined, activeIcon: Icons.calculate, label: 'Register', path: '/cash-register'),
    _NavItem(icon: Icons.people_outline, activeIcon: Icons.people, label: 'Customers', path: '/customers'),
    _NavItem(icon: Icons.settings_outlined, activeIcon: Icons.settings, label: 'Settings', path: '/settings'),
  ];

  List<_NavItem> get _navItems {
    final user = ref.read(currentUserProvider);
    return user?.isCashier == true ? _cashierItems : _ownerManagerItems;
  }

  void _onNavTap(int index) {
    final items = _navItems;
    if (items[index].path.isEmpty) {
      _showMoreDrawer(context);
      return;
    }
    setState(() => _selectedIndex = index);
    context.go(items[index].path);
  }

  // Determine selected index from current route
  int _getIndexFromLocation(String location) {
    final items = _navItems;
    for (int i = 0; i < items.length; i++) {
      if (items[i].path.isNotEmpty && location.startsWith(items[i].path)) {
        return i;
      }
    }
    return 0;
  }

  void _showMoreDrawer(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _MoreDrawer(
        onNavigate: (path) {
          Navigator.pop(context);
          context.go(path);
        },
        onLogout: () {
          Navigator.pop(context);
          ref.read(authProvider.notifier).logout();
          context.go('/login');
        },
        user: ref.read(currentUserProvider),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = _getIndexFromLocation(location);
    final items = _navItems;

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(
            top: BorderSide(color: AppColors.divider, width: 0.5),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(items.length, (i) {
                final item = items[i];
                final isSelected = currentIndex == i;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: GestureDetector(
                      onTap: () => _onNavTap(i),
                      behavior: HitTestBehavior.opaque,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withOpacity(0.12)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isSelected ? item.activeIcon : item.icon,
                              color: isSelected ? AppColors.primary : AppColors.textSecondary,
                              size: 22,
                            ),
                            const SizedBox(height: 3),
                            Text(
                              item.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                                color: isSelected ? AppColors.primary : AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String path;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.path,
  });
}

class _MoreDrawer extends StatelessWidget {
  final Function(String) onNavigate;
  final VoidCallback onLogout;
  final dynamic user;

  const _MoreDrawer({
    required this.onNavigate,
    required this.onLogout,
    required this.user,
  });

  @override
  Widget build(BuildContext context) {
    final isOwnerOrManager = user?.isOwnerOrManager == true;

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
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
            const SizedBox(height: 20),
            Text('More', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 16),
  
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                if (isOwnerOrManager) ...[
                  _DrawerTile(icon: Icons.calculate_outlined, label: 'Cash Register', onTap: () => onNavigate('/cash-register')),
                  _DrawerTile(icon: Icons.shopping_cart_outlined, label: 'Purchases', onTap: () => onNavigate('/purchases')),
                  _DrawerTile(icon: Icons.local_shipping_outlined, label: 'Suppliers', onTap: () => onNavigate('/suppliers')),
                  _DrawerTile(icon: Icons.bar_chart_outlined, label: 'Analytics', onTap: () => onNavigate('/analytics')),
                  _DrawerTile(icon: Icons.summarize_outlined, label: 'Reports', onTap: () => onNavigate('/reports')),
                  _DrawerTile(icon: Icons.receipt_long_outlined, label: 'Expenses', onTap: () => onNavigate('/expenses')),
                  _DrawerTile(icon: Icons.warning_amber_outlined, label: 'Low Stock', onTap: () => onNavigate('/low-stock')),
                ],
                if (user?.isOwner == true)
                  _DrawerTile(icon: Icons.manage_accounts_outlined, label: 'Users', onTap: () => onNavigate('/users')),
                _DrawerTile(icon: Icons.settings_outlined, label: 'Settings', onTap: () => onNavigate('/settings')),
                _DrawerTile(icon: Icons.logout, label: 'Logout', onTap: onLogout, isDestructive: true),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _DrawerTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : AppColors.textPrimary;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: (MediaQuery.of(context).size.width - 60) / 3,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isDestructive ? AppColors.error.withOpacity(0.1) : AppColors.surface2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDestructive ? AppColors.error.withOpacity(0.3) : AppColors.divider,
            width: 0.5,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
