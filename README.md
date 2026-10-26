# 🔗 Blockchain-Based Job Offer & Employment Verification System

> **DEMO DISCLAIMER**: This is a college final-year demonstration project. All companies and candidates are fictional. Blockchain records are maintained on a local Hardhat network or Sepolia testnet. This does not constitute legal employment verification.

A full-stack decentralized application (dApp) that enables companies to issue tamper-resistant digital job offers and allows candidates, recruiters, and organizations to cryptographically verify those offers on the Ethereum blockchain.

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Blockchain | Ethereum / Hardhat local network |
| Smart Contract | Solidity 0.8.19 |
| Blockchain SDK | Ethers.js v6 |
| Wallet | MetaMask |
| Authentication | JWT + bcryptjs |
| Document Security | SHA-256 (Node.js `crypto`) |
| QR Codes | `qrcode` npm package |

---

## 📂 Project Structure

```
blockchain-job-verification/
├── contracts/
│   └── JobOfferVerification.sol     # Solidity smart contract
├── scripts/
│   └── deploy.js                    # Hardhat deploy script
├── test/
│   └── JobOfferVerification.test.js # Contract test suite
├── deployments/                     # Auto-generated deployment records
├── server/                          # Express.js backend
│   ├── index.js                     # App entry point
│   ├── models/                      # Mongoose schemas
│   ├── routes/                      # API route handlers
│   ├── middleware/                   # Auth, role, upload, audit
│   ├── services/                    # Blockchain, hash, QR services
│   └── uploads/                     # Uploaded documents (local)
├── client/                          # React frontend
│   └── src/
│       ├── pages/                   # All page components
│       ├── components/              # Reusable UI components
│       ├── context/                 # AuthContext
│       ├── services/                # API client
│       └── hooks/                   # Custom React hooks
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 18.x
- MongoDB (running locally or Atlas URI)
- MetaMask browser extension
- Git

### Step 1 — Clone & Install Root Dependencies

```bash
git clone <repo-url>
cd "Blockchain Based Job Offer and Employment Verification System"

# Install Hardhat dependencies
npm install
```

### Step 2 — Install Server Dependencies

```bash
cd server
npm install
cd ..
```

### Step 3 — Install Client Dependencies

```bash
cd client
npm install
cd ..
```

### Step 4 — Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env                   # Root (for Hardhat)
cp .env.example server/.env            # Server
cp .env.example client/.env            # Client (use VITE_ prefix vars)
```

Edit `server/.env` at minimum:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blockchain_job_verification
JWT_SECRET=your_very_long_secret_key_here
CONTRACT_ADDRESS=                   # Will be filled after deployment
OWNER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://127.0.0.1:8545
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=               # Will be filled after deployment
VITE_NETWORK_ID=31337
```

### Step 5 — Compile Smart Contract

```bash
npm run compile
```

You should see: `✔ Compilation finished successfully`

### Step 6 — Start Local Blockchain Node

Open a **new terminal** and keep it running:
```bash
npm run node
```

This starts a local Hardhat blockchain on `http://127.0.0.1:8545` with 20 funded test accounts.

**Copy Account #0's private key** (shown in the terminal) to `server/.env` as `OWNER_PRIVATE_KEY`.

### Step 7 — Deploy the Smart Contract

In the original terminal:
```bash
npm run deploy:local
```

The contract address is printed and **automatically saved** to `server/.env` and `client/.env`.

### Step 8 — Run Smart Contract Tests

```bash
npm run test:contracts
```

Expected: **All 25+ tests passing** ✅

### Step 9 — Start the Backend Server

```bash
cd server
npm run dev
```

Server starts on `http://localhost:5000`. You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

### Step 10 — Start the Frontend

```bash
cd client
npm run dev
```

Frontend starts on `http://localhost:5173`. Open this in your browser.

---

## 🦊 MetaMask Setup (for Employers)

1. Install [MetaMask](https://metamask.io) browser extension
2. Add Hardhat Local Network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
3. Import an employer test account:
   - Use **Account #1** private key from Hardhat node output
   - e.g., `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

---

## 👤 User Roles & Demo Workflow

### Admin Setup
The admin account is the first registered user with role `admin`. Or seed:
```
Email: admin@demo.com
Password: Admin@1234
Role: admin
```

### Demo Workflow

```
1. Register as EMPLOYER  
   → Login → Create Company Profile (submit for admin approval)

2. Login as ADMIN  
   → Approve company  
   → Register employer wallet on blockchain (enter MetaMask wallet address)

3. Back as EMPLOYER  
   → Create Job Offer (fill all fields)
   → Upload offer letter PDF → SHA-256 hash generated
   → Click "Register on Blockchain" → MetaMask prompt → Confirm tx
   → QR code generated

4. Register as CANDIDATE (use the email from the job offer)  
   → Login → See received offer
   → Accept the offer

5. Anyone → Visit /verify  
   → Enter Offer ID → See blockchain-verified result  
   → OR upload the offer PDF → auto-verify hash
```

---

## 🔌 API Reference

### Authentication
```
POST /api/auth/register     Body: { name, email, password, role }
POST /api/auth/login        Body: { email, password }
GET  /api/auth/me           Header: Authorization: Bearer <token>
```

### Employer
```
POST /api/employer/company              Create company
GET  /api/employer/offers               List my offers
POST /api/employer/offers               Create offer
GET  /api/employer/offers/:id           Get offer detail
POST /api/employer/offers/:id/blockchain  Register on blockchain
POST /api/employer/offers/:id/revoke    Revoke offer
GET  /api/employer/stats                Dashboard stats
```

### Candidate
```
GET /api/candidate/offers               View received offers
PUT /api/candidate/offers/:id/respond   Body: { response: "accepted"|"rejected" }
```

### Public Verification
```
GET  /api/verify/offer/:offerId         Verify by offer ID
POST /api/verify/hash                   Body: { offerId, documentHash }
POST /api/verify/upload-and-verify      FormData: { document, offerId }
POST /api/verify/employment/:offerId    Body: { verifierName, verifierOrganization, purpose }
```

### Admin
```
GET  /api/admin/users                   List users
GET  /api/admin/companies               List companies
PUT  /api/admin/companies/:id/verify    Body: { status: "approved"|"rejected" }
POST /api/admin/blockchain/register-employer  Body: { walletAddress }
GET  /api/admin/audit-logs              Audit log
GET  /api/admin/stats                   Platform stats
```

### Upload
```
POST /api/upload/document    FormData: { document }  → Returns SHA-256 hash
```

---

## 🧪 Testing

### Smart Contract Tests
```bash
npm run test:contracts
```

Covers:
- Contract deployment & ownership
- Employer registration & access control
- Offer registration & replay protection
- Offer verification & forgery detection
- Offer revocation & post-revocation checks
- Employment verification records
- Full end-to-end lifecycle test

### Backend Tests
```bash
cd server && npm test
```

---

## 🔐 Security Notes

- **No personal data on blockchain**: Only SHA-256 hashes and employer wallet addresses are stored on-chain
- **JWT authentication**: All protected routes require valid JWT
- **Role-based access control**: Strict role enforcement on every route
- **Input validation**: All API inputs validated with `express-validator`
- **Rate limiting**: Auth routes limited to 15 requests/15 minutes
- **File upload restrictions**: Only PDF/PNG/JPG, max 5MB
- **Password hashing**: bcryptjs with 12 salt rounds
- **Helmet.js**: Security HTTP headers on all responses

---

## 🌐 Sepolia Testnet Deployment

1. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com)
2. Get an Infura/Alchemy API key
3. Update `.env`:
   ```env
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   PRIVATE_KEY=your_wallet_private_key_without_0x
   ```
4. Deploy: `npm run deploy:sepolia`
5. Update `server/.env` and `client/.env` with the new contract address and chain ID `11155111`

---

## 📜 License

MIT — For educational and demonstration purposes only.

---

*Built with ❤️ for a College Final Year Project Demonstration*
