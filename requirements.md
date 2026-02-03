# Software Requirement Specification (SRS)

**Project Name:** ShopX E-Commerce Platform
**Project URL:** https://shopxecom.netlify.app/
**Version:** 1.0
**Date:** Feb 01, 2026

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to define the functional and non-functional requirements for the ShopX E-Commerce web application. This application allows users to browse products, manage a shopping cart, place orders, and track order history.

### 1.2 Scope

The application is a client-side Single Page Application (SPA) behavior using multi-page architecture. It utilizes external APIs for data:

- **Product Data:** DummyJSON API (`https://dummyjson.com/products`)
- **Backend/Persistence:** SheetDB API (`https://sheetdb.io`) for Users, Cart, and Orders.

## 2. User Roles

- **Guest User:** Can browse products, search, view details, and view the login/register screens.
- **Registered User:** Has all Guest privileges plus the ability to add to cart, buy items, manage profile (logout), and view/manage orders.

## 3. Functional Requirements

### 3.1 Authentication Module

**FR-01: User Registration**

- The system shall allow new users to register using Name, Email, Password, and Confirm Password.
- **Validation:**
  - All fields are mandatory.
  - Email must be in a valid format.
  - Password must be at least 6 characters.
  - Password and Confirm Password must match.
  - Password strength meter shall visually indicate complexity (Length, Case, Numbers).
  - **Logic:** The system must check if the email already exists in the database before creating a new record. The system shall set the default user status to "active".

**FR-02: User Login**

- The system shall allow users to login using Email and Password.
- **Validation:** Credentials must match a record in the User Database.
- **Session:** On success, user data is stored in `sessionStorage` to maintain the session across pages.

**FR-03: Forgot Password**

- The system shall allow users to reset their password via the login screen.
- **Logic:**
  - User provides registered email address.
  - System verifies email existence in the database.
  - System prompts user for a new password.
  - System updates the password in the database.

**FR-04: User Logout**

- The system shall allow logged-in users to logout, clearing the session data and redirecting to the home page or refreshing the current state.

### 3.2 Product Catalog Module (Home Page)

**FR-05: Product Listing**

- The system shall fetch and display a list of products from the external Product API.
- **Pagination/Load More:** The system shall initially display a subset of products (e.g., 12) and allow the user to load more via a "Load More" button.

**FR-06: Top Deals Slider**

- The system shall display a horizontal slider of selected products featuring calculated discounts.
- Users must be able to scroll through the slider using navigation arrows.

**FR-07: Search**

- The system shall provide a search bar to filter products by name.
- Search execution shall be debounced (delayed) to prevent excessive API calls while typing.

**FR-08: Categorization & Filtering**

- The system shall allow users to filter products by clicking category pills (e.g., Phone, Laptop, Skincare).
- Selecting "All" resets the filter.

**FR-09: Sorting**

- The system shall allow users to sort the displayed product list by:
  - Price: Low to High
  - Price: High to Low
  - Rating: Highest Rated

### 3.3 Product Details Module

**FR-10: Product Information**

- The system shall display detailed information for a selected product, including:
  - Image Gallery (Main image + Thumbnails with click-to-swap functionality).
  - Title, Brand, Description, Rating (Stars + Count).
  - Price, Discount Percentage, and Old Price.
  - Stock status.

**FR-11: Quantity Selection**

- Users shall be able to increase or decrease the quantity of the product before adding to the cart.
- Minimum quantity is 1.

**FR-12: Add to Cart**

- **Pre-condition:** User must be logged in. If not, redirect to Login.
- **Logic:**
  - If the item exists in the user's cart, update the quantity.
  - If the item does not exist, create a new cart entry.
- **Feedback:** Display a toast notification upon success.

**FR-13: Buy Now**

- **Pre-condition:** User must be logged in.
- **Logic:** Bypass the cart persistence and immediately redirect the user to the Checkout page with the specific product and quantity loaded in the session.

**FR-14: Related Products**

- The system shall display a list of products from the same category at the bottom of the details page.

### 3.4 Shopping Cart Module

**FR-15: View Cart**

- The system shall display all items currently stored in the user's persistent cart (fetched from SheetDB).
- If the cart is empty, a specific "Empty State" message and "Start Shopping" button shall be shown.

**FR-16: Manage Cart Items**

- **Update Quantity:** Users can increase or decrease item quantity. Quantity updates must reflect immediately in the database and summary calculations.
- **Remove Item:** Users can remove an item from the cart. A confirmation dialog is required before deletion.

**FR-17: Cart Summary**

- The system shall calculate and display:
  - Subtotal (Sum of Price × Quantity).
  - Tax (Calculated as 18% of Subtotal).
  - Grand Total.

### 3.5 Checkout & Order Module

**FR-18: Checkout Initialization**

- The system shall load items to be purchased.
  - **Scenario A (Standard):** Loads items from the persistent Cart.
  - **Scenario B (Buy Now):** Loads the single temporary item stored in the session.

**FR-19: Shipping Information**

- The system shall collect shipping details: Full Name, Email, Phone, Address, City, Pincode.
- **Validation:**
  - Pincode must be 6 digits.
  - Phone must be valid (10-15 digits).
  - Email must be valid format.

**FR-20: Payment Method Selection**

- Users must select a payment method (UPI or Digital Wallet).

**FR-21: Place Order**

- The system shall generate a unique Order ID.
- The system shall save the order details (User ID, Items, Shipping Info, Totals, Status: "PENDING_PAYMENT") to the Orders Database.
- **Post-Action:** If the order was placed via the Standard Cart flow, the system must clear the user's cart in the database.

### 3.6 Payment Module

**FR-22: Payment Simulation**

- The system shall display the total amount and Order ID.
- The system shall present a mock interface based on the selected method (e.g., QR code for UPI, Phone number input for Wallet).
- **Validation:**
  - UPI: Transaction ID input required.
  - Wallet: Phone number input required.

**FR-23: Payment Confirmation**

- Upon "Pay Now", the system shall simulate a network delay.
- On success, the system shall update the Order Status to "PAID" in the database.
- A success modal shall appear with a link to the "My Orders" page.

### 3.7 Order History Module

**FR-24: Order List**

- The system shall display a list of all orders placed by the logged-in user, sorted by date (newest first).
- Users can filter orders by status (All, Completed, Pending).

**FR-25: Order Details**

- Users can view specific details of an order via a modal, including shipping info, itemized list, and price breakdown.

**FR-26: Cancel Order**

- If an order status is "PENDING_PAYMENT", the user shall have the option to Cancel the order.
- Cancelled orders are removed from the database (or marked cancelled, based on implementation—current code deletes them).

## 4. Non-Functional Requirements

### 4.1 Performance

- **Loading:** Page loaders must be displayed during API fetch operations to indicate activity to the user.
- **Debouncing:** Search input must be debounced (e.g., 400ms) to prevent API rate limiting.

### 4.2 Usability

- **Responsive Design:** The application must be fully functional on Desktop, Tablet, and Mobile viewports.
- **Feedback:** Toast notifications or Alerts must be used to inform users of success (e.g., "Added to Cart") or errors (e.g., "Login Failed").

### 4.3 Security

- **Authentication:** Sensitive actions (Cart access, Checkout, Orders) are protected by a login check (`sessionStorage` validation).
- **Data Validation:** Inputs (Email, Phone, Pincode) are validated on the client side before submission.

### 4.4 Data Persistence

- User accounts, Cart items, and Orders must persist across browser sessions (handled via SheetDB).
- Login state persists within the browser session via `sessionStorage`.

## 5. External Interfaces / APIs

- **GET** `https://dummyjson.com/products`: Fetch product list.
- **GET** `https://dummyjson.com/products/{id}`: Fetch single product.
- **GET** `https://dummyjson.com/products/search?q={query}`: Search products.
- **GET** `https://dummyjson.com/products/category/{category}`: Fetch products by category.
- **SheetDB API**: Used for CRUD operations on `users`, `cart`, and `orders` sheets.
