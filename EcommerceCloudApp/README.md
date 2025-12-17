# 🛒 GoMart - Ghana's Premier E-commerce Platform

[![GitHub Repository](https://img.shields.io/badge/GitHub-GoMart-blue?style=flat-square&logo=github)](https://github.com/fejiro0/ca_10211100297.git)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GoMart-green?style=flat-square)](https://gomartgh.onrender.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)

## 👤 Developer Information

**Developer:** Famous Akpovogbeta  
**Roll Number:** 10211100297  
**GitHub Repository:** [https://github.com/fejiro0/ca_10211100297.git](https://github.com/fejiro0/ca_10211100297.git)  
**Live Application:** [https://gomartgh.onrender.com/](https://gomartgh.onrender.com/)

## 🌟 Project Overview

GoMart is an innovative, comprehensive e-commerce platform designed specifically for the Ghanaian market. Built with modern technologies and localized features, it provides a seamless shopping experience with integrated Mobile Money payments, local delivery services, and Ghana-specific business logic.

## 📁 Repository Information

**Repository:** [GoMart E-commerce App](https://github.com/fejiro0/ca_10211100297.git)  
**Live URL:** [https://gomartgh.onrender.com/](https://gomartgh.onrender.com/)  
**Technology:** Full-stack JavaScript (Node.js + Next.js)  
**Database:** MongoDB Atlas with Prisma ORM

## 🚀 Key Features

### 🇬🇭 Ghana-Focused Features
- **Mobile Money Integration**: MTN Mobile Money, Vodafone Cash, AirtelTigo Money
- **Local Delivery**: Integration with Ghana Post, DHL Ghana, Bolt, Jumia Logistics
- **Regional Support**: Ghana regions (Greater Accra, Ashanti, etc.) and cities
- **Currency**: Ghana Cedi (GHS) as primary currency
- **Local Business Logic**: Tailored for Ghanaian e-commerce needs

### 🛍️ Core E-commerce Features
- Multi-vendor marketplace
- Product catalog with categories
- Shopping cart and checkout
- Order management and tracking
- Customer reviews and ratings
- Vendor management system
- Payment processing
- Shipping and delivery tracking

### 👥 User Roles & Access Control

**Regular Users:**
- Can create an account and register
- Can view all products and categories
- Can add products to cart
- Can make purchases
- Can browse and search products

**Admin Access:**
- **Admin Credentials:**
  - Email: `admin@gmail.com`
  - Password: `12345`
- **Admin Capabilities:**
  - View all products
  - Create new products
  - Edit existing products
  - Delete products
  - Update product information
  - Manage categories
  - View and manage all orders
  - Access admin dashboard

### 🤖 Innovative Features (Future Phases)
- AI-powered product recommendations
- Voice-enabled search
- AR/3D product preview
- Gamification system with rewards
- Advanced analytics dashboard

## 🏗️ Project Structure

```
EcommerceCloudApp/
├── prisma/                    # Prisma schema and seed files
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding script
├── src/                       # Next.js Application
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── ui/                # UI pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable UI components
│   └── lib/                   # Utility libraries
├── public/                    # Static assets
└── README.md                  # Project documentation
```

## 🛠️ Technology Stack

### Backend (API Routes)
- **Framework**: Next.js API Routes
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Built-in validation

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: TailwindCSS
- **State Management**: React Hooks
- **UI Components**: Custom components with Tailwind
- **Notifications**: React Toastify

### Database Schema
- **Customer Management**: User profiles, authentication
- **Product Catalog**: Products, categories, vendors
- **Order Processing**: Orders, order items, payments
- **Shipping**: Delivery tracking, courier management
- **Reviews**: Product ratings and feedback
- **Cart**: Shopping cart functionality

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Git

### Clone Repository
```bash
git clone https://github.com/fejiro0/ca_10211100297.git
cd ca_10211100297/EcommerceCloudApp
```

### Access Live Application
Visit the live application at: [https://gomartgh.onrender.com/](https://gomartgh.onrender.com/)

### Project Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the project root with the following variables:
   ```env
   # Database Configuration
   DATABASE_URL="Create a PERSONAL MONGOdb URL"
   
   # JWT Secret (Change in production - use a strong random string)
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Next.js Configuration
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Ghana-specific configurations
   DEFAULT_CURRENCY=GHS
   DEFAULT_REGION="Greater Accra"
   DEFAULT_COUNTRY=Ghana
   ```
   
   **Important:** Never commit your `.env` file to git. Use `.env.example` as a template.

3. **Database Setup**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to MongoDB
   npm run db:push
   
   # (Optional) Seed the database with sample data
   npm run db:seed
   
   # (Optional) Open Prisma Studio to view data
   npm run db:studio
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

## 📋 MongoDB Atlas Setup Guide

### 1. Create MongoDB Atlas Account
1. Visit [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up for a free account
3. Create a new cluster

### 2. Database Configuration
1. Create a new database (e.g., `gomart`)
2. Create a database user with appropriate permissions
3. Set a strong password (store it securely)

### 3. Network Access
1. Go to "Network Access" in Atlas dashboard
2. Add your IP Address (or `0.0.0.0/0` for development - **restrict in production**)
3. Save changes

### 4. Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<username>` and `<password>` with your database credentials
5. Add your database name to the connection string

### 5. Connection String Format
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

## 🔌 API Endpoints

### Authentication
- `POST /api/customers/register` - Customer registration
- `POST /api/customers/login` - Customer login
- `GET /api/customers/profile` - Get customer profile
- `PUT /api/customers/profile` - Update customer profile

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (vendor only)
- `PUT /api/products/:id` - Update product (vendor only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category with products

### Orders
- `GET /api/orders` - Get customer orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order

### Cart
- `GET /api/cart` - Get customer cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove` - Remove item from cart

## 🧪 Testing

### API Testing
Test the API endpoints using tools like Postman or curl:

```bash
# Get all products
curl http://localhost:3000/api/products

# Get all categories
curl http://localhost:3000/api/categories

# Register a customer
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","phoneNumber":"0241234567","password":"password123","region":"Greater Accra","city":"Accra"}'
```

## 🚀 Deployment

### Production Deployment
1. Set up environment variables in your hosting platform
2. Change `NODE_ENV` to `production`
3. Use strong, unique secrets for JWT and NextAuth
4. Configure MongoDB Atlas with IP restrictions (remove `0.0.0.0/0`)
5. Build the Next.js application: `npm run build`
6. Deploy to Vercel, Netlify, or similar platform
7. Configure environment variables in your hosting platform's dashboard

### Security Checklist
- ✅ Never commit `.env` files
- ✅ Use strong, unique passwords for database
- ✅ Restrict MongoDB Atlas network access
- ✅ Use environment-specific secrets
- ✅ Enable HTTPS in production

## 📖 Database Schema

### Core Entities
- **Customer**: User profiles and authentication
- **Vendor**: Seller accounts and verification
- **Product**: Product catalog with images and details
- **Category**: Product categorization
- **Order**: Customer orders with status tracking
- **OrderItem**: Individual items in orders
- **Payment**: Payment processing with Mobile Money support
- **Shipping**: Delivery tracking with local couriers
- **Review**: Product reviews and ratings
- **Cart/CartItem**: Shopping cart functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify MongoDB Atlas credentials in `.env` file
   - Check network access settings in MongoDB Atlas
   - Ensure correct database URL format
   - Verify database user has proper permissions

2. **Prisma Client Issues**:
   - Run `npm run db:generate` to regenerate client
   - Check schema syntax
   - Verify environment variables

3. **Environment Variables Not Loading**:
   - Check .env file location and format
   - Ensure no trailing spaces or special characters
   - Restart the server after changes

### Support

For questions and support, please create an issue in the repository or contact the development team.

---

## 🔐 Admin Access

To access admin features:
1. Visit the live application: [https://gomartgh.onrender.com/](https://gomartgh.onrender.com/)
2. Navigate to the login page
3. Use the following credentials:
   - **Email:** `admin@gmail.com`
   - **Password:** `12345`
4. Once logged in as admin, you can:
   - Access the admin dashboard
   - Create, edit, delete, and update products
   - Manage categories
   - View all orders and customer data

**Note:** Regular users can create accounts, view products, and make purchases, but only the admin account has access to product management features.

---

**GoMart** - Empowering Ghana's Digital Economy 🇬🇭  
**Developed by:** Famous Akpovogbeta (Roll Number: 10211100297)