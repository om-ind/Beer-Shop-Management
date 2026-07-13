class SupplierModel {
  final int id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final String? contactPerson;

  const SupplierModel({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.address,
    this.contactPerson,
  });

  factory SupplierModel.fromJson(Map<String, dynamic> json) => SupplierModel(
        id: json['id'] ?? 0,
        name: json['name'] ?? '',
        phone: json['phone'],
        email: json['email'],
        address: json['address'],
        contactPerson: json['contact_person'],
      );
}

class ExpenseModel {
  final int id;
  final String description;
  final double amount;
  final String category;
  final String expenseDate;
  final String? notes;

  const ExpenseModel({
    required this.id,
    required this.description,
    required this.amount,
    required this.category,
    required this.expenseDate,
    this.notes,
  });

  factory ExpenseModel.fromJson(Map<String, dynamic> json) => ExpenseModel(
        id: json['id'] ?? 0,
        description: json['description'] ?? '',
        amount: _toDouble(json['amount']),
        category: json['category'] ?? '',
        expenseDate: json['expense_date']?.toString() ?? '',
        notes: json['notes'],
      );

  static double _toDouble(dynamic v) =>
      v == null ? 0.0 : double.tryParse(v.toString()) ?? 0.0;
}

class PurchaseModel {
  final int id;
  final String? supplierName;
  final double totalAmount;
  final String purchaseDate;
  final String? invoiceNumber;
  final String? status;

  const PurchaseModel({
    required this.id,
    this.supplierName,
    required this.totalAmount,
    required this.purchaseDate,
    this.invoiceNumber,
    this.status,
  });

  factory PurchaseModel.fromJson(Map<String, dynamic> json) => PurchaseModel(
        id: json['id'] ?? 0,
        supplierName: json['supplier_name'],
        totalAmount: _toDouble(json['total_amount']),
        purchaseDate: json['purchase_date']?.toString() ?? '',
        invoiceNumber: json['invoice_number'],
        status: json['status'],
      );

  static double _toDouble(dynamic v) =>
      v == null ? 0.0 : double.tryParse(v.toString()) ?? 0.0;
}
