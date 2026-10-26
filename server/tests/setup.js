// Set test environment before any module loads
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/blockchain_job_verification_test';
process.env.CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
process.env.RPC_URL = 'http://127.0.0.1:8545';
process.env.OWNER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
