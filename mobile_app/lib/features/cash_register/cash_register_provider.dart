import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/models/product_model.dart';
import '../../core/models/sale_model.dart';
import '../../core/providers/auth_provider.dart';

class CartItem {
  final int productId;
  final String name;
  double unitPrice;
  int qty;

  CartItem({
    required this.productId,
    required this.name,
    required this.unitPrice,
    this.qty = 1,
  });
}

class CashRegisterState {
  final List<CartItem> items;
  final bool isProcessing;

  const CashRegisterState({
    this.items = const [],
    this.isProcessing = false,
  });

  CashRegisterState copyWith({List<CartItem>? items, bool? isProcessing}) =>
      CashRegisterState(
        items: items ?? this.items,
        isProcessing: isProcessing ?? this.isProcessing,
      );
}

class CashRegisterNotifier extends StateNotifier<CashRegisterState> {
  final ApiClient _api;
  CashRegisterNotifier(this._api) : super(const CashRegisterState());

  void addItem(ProductModel product) {
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.productId == product.id);
    if (idx >= 0) {
      items[idx].qty++;
    } else {
      items.add(CartItem(
        productId: product.id,
        name: product.name,
        unitPrice: product.sellingPrice,
      ));
    }
    state = state.copyWith(items: items);
  }

  void removeItem(int productId) {
    state = state.copyWith(items: state.items.where((i) => i.productId != productId).toList());
  }

  void incrementItem(int productId) {
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.productId == productId);
    if (idx >= 0) items[idx].qty++;
    state = state.copyWith(items: items);
  }

  void decrementItem(int productId) {
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.productId == productId);
    if (idx >= 0) {
      if (items[idx].qty <= 1) {
        items.removeAt(idx);
      } else {
        items[idx].qty--;
      }
    }
    state = state.copyWith(items: items);
  }

  void updateQty(int productId, int qty) {
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.productId == productId);
    if (idx >= 0) {
      items[idx].qty = qty;
    }
    state = state.copyWith(items: items);
  }

  void updatePrice(int productId, double price) {
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.productId == productId);
    if (idx >= 0) {
      items[idx].unitPrice = price;
    }
    state = state.copyWith(items: items);
  }

  void clear() {
    state = const CashRegisterState();
  }

  Future<SaleModel?> completeSale({
    required String paymentMethod,
    required double totalAmount,
    int? customerId,
    String? saleDate,
  }) async {
    state = state.copyWith(isProcessing: true);
    try {
      int? targetCustomerId = customerId;
      if (targetCustomerId == null) {
        final custRes = await _api.get('/customers');
        final custData = custRes.data as List<dynamic>;
        if (custData.isNotEmpty) {
          targetCustomerId = custData.first['id'] as int?;
        }
      }

      if (targetCustomerId == null) {
        throw Exception("No customer found to associate the sale.");
      }

      final saleItems = state.items.map((i) => {
        'product_id': i.productId,
        'quantity': i.qty,
        'selling_price': i.unitPrice,
      }).toList();

      final res = await _api.post('/sales', data: {
        'items': saleItems,
        'total_amount': totalAmount,
        'payment_mode': paymentMethod,
        'customer_id': targetCustomerId,
        if (saleDate != null) 'sale_date': saleDate,
      });

      final resData = res.data as Map<String, dynamic>;
      final saleId = resData['sale_id'] as int?;

      SaleModel? completedSale;
      if (saleId != null) {
        final saleRes = await _api.get('/sales/$saleId');
        completedSale = SaleModel.fromJson(saleRes.data as Map<String, dynamic>);
      }

      state = const CashRegisterState();
      return completedSale;
    } catch (_) {
      state = state.copyWith(isProcessing: false);
      return null;
    }
  }
}

final cashRegisterProvider =
    StateNotifierProvider<CashRegisterNotifier, CashRegisterState>(
  (ref) => CashRegisterNotifier(ref.read(apiClientProvider)),
);
