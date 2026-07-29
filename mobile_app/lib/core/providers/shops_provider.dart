import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../api/api_client.dart';
import '../models/shop_model.dart';
import 'auth_provider.dart';

class ShopsState {
  final bool isLoading;
  final List<ShopModel> shops;
  final AdminOverviewModel? overview;
  final ShopStatsModel? selectedShopStats;
  final String? error;

  const ShopsState({
    this.isLoading = false,
    this.shops = const [],
    this.overview,
    this.selectedShopStats,
    this.error,
  });

  ShopsState copyWith({
    bool? isLoading,
    List<ShopModel>? shops,
    AdminOverviewModel? overview,
    ShopStatsModel? selectedShopStats,
    String? error,
  }) =>
      ShopsState(
        isLoading: isLoading ?? this.isLoading,
        shops: shops ?? this.shops,
        overview: overview ?? this.overview,
        selectedShopStats: selectedShopStats ?? this.selectedShopStats,
        error: error,
      );
}

class ShopsNotifier extends StateNotifier<ShopsState> {
  final ApiClient _api;

  ShopsNotifier(this._api) : super(const ShopsState()) {
    loadShopsData();
  }

  Future<void> loadShopsData() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final shopsResponse = await _api.get('/shops');
      final overviewResponse = await _api.get('/admin/overview');

      final shopsList = (shopsResponse.data as List? ?? [])
          .map((item) => ShopModel.fromJson(item))
          .toList();

      final overview = AdminOverviewModel.fromJson(overviewResponse.data ?? {});

      state = state.copyWith(
        isLoading: false,
        shops: shopsList,
        overview: overview,
      );
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? e.response?.data['error'] ?? 'Failed to load shops';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'An error occurred loading shops');
    }
  }

  Future<ShopStatsModel?> loadShopStats(int shopId) async {
    try {
      final response = await _api.get('/shops/$shopId/stats');
      final stats = ShopStatsModel.fromJson(response.data ?? {});
      state = state.copyWith(selectedShopStats: stats);
      return stats;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> createShop(Map<String, dynamic> data) async {
    try {
      final response = await _api.post('/shops', data: data);
      final resData = response.data as Map<String, dynamic>;
      if (resData['success'] == true) {
        await loadShopsData();
        return {'success': true, 'message': resData['message'] ?? 'Shop created successfully'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to create shop'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Network error creating shop';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'Unexpected error creating shop'};
    }
  }

  Future<Map<String, dynamic>> updateShop(int shopId, Map<String, dynamic> data) async {
    try {
      final response = await _api.put('/shops/$shopId', data: data);
      final resData = response.data as Map<String, dynamic>;
      if (resData['success'] == true) {
        await loadShopsData();
        return {'success': true, 'message': resData['message'] ?? 'Shop updated successfully'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to update shop'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Network error updating shop';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'Unexpected error updating shop'};
    }
  }

  Future<Map<String, dynamic>> deactivateShop(int shopId) async {
    try {
      final response = await _api.delete('/shops/$shopId');
      final resData = response.data as Map<String, dynamic>;
      if (resData['success'] == true) {
        await loadShopsData();
        return {'success': true, 'message': resData['message'] ?? 'Shop deactivated'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to deactivate shop'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Error deactivating shop';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'Unexpected error deactivating shop'};
    }
  }
}

final shopsProvider = StateNotifierProvider<ShopsNotifier, ShopsState>(
  (ref) => ShopsNotifier(ref.read(apiClientProvider)),
);
