class SaleModel {
  final int id;
  final String? customerName;
  final double totalAmount;
  final String paymentMethod;
  final String saleDate;
  final String? status;
  final List<SaleItemModel> items;

  const SaleModel({
    required this.id,
    this.customerName,
    required this.totalAmount,
    required this.paymentMethod,
    required this.saleDate,
    this.status,
    this.items = const [],
  });

  factory SaleModel.fromJson(Map<String, dynamic> json) => SaleModel(
        id: json['id'] ?? 0,
        customerName: json['customer_name'],
        totalAmount: _toDouble(json['total_amount']),
        paymentMethod: json['payment_method'] ?? 'Cash',
        saleDate: json['sale_date']?.toString() ?? '',
        status: json['status'],
        items: (json['items'] as List<dynamic>? ?? [])
            .map((e) => SaleItemModel.fromJson(e))
            .toList(),
      );

  static double _toDouble(dynamic v) =>
      v == null ? 0.0 : double.tryParse(v.toString()) ?? 0.0;
}

class SaleItemModel {
  final int productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double total;

  const SaleItemModel({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.total,
  });

  factory SaleItemModel.fromJson(Map<String, dynamic> json) => SaleItemModel(
        productId: json['product_id'] ?? 0,
        productName: json['product_name'] ?? '',
        quantity: json['quantity'] ?? 0,
        unitPrice: _toDouble(json['unit_price']),
        total: _toDouble(json['total']),
      );

  static double _toDouble(dynamic v) =>
      v == null ? 0.0 : double.tryParse(v.toString()) ?? 0.0;
}
