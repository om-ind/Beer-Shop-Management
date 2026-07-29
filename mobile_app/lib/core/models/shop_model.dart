class ShopModel {
  final int id;
  final String name;
  final String address;
  final String phone;
  final String ownerName;
  final bool isActive;
  final String? createdAt;
  final int userCount;

  const ShopModel({
    required this.id,
    required this.name,
    this.address = '',
    this.phone = '',
    this.ownerName = '',
    this.isActive = true,
    this.createdAt,
    this.userCount = 0,
  });

  factory ShopModel.fromJson(Map<String, dynamic> json) => ShopModel(
        id: json['id'] ?? 0,
        name: json['name'] ?? '',
        address: json['address'] ?? '',
        phone: json['phone'] ?? '',
        ownerName: json['owner_name'] ?? '',
        isActive: json['is_active'] == 1 || json['is_active'] == true,
        createdAt: json['created_at']?.toString(),
        userCount: json['user_count'] ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'address': address,
        'phone': phone,
        'owner_name': ownerName,
        'is_active': isActive ? 1 : 0,
        'created_at': createdAt,
        'user_count': userCount,
      };
}

class ShopBreakdownModel {
  final int id;
  final String name;
  final bool isActive;
  final double revenue;
  final int salesCount;

  const ShopBreakdownModel({
    required this.id,
    required this.name,
    required this.isActive,
    required this.revenue,
    required this.salesCount,
  });

  factory ShopBreakdownModel.fromJson(Map<String, dynamic> json) => ShopBreakdownModel(
        id: json['id'] ?? 0,
        name: json['name'] ?? '',
        isActive: json['is_active'] == 1 || json['is_active'] == true,
        revenue: (json['revenue'] ?? 0).toDouble(),
        salesCount: json['sales_count'] ?? 0,
      );
}

class AdminOverviewModel {
  final int totalShops;
  final int totalUsers;
  final double totalRevenue;
  final double totalProfit;
  final int totalSales;
  final List<ShopBreakdownModel> shopBreakdown;

  const AdminOverviewModel({
    this.totalShops = 0,
    this.totalUsers = 0,
    this.totalRevenue = 0,
    this.totalProfit = 0,
    this.totalSales = 0,
    this.shopBreakdown = const [],
  });

  factory AdminOverviewModel.fromJson(Map<String, dynamic> json) => AdminOverviewModel(
        totalShops: json['total_shops'] ?? 0,
        totalUsers: json['total_users'] ?? 0,
        totalRevenue: (json['total_revenue'] ?? 0).toDouble(),
        totalProfit: (json['total_profit'] ?? 0).toDouble(),
        totalSales: json['total_sales'] ?? 0,
        shopBreakdown: (json['shop_breakdown'] as List? ?? [])
            .map((item) => ShopBreakdownModel.fromJson(item))
            .toList(),
      );
}

class ShopStatsModel {
  final ShopModel shop;
  final int totalProducts;
  final int totalCustomers;
  final double totalRevenue;
  final double totalProfit;
  final int totalSales;
  final List<Map<String, dynamic>> users;

  const ShopStatsModel({
    required this.shop,
    this.totalProducts = 0,
    this.totalCustomers = 0,
    this.totalRevenue = 0,
    this.totalProfit = 0,
    this.totalSales = 0,
    this.users = const [],
  });

  factory ShopStatsModel.fromJson(Map<String, dynamic> json) => ShopStatsModel(
        shop: ShopModel.fromJson(json['shop'] ?? {}),
        totalProducts: json['total_products'] ?? 0,
        totalCustomers: json['total_customers'] ?? 0,
        totalRevenue: (json['total_revenue'] ?? 0).toDouble(),
        totalProfit: (json['total_profit'] ?? 0).toDouble(),
        totalSales: json['total_sales'] ?? 0,
        users: (json['users'] as List? ?? []).cast<Map<String, dynamic>>(),
      );
}
