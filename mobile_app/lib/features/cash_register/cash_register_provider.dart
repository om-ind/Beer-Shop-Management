import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/models/product_model.dart';
import '../../core/providers/auth_provider.dart';

class CartItem {
  final int productId;
  final String name;
  final double unitPrice;
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

  void clear() {
    state = const CashRegisterState();
  }

  Future<bool> completeSale({
    required String paymentMethod,
    required double totalAmount,
    int? customerId,
  }) async {
    state = state.copyWith(isProcessing: true);
    try {
      final saleItems = state.items.map((i) => {
        'product_id': i.productId,
        'quantity': i.qty,
        'unit_price': i.unitPrice,
      }).toList();

      await _api.post('/sales', data: {
        'items': saleItems,
        'total_amount': totalAmount,
        'payment_method': paymentMethod,
        if (customerId != null) 'customer_id': customerId,
      });

      state = const CashRegisterState();
      return true;
    } catch (_) {
      state = state.copyWith(isProcessing: false);
      return false;
    }
  }
}

final cashRegisterProvider =
    StateNotifierProvider<CashRegisterNotifier, CashRegisterState>(
  (ref) => CashRegisterNotifier(ref.read(apiClientProvider)),
);
