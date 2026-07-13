import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../shared/widgets/loading_states.dart';
import 'users_provider.dart';

class UsersScreen extends ConsumerStatefulWidget {
  const UsersScreen({super.key});

  @override
  ConsumerState<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends ConsumerState<UsersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(usersProvider.notifier).load();
    });
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'Owner': return AppColors.primary;
      case 'Manager': return AppColors.info;
      default: return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(usersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(context, null),
        icon: const Icon(Icons.person_add),
        label: const Text('Add User'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.textOnPrimary,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Row(
                children: [
                  Text('Users', style: Theme.of(context).textTheme.displayMedium),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                    ),
                    child: Text('${state.users.length} users', style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const LoadingShimmer()
                  : state.users.isEmpty
                      ? EmptyState(
                          icon: Icons.manage_accounts_outlined,
                          title: 'No Users',
                          actionLabel: 'Add User',
                          onAction: () => _showForm(context, null),
                        )
                      : RefreshIndicator(
                          color: AppColors.primary,
                          backgroundColor: AppColors.surface,
                          onRefresh: () => ref.read(usersProvider.notifier).load(),
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                            itemCount: state.users.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (ctx, i) {
                              final u = state.users[i];
                              final role = u['role'] ?? '';
                              final color = _roleColor(role);
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
                                      backgroundColor: color.withOpacity(0.15),
                                      child: Text(
                                        (u['full_name'] ?? u['username'] ?? '?').toString().isNotEmpty
                                            ? (u['full_name'] ?? u['username']).toString()[0].toUpperCase()
                                            : '?',
                                        style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 18),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(u['full_name']?.toString() ?? u['username']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary)),
                                          Text('@${u['username'] ?? ''}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: color.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: color.withOpacity(0.3)),
                                      ),
                                      child: Text(role, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
                                    ),
                                    const SizedBox(width: 8),
                                    PopupMenuButton(
                                      icon: const Icon(Icons.more_vert, color: AppColors.textSecondary, size: 18),
                                      itemBuilder: (_) => [
                                        const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 16), SizedBox(width: 8), Text('Edit')])),
                                        const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 16, color: AppColors.error), SizedBox(width: 8), Text('Delete', style: TextStyle(color: AppColors.error))])),
                                      ],
                                      onSelected: (v) {
                                        if (v == 'edit') _showForm(context, u);
                                        if (v == 'delete') _confirmDelete(context, u);
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

  void _showForm(BuildContext context, Map<String, dynamic>? user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        final nameCtrl = TextEditingController(text: user?['full_name']?.toString() ?? '');
        final usernameCtrl = TextEditingController(text: user?['username']?.toString() ?? '');
        final passwordCtrl = TextEditingController();
        String selectedRole = user?['role']?.toString() ?? 'Cashier';
        final formKey = GlobalKey<FormState>();

        return StatefulBuilder(
          builder: (ctx, setModalState) => Padding(
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
                    Text(user == null ? 'Add User' : 'Edit User', style: Theme.of(context).textTheme.headlineMedium),
                    const SizedBox(height: 20),
                    TextFormField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Full Name *'), style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null),
                    const SizedBox(height: 12),
                    TextFormField(controller: usernameCtrl, decoration: const InputDecoration(labelText: 'Username *'), style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null),
                    const SizedBox(height: 12),
                    if (user == null)
                      TextFormField(controller: passwordCtrl, decoration: const InputDecoration(labelText: 'Password *'), obscureText: true, style: const TextStyle(color: AppColors.textPrimary), validator: (v) => v?.isEmpty == true ? 'Required' : null),
                    if (user == null) const SizedBox(height: 12),
                    // Role selector
                    DropdownButtonFormField<String>(
                      value: selectedRole,
                      dropdownColor: AppColors.surface2,
                      style: const TextStyle(color: AppColors.textPrimary),
                      decoration: const InputDecoration(labelText: 'Role'),
                      items: ['Owner', 'Manager', 'Cashier'].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                      onChanged: (v) { if (v != null) setModalState(() => selectedRole = v); },
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          if (formKey.currentState!.validate()) {
                            Navigator.pop(ctx);
                            final data = {
                              'full_name': nameCtrl.text,
                              'username': usernameCtrl.text,
                              'role': selectedRole,
                              if (passwordCtrl.text.isNotEmpty) 'password': passwordCtrl.text,
                            };
                            if (user == null) {
                              ref.read(usersProvider.notifier).add(data);
                            } else {
                              ref.read(usersProvider.notifier).update(user['id'], data);
                            }
                          }
                        },
                        child: Text(user == null ? 'Add User' : 'Save Changes'),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, Map<String, dynamic> u) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete User'),
        content: Text('Delete "${u['full_name'] ?? u['username']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () { Navigator.pop(context); ref.read(usersProvider.notifier).delete(u['id']); },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
