# Ecommerce API

A comprehensive ecommerce REST API built with Node.js, Express.js, and MongoDB featuring authentication, product management, shopping cart, orders, and reviews.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Password hashing with bcrypt
  - Password reset functionality

- **Product Management**
  - CRUD operations for products
  - Category management
  - Product search and filtering
  - Image upload support
  - Inventory tracking
  - Product reviews and ratings

- **Shopping Cart**
  - Add/remove items
  - Update quantities
  - Persistent cart storage

- **Order Management**
  - Create orders from cart
  - Order status tracking
  - Payment integration ready
  - Order history

- **User Management**
  - User profiles
  - Address management
  - Admin user management

- **Security Features**
  - Rate limiting
  - CORS protection
  - Helmet security headers
  - Input validation with Joi
  - MongoDB injection protection

## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ecommerce-api
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Update the `.env` file with your configuration:
\`\`\`env
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
\`\`\`

5. Start MongoDB service on your machine

6. Seed the database (optional):
\`\`\`bash
node scripts/seed-database.js
\`\`\`

7. Start the server:
\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgotpassword` - Forgot password

### Products
- `GET /api/products` - Get all products (with pagination, search, filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `GET /api/products/featured/list` - Get featured products

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:productId` - Update cart item quantity
- `DELETE /api/cart/items/:productId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/pay` - Update order to paid
- `GET /api/orders` - Get all orders (Admin only)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID (Admin only)
- `DELETE /api/users/:id` - Deactivate user (Admin only)

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews/product/:productId` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

## Request/Response Examples

### Register User
\`\`\`bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
\`\`\`

### Login User
\`\`\`bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
\`\`\`

### Create Product (Admin)
\`\`\`bash
POST /api/products
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Sample Product",
  "description": "This is a sample product",
  "price": 99.99,
  "category": "category_id_here",
  "brand": "Sample Brand",
  "sku": "SAMPLE001",
  "inventory": {
    "quantity": 50,
    "lowStockThreshold": 10
  },
  "tags": ["sample", "product"]
}
\`\`\`

### Add to Cart
\`\`\`bash
POST /api/cart/items
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "productId": "product_id_here",
  "quantity": 2
}
\`\`\`

## Error Handling

The API uses consistent error response format:

\`\`\`json
{
  "success": false,
  "message": "Error message here",
  "errors": "Detailed validation errors (if applicable)"
}
\`\`\`

## Security Considerations

1. **Environment Variables**: Never commit `.env` file to version control
2. **JWT Secret**: Use a strong, random JWT secret in production
3. **Database**: Use MongoDB Atlas or secure your local MongoDB instance
4. **HTTPS**: Always use HTTPS in production
5. **Rate Limiting**: Adjust rate limits based on your needs
6. **Input Validation**: All inputs are validated using Joi schemas

## Database Schema

### User
- name, email, password (hashed)
- role (user/admin)
- address, phone
- timestamps

### Product
- name, description, price
- category reference
- brand, sku
- images array
- inventory tracking
- specifications, tags
- SEO fields

### Category
- name, description
- slug (auto-generated)
- parent category support
- SEO fields

### Order
- user reference
- order items array
- shipping address
- payment information
- status tracking
- timestamps

### Cart
- user reference
- items array with product references
- auto-calculated totals

### Review
- user and product references
- rating (1-5)
- title and comment
- verified purchase flag

## Development

### Running Tests
\`\`\`bash
npm test
\`\`\`

### Code Structure
\`\`\`
├── models/          # Mongoose models
├── routes/          # Express routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── scripts/         # Database scripts
└── server.js        # Main server file
\`\`\`

## Deployment

1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Configure environment variables for production
3. Deploy to your preferred platform (Heroku, AWS, DigitalOcean, etc.)
4. Set up SSL certificate
5. Configure domain and DNS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
