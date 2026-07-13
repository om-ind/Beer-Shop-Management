class DashboardStats {
  final double todaySales;
  final double todayProfit;
  final double weeklySales;
  final double monthlySales;
  final double monthlyProfit;
  final double monthlyExpenses;
  final double netProfit;
  final double inventoryValue;
  final int totalProducts;
  final int totalCustomers;
  final int totalSuppliers;
  final int lowStock;
  final String topProduct;
  final String highestProfitBrand;

  const DashboardStats({
    required this.todaySales,
    required this.todayProfit,
    required this.weeklySales,
    required this.monthlySales,
    required this.monthlyProfit,
    required this.monthlyExpenses,
    required this.netProfit,
    required this.inventoryValue,
    required this.totalProducts,
    required this.totalCustomers,
    required this.totalSuppliers,
    required this.lowStock,
    required this.topProduct,
    required this.highestProfitBrand,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) => DashboardStats(
        todaySales: _toDouble(json['today_sales']),
        todayProfit: _toDouble(json['today_profit']),
        weeklySales: _toDouble(json['weekly_sales']),
        monthlySales: _toDouble(json['monthly_sales']),
        monthlyProfit: _toDouble(json['monthly_profit']),
        monthlyExpenses: _toDouble(json['monthly_expenses']),
        netProfit: _toDouble(json['net_profit']),
        inventoryValue: _toDouble(json['inventory_value']),
        totalProducts: _toInt(json['total_products']),
        totalCustomers: _toInt(json['total_customers']),
        totalSuppliers: _toInt(json['total_suppliers']),
        lowStock: _toInt(json['low_stock']),
        topProduct: json['top_product']?.toString() ?? 'N/A',
        highestProfitBrand: json['highest_profit_brand']?.toString() ?? 'N/A',
      );

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    return int.tryParse(v.toString()) ?? 0;
  }
}
