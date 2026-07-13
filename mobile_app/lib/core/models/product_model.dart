class ProductModel {
  final int id;
  final String name;
  final String? brand;
  final String? category;
  final String? size;
  final double purchasePrice;
  final double sellingPrice;
  final int stock;
  final int minimumStock;
  final String? barcode;

  const ProductModel({
    required this.id,
    required this.name,
    this.brand,
    this.category,
    this.size,
    required this.purchasePrice,
    required this.sellingPrice,
    required this.stock,
    required this.minimumStock,
    this.barcode,
  });

  bool get isLowStock => stock <= minimumStock;

  factory ProductModel.fromJson(Map<String, dynamic> json) => ProductModel(
        id: json['id'] ?? 0,
        name: json['name'] ?? '',
        brand: json['brand'],
        category: json['category'],
        size: json['size'],
        purchasePrice: _toDouble(json['purchase_price']),
        sellingPrice: _toDouble(json['selling_price']),
        stock: _toInt(json['stock']),
        minimumStock: _toInt(json['minimum_stock']),
        barcode: json['barcode'],
      );

  static double _toDouble(dynamic v) =>
      v == null ? 0.0 : double.tryParse(v.toString()) ?? 0.0;
  static int _toInt(dynamic v) =>
      v == null ? 0 : int.tryParse(v.toString()) ?? 0;
}
