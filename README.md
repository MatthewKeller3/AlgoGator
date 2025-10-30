# 🎯 AlgoGator - DEX Aggregator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)](https://hardhat.org/)

> **Advanced DEX Aggregator finding the best rates across multiple AMMs - Similar to 1inch**

AlgoGator is a production-ready decentralized exchange aggregator that automatically finds and executes trades at the best available rates across multiple Automated Market Makers (AMMs).

---

## ✨ Features

### 🔒 Security First
- ✅ **Slippage Protection** - User-configurable tolerance (0.1% - 50%)
- ✅ **Deadline Protection** - Auto-expiring transactions (10 min default)
- ✅ **Reentrancy Guards** - OpenZeppelin protection
- ✅ **Pausable Contract** - Emergency stop mechanism
- ✅ **Access Control** - Owner-only administrative functions

### 💎 User Experience
- ✅ **Price Impact Warnings** - Visual alerts for high-impact trades
- ✅ **Best Route Finding** - Automatic routing to best DEX
- ✅ **One-Click Approvals** - Streamlined token approval flow
- ✅ **Real-time Comparison** - Live price comparison across AMMs
- ✅ **Modern UI** - Beautiful React interface with Bootstrap

### ⚡ Performance
- ✅ **Gas Optimized** - Immutable variables, custom errors
- ✅ **Comprehensive Tests** - 20+ test cases
- ✅ **Production Ready** - Full documentation and best practices

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ and npm
- MetaMask wallet

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd algogator

# Install dependencies
npm install

# Start local blockchain (Terminal 1)
npx hardhat node

# Deploy contracts (Terminal 2)
npx hardhat run scripts/deploy_all.js --network localhost

# Run tests
npx hardhat test

# Start frontend (Terminal 3)
npm start
```

### MetaMask Configuration
```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

---

## 📁 Project Structure

```
algogator/
├── contracts/              # Smart contracts
│   ├── DexAggregator.sol  # Main aggregator
│   ├── AMM.sol            # Automated Market Maker
│   ├── Token.sol          # ERC-20 token
│   └── interfaces/        # Contract interfaces
├── scripts/               # Deployment scripts
│   ├── deploy_all.js     # One-command deployment
│   └── seed.js           # Seed data utility
├── test/                  # Test suite
│   ├── DexAggregator.js  # Aggregator tests
│   ├── AMM.js            # AMM tests
│   └── Token.js          # Token tests
├── src/                   # React frontend
│   ├── components/       # React components
│   ├── store/            # Redux state management
│   └── abis/             # Contract ABIs
├── docs/                  # Documentation
│   ├── README.md         # Main documentation
│   ├── QUICK_START.md    # Quick reference
│   ├── DEPLOYMENT_GUIDE.md
│   ├── IMPROVEMENTS.md   # v2.0 improvements
│   └── CHANGELOG.md      # Version history
└── public/               # Static assets
```

---

## 🎯 Core Functionality

### How It Works

1. **User submits swap request** with slippage tolerance
2. **Aggregator queries all AMMs** for rates
3. **Best route is identified** automatically
4. **Slippage protection applied** (minAmountOut calculated)
5. **Trade executed** on optimal DEX
6. **User receives tokens** with guaranteed minimum amount

### Smart Contract API

```solidity
// Swap with slippage and deadline protection
function swapToken1ForToken2(
    uint256 amount,
    uint256 minAmountOut,  // Slippage protection
    uint256 deadline       // Deadline protection
) external nonReentrant whenNotPaused returns (uint256 received)

// Get best available rate
function getBestRateToken1ToToken2(uint256 amount) 
    public view returns (address bestDex, uint256 expectedReturn)
```

---

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run specific test suite
npx hardhat test test/DexAggregator.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

**Test Coverage:**
- ✅ Deployment validation
- ✅ Price comparison logic
- ✅ Slippage protection
- ✅ Deadline enforcement
- ✅ Emergency pause
- ✅ Token recovery
- ✅ Edge cases

---

## 🌐 Available Routes

| Route | Description |
|-------|-------------|
| `/` | DEX 1 Interface |
| `/aggregator` | 🎯 **Best Price Finder** |
| `/deposit` | Add Liquidity |
| `/withdraw` | Remove Liquidity |
| `/charts` | Trading Analytics |

---

## 📊 Example Usage

### Frontend Integration

```javascript
import { ethers } from 'ethers'
import { swapViaAggregator } from './store/interactions'

// Set parameters
const amount = ethers.utils.parseEther("100")
const minAmountOut = amount.mul(995).div(1000) // 0.5% slippage
const slippageTolerance = 0.5

// Execute swap
await swapViaAggregator(
  provider,
  aggregatorContract,
  'Token1',
  amount,
  minAmountOut,
  slippageTolerance,
  dispatch
)
```

### Direct Contract Interaction

```javascript
const deadline = Math.floor(Date.now() / 1000) + 600 // 10 min

const tx = await aggregator.swapToken1ForToken2(
  ethers.utils.parseEther("100"),
  ethers.utils.parseEther("95"), // Min 95 tokens out
  deadline
)

await tx.wait()
```

---

## 🔧 Configuration

### Slippage Settings

```javascript
// Recommended defaults
const SLIPPAGE_PRESETS = {
  STRICT: 0.1,    // For stable pairs
  NORMAL: 0.5,    // Recommended default
  RELAXED: 1.0,   // For larger trades
  CUSTOM: 5.0     // User-defined max 50%
}
```

### Environment Variables

```bash
# Create .env file
PRIVATE_KEY=your_private_key_here
INFURA_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key
```

---

## 📈 Gas Optimization

| Feature | Gas Saved | Impact |
|---------|-----------|---------|
| Immutable variables | ~2,100/call | High |
| Custom errors | ~50/revert | Medium |
| Efficient conditionals | ~20/check | Low |

---

## 🛡️ Security Features

### Implemented Protections
- ✅ **ReentrancyGuard** - Prevents reentrancy attacks
- ✅ **Slippage Protection** - Guards against front-running
- ✅ **Deadline Checks** - Prevents stale transactions
- ✅ **Pausable** - Emergency circuit breaker
- ✅ **Ownable** - Access control for admin functions

### Recommended Before Mainnet
- ⚠️ **Professional Security Audit** (Trail of Bits, OpenZeppelin, etc.)
- ⚠️ **Extended Testnet Testing** (2+ weeks)
- ⚠️ **Multi-sig Wallet** for owner functions
- ⚠️ **Bug Bounty Program** (Immunefi, etc.)

---

## 📚 Documentation

Comprehensive documentation available in the `/docs` folder:

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Step-by-step deployment
- **[Improvements](docs/IMPROVEMENTS.md)** - v2.0 security enhancements
- **[Changelog](docs/CHANGELOG.md)** - Version history

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenZeppelin for security contracts
- Hardhat for development framework
- React & Redux for frontend
- Bootstrap for UI components

---

## 📞 Support

- **Documentation**: Check `/docs` folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

## 🎯 Roadmap

### v2.1.0 (Planned)
- [ ] Multi-hop routing (A → B → C)
- [ ] Support for 3+ AMMs
- [ ] Advanced analytics dashboard
- [ ] Historical swap data

### v2.2.0 (Future)
- [ ] Cross-chain aggregation
- [ ] MEV protection
- [ ] Limit orders
- [ ] Advanced trading features

### v3.0.0 (Vision)
- [ ] Layer 2 support
- [ ] Governance token
- [ ] DAO structure
- [ ] Revenue sharing model

---

**Built with ❤️ for the DeFi community**

**Version:** 2.0.0  
**Status:** Production-Ready (Audit Pending)
