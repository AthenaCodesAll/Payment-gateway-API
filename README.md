# 💳 Payment Gateway API

A modern **Dockerized API** built with **TypeScript** and **Express.js** that demonstrates secure payment integration using **Paystack**. Features complete **CI/CD pipeline** and production deployment on **Render**.

**🚀 Live API:** `https://payment-gateway-api-fkgs.onrender.com`

📘 **[Complete API Documentation](https://documenter.getpostman.com/view/45122701/2sB2qak34x)**

## 🔄 How It Works

1. **Initialize Payment** → Generate secure payment link
2. **User Authorization** → Customer completes payment via Paystack  
3. **Verify Transaction** → Confirm payment using reference
4. **Deliver Value** → Provide service/product for verified payments

## ✨ Key Features

- **TypeScript + Express.js** - Type-safe, fast web framework
- **Paystack Integration** - Secure payment processing
- **PostgreSQL + Sequelize** - Robust database with ORM
- **Docker Support** - Containerized development and deployment
- **Production Ready** - Rate limiting, validation, error handling, CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+), Docker Desktop, Paystack Account

### Setup
```bash
# Clone and setup
git clone https://github.com/AthenaCodesAll/payment_gateway_api.git
cd payment_gateway_api
cp .env.example .env  # Edit with your configuration

# Run with Docker
docker-compose up --build

# Test
curl https://localhost:3000
```

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/paystack/initialize` | Initialize payment transaction |
| `GET` | `/api/paystack/verify?reference={ref}` | Verify payment status |
| `GET` | `/api/paystack/status/{id}` | Get payment status by ID |

### Example Usage

**Initialize Payment:**
```bash
curl -X POST https://payment-gateway-api-fkgs.onrender.com/api/paystack/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "amount": 50000,
    "customer_name": "John Doe"
  }'
```

**Verify Payment:**
```bash
curl "https://payment-gateway-api-fkgs.onrender.com/api/paystack/verify?reference=your_payment_reference"
```

## 🛠️ Development

### Local Development
```bash
npm install
npm run dev
```

### Docker Development
```bash
# Start all services
docker-compose up --build

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Testing
```bash
npm test                # Run tests
npm run test:coverage   # With coverage
npm run lint           # Lint code
```

## ⚙️ Configuration

Create `.env` file:
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payment_gateway
DB_USER=postgres
DB_PASSWORD=password

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏗️ Project Structure

```
src/
├── controllers/    # Request handlers
├── middlewares/    # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Helper functions
└── index.ts        # App entry point
```

## 🚀 Deployment

**Render Configuration:**
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Auto-deploy on push to main branch

**Performance:**
- Rate Limiting: 100 requests/15 minutes
- Response Time: <200ms average
- Uptime: 99.9% SLA

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push and open Pull Request

## 👤 Author

**Basirat Popoola**
- 🐙 GitHub: [@AthenaCodesAll](https://github.com/AthenaCodesAll)
- 💼 LinkedIn: [Popoola Bashirah Omotayo](https://www.linkedin.com/in/popoola-bashirah-omotayo)
- 📧 Email: [athenascodes@gmail.com](mailto:athenascodes@gmail.com)

## 📄 License

MIT License - see `LICENSE` file for details.

---

**⭐ Star this repository if you found it helpful!**
 
