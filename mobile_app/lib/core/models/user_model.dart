class UserModel {
  final int id;
  final String username;
  final String role;
  final String fullName;

  const UserModel({
    required this.id,
    required this.username,
    required this.role,
    required this.fullName,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] ?? 0,
        username: json['username'] ?? '',
        role: json['role'] ?? '',
        fullName: json['full_name'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'role': role,
        'full_name': fullName,
      };

  bool get isOwner => role == 'Owner';
  bool get isManager => role == 'Manager';
  bool get isCashier => role == 'Cashier';
  bool get isOwnerOrManager => isOwner || isManager;
}
