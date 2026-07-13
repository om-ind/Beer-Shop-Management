import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_constants.dart';
import '../../core/models/misc_models.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import 'expenses_provider.dart';

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(expensesProvider.notifier).load();
    });
  }

  String _fmtCurrency(double v) =>
      NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(v);

  String _fmtDate(String s) {
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(s));
    } catch (_) {
      return s;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(expensesProvider);
    final total = state.expenses.fold(0.0, (sum, e) => sum + e.amount);

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(context, null),
        icon: const Icon(Icons.add),
        label: const Text('Add Expense'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Expenses', style: Theme.of(context).textTheme.displayMedium),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: AppColors.redGradient,
                      borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                      boxShadow: [BoxShadow(color: AppColors.error.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.receipt_long, color: Colors.white, size: 28),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Total Expenses', style: TextStyle(color: Colors.white70, fontSize: 13)),
                            Text(_fmtCurrency(total), style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const LoadingShimmer()
                  : state.expenses.isEmpty
                      ? EmptyState(
                          icon: Icons.receipt_long_outlined,
                          title: 'No Expenses',
                          actionLabel: 'Add Expense',
                          onAction: () => _showForm(context, null),
                        )
                      : RefreshIndicator(
                          color: AppColors.primary,
                          backgroundColor: AppColors.surface,
                          onRefresh: () => ref.read(expensesProvider.notifier).load(),
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                            itemCount: state.expenses.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (ctx, i) {
                              final e = state.expenses[i];
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
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppColors.error.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Icon(Icons.money_off, color: AppColors.error, size: 22),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(e.description, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
                                          const SizedBox(height: 2),
                                          Row(
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(color: AppColors.surface2, borderRadius: BorderRadius.circular(4)),
                                                child: Text(e.category, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                              ),
                                              const SizedBox(width: 6),
                                              Text(_fmtDate(e.expenseDate), style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(_fmtCurrency(e.amount), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.error)),
                                        IconButton(
                                          icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 18),
                                          onPressed: () => ref.read(expensesProvider.notifier).delete(e.id),
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                        ),
                                      ],
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

  void _showForm(BuildContext context, ExpenseModel? expense) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        final descCtrl = TextEditingController(text: expense?.description ?? '');
        final amountCtrl = TextEditingController(text: expense?.amount.toString() ?? '');
        final categoryCtrl = TextEditingController(text: expense?.category ?? '');
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
                  Text('Add Expense', style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 20),
                  TextFormField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description *'), style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(child: TextFormField(controller: amountCtrl, decoration: const InputDecoration(labelText: 'Amount *'), keyboardType: TextInputType.number, style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null)),
                    const SizedBox(width: 12),
                    Expanded(child: TextFormField(controller: categoryCtrl, decoration: const InputDecoration(labelText: 'Category *'), style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null)),
                  ]),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        if (formKey.currentState!.validate()) {
                          Navigator.pop(ctx);
                          ref.read(expensesProvider.notifier).add({
                            'description': descCtrl.text,
                            'amount': double.tryParse(amountCtrl.text) ?? 0,
                            'category': categoryCtrl.text,
                            'expense_date': DateTime.now().toIso8601String().split('T')[0],
                          });
                        }
                      },
                      child: const Text('Add Expense'),
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
}
