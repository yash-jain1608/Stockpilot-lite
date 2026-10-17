StockPilot Lite — Inventory Management + Basic Analytics
A beginner-friendly full-stack MERN-style project for managing products, stock levels, and sales.
Features
- Product CRUD: create, list, search, filter, edit, delete
- Stock quantity and per-product low-stock threshold
- Dashboard metrics: product count, total units, inventory cost value, sales revenue
- Category breakdown chart
- Record a sale; stock decreases and sale history is saved
- Recent sales list
- Responsive interface
- MongoDB Atlas support
- Demo mode: runs without MongoDB using in-memory sample data (data resets when the backend restarts)
Screenshots
Place the website screenshots in docs/screenshots/ in the project root, using these filenames:
- screenshot-1.jpeg
- screenshot-2.jpeg
- screenshot-3.jpeg
- screenshot-4.jpeg
- screenshot-5.jpeg
The folder structure should look like this:
StockPilot-Lite/
├── README.md
├── docs/
│   └── screenshots/
│       ├── screenshot-1.jpeg
│       ├── screenshot-2.jpeg
│       ├── screenshot-3.jpeg
│       ├── screenshot-4.jpeg
│       └── screenshot-5.jpeg
├── backend/
└── frontend/
Website preview
Screenshot 1

Screenshot 2

Screenshot 3

Screenshot 4

Screenshot 5

Make sure the filenames and extensions match the image files exactly. If your screenshots are .jpg or .webp files instead of .png, update the extensions in the paths above. These relative paths work when the screenshots are committed to the same repository as this README.

Tech stack
- React + Vite
- CSS
- Node.js + Express
- MongoDB + Mongoose (optional for demo mode)
- Recharts
Requirements
- Node.js 18.18+ (Node.js 20 LTS recommended)
- A web browser
- Internet connection for installing packages
- Optional: MongoDB Atlas account for persistent database storage
Check Node.js:
node -v
npm -v
Run locally on Windows
Open a terminal in the StockPilot-Lite folder.
1. Start the backend
cd backend
npm install
Optional MongoDB setup:
1. Create a free MongoDB Atlas cluster.
2. Create a database user and allow your current IP in Network Access.
3. Copy backend/.env.example to backend/.env.
4. Put your connection string in MONGODB_URI. Replace the password placeholder and URL-encode special characters in the password if necessary.
5. Set a long random JWT_SECRET (not needed for the current demo; included for future expansion).
6. Set USE_DEMO_DATA=false.
If you don't configure MongoDB, the server starts in demo mode and uses sample data in memory.
Start the server:
npm run dev
Backend runs at http://localhost:5000.
2. Start the frontend
Open a second terminal in the project root:
cd frontend
npm install
npm run dev
Open the local URL printed by Vite (usually http://localhost:5173).
Demo mode vs MongoDB
- Demo mode: easiest for trying the project, but edits and sales are lost whenever the backend restarts.
- MongoDB mode: data persists in your database. Configure MONGODB_URI and set USE_DEMO_DATA=false.
API endpoints
- GET /api/health
- GET /api/dashboard
- GET /api/products?search=&category=
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id
- POST /api/sales
- GET /api/sales
Product fields
- name (required)
- sku (required, unique)
- category (required)
- purchasePrice (number >= 0)
- sellingPrice (number >= 0)
- quantity (integer >= 0)
- minStock (integer >= 0)
- supplier (optional)
Notes
- This is an educational portfolio starter, not a production-ready inventory platform.
- Before public deployment, add authentication/authorization, stronger validation, audit logs, rate limiting, and production-grade error handling.
- Sales are validated against available stock.