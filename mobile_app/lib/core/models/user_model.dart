class UserModel {
  final int id;
  final String username;
  final String role;
  final String fullName;
  final int? shopId;

  const UserModel({
    required this.id,
    required this.username,
    required this.role,
    required this.fullName,
    this.shopId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] ?? 0,
        username: json['username'] ?? '',
        role: json['role'] ?? '',
        fullName: json['full_name'] ?? '',
        shopId: json['shop_id'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'role': role,
        'full_name': fullName,
        'shop_id': shopId,
      };

  bool get isAdmin => role == 'Admin';
  bool get isOwner => role == 'Owner';
  bool get isManager => role == 'Manager';
  bool get isCashier => role == 'Cashier';
  bool get isOwnerOrManager => isOwner || isManager || isAdmin;
}
