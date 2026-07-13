import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/auth_provider.dart';
import '../../features/auth/login_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/sales/sales_screen.dart';
import '../../features/cash_register/cash_register_screen.dart';
import '../../features/inventory/inventory_screen.dart';
import '../../features/inventory/low_stock_screen.dart';
import '../../features/purchases/purchases_screen.dart';
import '../../features/customers/customers_screen.dart';
import '../../features/suppliers/suppliers_screen.dart';
import '../../features/reports/reports_screen.dart';
import '../../features/analytics/analytics_screen.dart';
import '../../features/expenses/expenses_screen.dart';
import '../../features/users/users_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../shared/layouts/app_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login';

      if (!isAuthenticated && !isLoginRoute) return '/login';
      if (isAuthenticated && isLoginRoute) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/sales',
            builder: (_, __) => const SalesScreen(),
          ),
          GoRoute(
            path: '/cash-register',
            builder: (_, __) => const CashRegisterScreen(),
          ),
          GoRoute(
            path: '/inventory',
            builder: (_, __) => const InventoryScreen(),
          ),
          GoRoute(
            path: '/low-stock',
            builder: (_, __) => const LowStockScreen(),
          ),
          GoRoute(
            path: '/purchases',
            builder: (_, __) => const PurchasesScreen(),
          ),
          GoRoute(
            path: '/customers',
            builder: (_, __) => const CustomersScreen(),
          ),
          GoRoute(
            path: '/suppliers',
            builder: (_, __) => const SuppliersScreen(),
          ),
          GoRoute(
            path: '/reports',
            builder: (_, __) => const ReportsScreen(),
          ),
          GoRoute(
            path: '/analytics',
            builder: (_, __) => const AnalyticsScreen(),
          ),
          GoRoute(
            path: '/expenses',
            builder: (_, __) => const ExpensesScreen(),
          ),
          GoRoute(
            path: '/users',
            builder: (_, __) => const UsersScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (_, __) => const SettingsScreen(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: Center(
        child: Text(
          'Page not found: ${state.error}',
          style: const TextStyle(color: Colors.white),
        ),
      ),
    ),
  );
});
