class CustomerModel {
  final int id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final double totalPurchases;
  final String? createdAt;

  const CustomerModel({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.address,
    required this.totalPurchases,
    this.createdAt,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) => CustomerModel(
        id: json['id'] ?? 0,
        name: json['name'] ?? '',
        phone: json['phone'],
        email: json['email'],
        address: json['address'],
        totalPurchases: _toDouble(json['total_purchases']),
        createdAt: json['created_at']?.toString(),
      );

  static double _toDouble(dynamic v) =>
      v == null ? 0.0 : double.tryParse(v.toString()) ?? 0.0;
}
