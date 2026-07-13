import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';

import '../api/api_client.dart';
import '../constants/app_constants.dart';
import '../models/user_model.dart';

// ─── State ───────────────────────────────────────────────────────────────────

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final UserModel? user;
  final String? token;
  final String? error;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.token,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    UserModel? user,
    String? token,
    String? error,
  }) =>
      AuthState(
        isLoading: isLoading ?? this.isLoading,
        isAuthenticated: isAuthenticated ?? this.isAuthenticated,
        user: user ?? this.user,
        token: token ?? this.token,
        error: error,
      );
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;

  AuthNotifier(this._api) : super(const AuthState()) {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey);
    final userJson = prefs.getString(AppConstants.userKey);

    if (token != null && userJson != null) {
      try {
        final user = UserModel.fromJson(jsonDecode(userJson));
        state = AuthState(
          isAuthenticated: true,
          user: user,
          token: token,
        );
      } catch (_) {
        await _clearStorage();
      }
    }
  }

  Future<bool> login(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _api.post(
        '/login',
        data: {'username': username, 'password': password},
      );

      final data = response.data as Map<String, dynamic>;

      if (data['success'] == true) {
        final token = data['token'] as String;
        final user = UserModel.fromJson(data['user']);

        // Persist
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.tokenKey, token);
        await prefs.setString(AppConstants.userKey, jsonEncode(user.toJson()));

        state = AuthState(
          isAuthenticated: true,
          user: user,
          token: token,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: data['message'] ?? 'Login failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? 'Network error. Please try again.';
      state = state.copyWith(isLoading: false, error: message);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'An unexpected error occurred.');
      return false;
    }
  }

  Future<void> logout() async {
    await _clearStorage();
    state = const AuthState();
  }

  Future<void> _clearStorage() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userKey);
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await _api.put(
        '/auth/change-password',
        data: {
          'username': state.user?.username,
          'current_password': currentPassword,
          'new_password': newPassword,
        },
      );
      return response.data['success'] == true;
    } catch (_) {
      return false;
    }
  }
}

// ─── Providers ────────────────────────────────────────────────────────────────

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ref.read(apiClientProvider)),
);

// Convenience selectors
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});
