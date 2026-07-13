# 🍺 Beer Shop Manager — Flutter Mobile App

A full-featured cross-platform mobile app (Android & iOS) for Beer Shop Management, built with Flutter.

## Features

- 🔐 **Authentication** — JWT-based login with role persistence
- 📊 **Dashboard** — Live KPI cards (sales, profit, inventory, customers)
- 🛒 **Sales** — View all sales records with payment badges
- 💰 **Cash Register** — POS with cart, quantity management, checkout
- 📦 **Inventory** — Full product CRUD with low-stock highlighting
- ⚠️ **Low Stock** — Urgency-based alerts with progress bars
- 🧾 **Purchases** — Purchase records from suppliers
- 👥 **Customers** — Customer management with total spend
- 🚚 **Suppliers** — Supplier directory management
- 📈 **Analytics** — Bar & line charts for sales trends
- 📋 **Reports** — Tabbed sales/profit/summary reports
- 💸 **Expenses** — Expense tracking with categories
- 👤 **Users** — User management (Owner only)
- ⚙️ **Settings** — Profile view, change password, logout

## Role-Based Access

| Feature | Owner | Manager | Cashier |
|---------|-------|---------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Sales | ✅ | ✅ | ✅ |
| Cash Register | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ❌ |
| Purchases | ✅ | ✅ | ❌ |
| Suppliers | ✅ | ✅ | ❌ |
| Analytics | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Expenses | ✅ | ✅ | ❌ |
| Users | ✅ | ❌ | ❌ |

## Design

- **Theme**: Dark with amber/gold beer palette
- **Typography**: Inter (Google Fonts)
- **Animations**: flutter_animate micro-animations
- **Charts**: fl_chart bar and line charts

## Setup

### 1. Install Flutter

Download from https://flutter.dev/docs/get-started/install/windows

Extract to `C:\src\flutter` and add `C:\src\flutter\bin` to PATH.

### 2. Install dependencies

```bash
cd mobile_app
flutter pub get
```

### 3. Configure API URL

Edit `lib/core/constants/app_constants.dart`:
- **Android Emulator**: `http://10.0.2.2:5000` (maps to host localhost)
- **Real device**: Use your machine's LAN IP e.g. `http://192.168.1.X:5000`

### 4. Run on emulator

```bash
# Start Android emulator first from Android Studio
flutter run
```

### 5. Build APK

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

## Project Structure

```
lib/
├── main.dart                    # App entry point
├── core/
│   ├── api/api_client.dart      # Dio HTTP client
│   ├── constants/               # Colors, URLs, roles
│   ├── models/                  # Data models
│   ├── providers/               # Auth provider
│   └── router/app_router.dart   # GoRouter navigation
├── features/
│   ├── auth/                    # Login screen
│   ├── dashboard/               # Dashboard + KPIs
│   ├── sales/                   # Sales list
│   ├── cash_register/           # POS screen
│   ├── inventory/               # Products + low stock
│   ├── purchases/               # Purchase records
│   ├── customers/               # Customer CRUD
│   ├── suppliers/               # Supplier CRUD
│   ├── analytics/               # Charts
│   ├── reports/                 # Tabbed reports
│   ├── expenses/                # Expense tracking
│   ├── users/                   # User management
│   └── settings/                # Profile + password
└── shared/
    ├── layouts/app_shell.dart   # Navigation shell
    ├── theme/app_theme.dart     # Dark amber theme
    └── widgets/                 # Shared components
```
