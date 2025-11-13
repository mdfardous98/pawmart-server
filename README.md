#  PawMart - Server-

This repository contains the back-end API for the PawMart project. It is built with **Node.js**, **Express**, and **MongoDB**, and serves all data required by the PawMart client application.

**Live Server URL:** []()

---

##  Technologies Used

- **Node.js:** JavaScript runtime to run the server-side code.  
- **Express.js:** Lightweight framework to create API endpoints and handle HTTP requests.  
- **MongoDB:** Flexible NoSQL database to store listings, orders, and user data.  
- **CORS:** Middleware to enable cross-origin requests from the client app.  
- **Dotenv:** Load environment variables securely from a `.env` file.


---

##  API 

All responses are returned in **JSON** format. Use the live server URL as the base for all requests.

### **Listings API** (`/all-products`)
- `GET /all-products` – Retrieve all pet and product listings.  
- `GET /all-products/:id` – Retrieve a single listing by its unique `_id`.  
- `GET /all-products/category/:categoryName` – Retrieve listings filtered by category (e.g., "Pets", "Pet Food").  
- `GET /api/listings/recent` – Retrieve the 6 most recently added listings for the homepage.  
- `GET /my-listings/:email` – Retrieve all listings created by a specific user.  
- `POST /all-products` – Add a new listing (used with AddListing form).  
- `PUT /all-products/:id` – Update an existing listing (used on "My Listings" page).  
- `DELETE /all-products/:id` – Delete a listing by its `_id`.  

### **Orders API** (`/orders` or `/orderData`)
- `POST /orderData` – Submit a new order for a pet or product.  
- `GET /orders/my-orders/:email` – Retrieve all orders placed by a specific user.  
- `PUT /orders/:id` – Update an existing order (e.g., address, phone).  
- `DELETE /orders/:id` – Cancel or delete an order.  

---

## 🚀 How to Run Locally

1. **Clone this repository**
```bash
git clone [https://github.com/mdfardous98/pawmart-server.git]
cd pawmart-server
