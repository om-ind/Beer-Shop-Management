# Beer Shop Management System

A multi-platform enterprise solution for managing beer shop inventory, sales billing, customer relationships, supplier invoices, and cash ledger flows.

---

## 🚀 Tech Stack

- **Backend**: Python (Flask), MySQL, Database Migrations
- **Web Portal**: React, Vite, CSS (Sleek modern styling, Glassmorphism, and responsive components)
- **Mobile Application**: Flutter, Dart, Riverpod, Dio client

---

## 🛠️ Features & Recent Enhancements

### 1. Point of Sale (POS) Billing
- **Editable Selling Prices**: Allows manual overrides of unit selling prices directly within the POS cart. Subtotals, tax, and order totals update dynamically.
- **Direct Keyboard Qty Entry**: Replaced button-only selectors with text input fields allowing cashiers to type quantities instantly.
- **Custom Sale Date Selection**: Allows back-dating or custom-dating transactions when creating a sale.
- **Verification & Validation**: Real-time validation checks for non-negative prices and positive quantities during checkout.
- **Default Customer Auto-select**: Prevents crashes by automatically defaulting the customer dropdown to the first active customer instead of hardcoding `1`.

### 2. Dashboard KPIs & Filtered Analytics
- **Date-Filtered KPIs**: Features a calendar selector in the header to view statistics (Sales, Profits, and Expenses) for any chosen date.
- **Net Profit Calculations**: Subtracts monthly expenses and supplier bill payments from gross monthly profits to display an accurate bottom line.

### 3. Sales History Inline Editing
- **Inline Calendar Editor**: Click the calendar edit icon next to any transaction to alter its date inline using a date picker, instantly saving back to the database.

### 4. Cash Register transfers (Cash ↔ Bank)
- **Double-Entry Automation**: Creating a cash register entry of category `transfer` (e.g., Cash to Bank or Bank to Cash) automatically inserts both debit and credit ledger rows under a linked reference token `[Ref: TRF-<timestamp>-<rand>]`.
- **Linked Deletions**: Deleting one side of a transfer automatically removes the counterpart entry, keeping the books balanced.

### 5. Linked Supplier Bill Payments
- **Pending Bill Selection**: Selecting category `Bill Payment` in the Cash Register shows a dropdown of all pending/partial supplier bills.
- **Dynamic Pre-population**: Defaults payment inputs (Amount, description) based on the chosen bill.
- **Part Payments**: Support for partial payments by typing custom values below the remaining balance.
- **Deletion Rollbacks**: Deleting a ledger payment automatically reverts the paid balance on the supplier bill, updating its status.

### 6. Mobile Application Feature Parity
- All custom POS quantity/price overrides, custom sale dates, dashboard date filters, and sales history inline date editors have been replicated in the Flutter mobile application with full Riverpod state support.

---

## ⚙️ Running the Projects Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- Flutter SDK & Dart
- MySQL Server

### 1. Backend Server
```bash
cd backend
pip install -r requirements.txt
# Configure database settings in database.py
python app.py
```
*Backend runs at: `http://localhost:5000`*

### 2. Frontend React Web Portal
```bash
cd frontend
npm install
npm run dev
```
*Web client runs at: `http://localhost:5173`*

### 3. Flutter Mobile Application
```bash
cd mobile_app
flutter pub get
flutter run
```
