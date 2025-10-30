# 📁 AlgoGator Project Structure

This document provides a comprehensive overview of the project's file organization and structure.

---

## 🌳 Directory Tree

```
algogator/
│
├── 📄 Root Configuration Files
│   ├── package.json              # NPM dependencies and scripts
│   ├── hardhat.config.js         # Hardhat configuration
│   ├── .gitignore               # Git ignore rules
│   ├── README.md                # Main project documentation
│   └── PROJECT_STRUCTURE.md     # This file
│
├── 📜 contracts/                 # Smart Contracts (Solidity)
│   ├── DexAggregator.sol        # Main aggregator contract
│   ├── AMM.sol                  # Automated Market Maker
│   ├── Token.sol                # ERC-20 token (for tests)
│   ├── WorkingToken.sol         # Token with 2-step initialization
│   └── interfaces/              # Contract interfaces
│       └── IAMM.sol             # AMM interface definition
│
├── 🚀 scripts/                   # Deployment & Utility Scripts
│   ├── deploy_all.js            # ⭐ Main deployment script
│   └── seed.js                  # Seed data utility (optional)
│
├── 🧪 test/                      # Test Suite
│   ├── DexAggregator.js         # Aggregator tests (20+ cases)
│   ├── AMM.js                   # AMM contract tests
│   └── Token.js                 # Token contract tests
│
├── 💻 src/                       # React Frontend
│   ├── components/              # React components
│   │   ├── App.js              # Main app component
│   │   ├── Aggregator.js       # ⭐ Aggregator interface
│   │   ├── Swap.js             # DEX 1 interface
│   │   ├── Deposit.js          # Add liquidity
│   │   ├── Withdraw.js         # Remove liquidity
│   │   ├── Charts.js           # Trading analytics
│   │   ├── Navigation.js       # Top navigation
│   │   ├── Tabs.js             # Tab navigation
│   │   ├── Alert.js            # Alert component
│   │   └── Loading.js          # Loading spinner
│   │
│   ├── store/                   # Redux State Management
│   │   ├── store.js            # Redux store configuration
│   │   ├── interactions.js     # Blockchain interactions
│   │   ├── selectors.js        # State selectors
│   │   └── reducers/           # Redux reducers
│   │       ├── provider.js     # Provider state
│   │       ├── tokens.js       # Token state
│   │       └── amm.js          # AMM state
│   │
│   ├── abis/                    # Contract ABIs (auto-generated)
│   │   ├── DexAggregator.json
│   │   ├── AMM.json
│   │   └── Token.json
│   │
│   ├── config.json              # Contract addresses configuration
│   ├── index.js                 # React entry point
│   ├── index.css                # Global styles
│   ├── logo.png                 # Logo image
│   ├── logo.svg                 # Logo SVG
│   └── reportWebVitals.js       # Performance monitoring
│
├── 📚 docs/                      # Documentation
│   ├── README.md                # Detailed documentation
│   ├── QUICK_START.md           # Quick reference guide
│   ├── DEPLOYMENT_GUIDE.md      # Deployment instructions
│   ├── IMPROVEMENTS.md          # v2.0 improvements log
│   └── CHANGELOG.md             # Version history
│
├── 🌐 public/                    # Static Assets
│   ├── index.html               # HTML template
│   ├── favicon.ico              # Favicon
│   ├── logo192.png              # App icon (192x192)
│   ├── logo512.png              # App icon (512x512)
│   ├── manifest.json            # PWA manifest
│   └── robots.txt               # Search engine rules
│
└── 🔧 Generated/Build Folders (gitignored)
    ├── node_modules/            # NPM dependencies
    ├── artifacts/               # Compiled contracts
    ├── cache/                   # Hardhat cache
    └── coverage/                # Test coverage reports
```

---

## 📂 Key Directories Explained

### **contracts/** - Smart Contracts

Contains all Solidity smart contracts:

- **`DexAggregator.sol`** - The heart of the project. Compares prices across AMMs and routes trades to the best one.
- **`AMM.sol`** - Constant product market maker (x * y = k). Handles liquidity and swaps.
- **`Token.sol`** - Basic ERC-20 token used in tests.
- **`WorkingToken.sol`** - Token with 2-step initialization (used in deployment).
- **`interfaces/IAMM.sol`** - Interface that allows aggregator to interact with any AMM.

**Purpose:** Core blockchain logic and business rules.

---

### **scripts/** - Deployment Scripts

Automation scripts for deploying contracts:

- **`deploy_all.js`** ⭐ - **MAIN SCRIPT** - Deploys entire system in one command
  - Deploys tokens (DAPP, USD)
  - Deploys AMM1 and AMM2
  - Deploys DexAggregator
  - Saves addresses to `src/config.json`

- **`seed.js`** - Optional utility to seed pools with liquidity

**Usage:**
```bash
npx hardhat run scripts/deploy_all.js --network localhost
```

---

### **test/** - Test Suite

Comprehensive test coverage:

- **`DexAggregator.js`** - 20+ tests for aggregator
  - Deployment validation
  - Price comparison
  - Slippage protection
  - Deadline enforcement
  - Pause mechanism
  - Edge cases

- **`AMM.js`** - AMM functionality tests
  - Liquidity management
  - Swap calculations
  - Share distribution

- **`Token.js`** - Token contract tests
  - Transfers
  - Approvals
  - Allowances

**Run Tests:**
```bash
npx hardhat test
```

---

### **src/** - React Frontend

Modern React application with Redux state management:

#### **components/**
- **`Aggregator.js`** ⭐ - Main aggregator interface with slippage settings
- **`Swap.js`** - Direct DEX trading interface
- **`Deposit.js`** - Add liquidity to pools
- **`Withdraw.js`** - Remove liquidity from pools
- **`Charts.js`** - Trading analytics and charts
- **`Navigation.js`** - Top navigation bar
- **`App.js`** - Main app structure and routing

#### **store/**
Redux state management:
- **`interactions.js`** - All blockchain interaction logic
- **`store.js`** - Redux store configuration
- **`selectors.js`** - Reusable state selectors
- **`reducers/`** - State slice reducers

#### **abis/**
Auto-generated contract ABIs (JSON files). These are created when you compile contracts:
```bash
npx hardhat compile
```

#### **config.json**
Contract addresses for different networks:
```json
{
  "31337": {
    "tokens": { ... },
    "amms": { ... },
    "aggregator": { ... }
  }
}
```

---

### **docs/** - Documentation

All documentation moved to dedicated folder:

- **`README.md`** - Comprehensive project documentation
- **`QUICK_START.md`** - 5-minute quick start guide
- **`DEPLOYMENT_GUIDE.md`** - Step-by-step deployment
- **`IMPROVEMENTS.md`** - v2.0 security enhancements
- **`CHANGELOG.md`** - Version history and migration guides

**Why separate docs folder?**
- Cleaner root directory
- Easier to find documentation
- Professional organization
- Can add more docs without cluttering root

---

### **public/** - Static Assets

React public files:

- **`index.html`** - HTML template
- **`manifest.json`** - PWA configuration
- **`favicon.ico`**, **`logo192.png`**, **`logo512.png`** - App icons
- **`robots.txt`** - SEO configuration

---

## 🎯 File Purposes

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies, scripts, project metadata |
| `hardhat.config.js` | Hardhat network settings, Solidity version |
| `.gitignore` | Files/folders excluded from git |
| `src/config.json` | Deployed contract addresses by network |

### NPM Scripts (package.json)

```json
{
  "start": "react-scripts start",        // Start frontend dev server
  "build": "react-scripts build",        // Build for production
  "test": "react-scripts test",          // Run React tests
  "node": "hardhat node",                // Start local blockchain
  "deploy": "hardhat run scripts/deploy_all.js --network localhost"
}
```

---

## 🔄 Typical Workflow

### 1. **Initial Setup**
```bash
npm install                              # Install dependencies
```

### 2. **Development**
```bash
# Terminal 1: Start blockchain
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy_all.js --network localhost

# Terminal 3: Start frontend
npm start
```

### 3. **Testing**
```bash
npx hardhat test                         # Run all tests
npx hardhat test test/DexAggregator.js  # Run specific suite
```

### 4. **Deployment**
```bash
# Compile contracts first
npx hardhat compile

# Deploy to network
npx hardhat run scripts/deploy_all.js --network <network>
```

---

## 🚫 What's NOT in Git (.gitignore)

The following are excluded from version control:

### Generated Files
- `node_modules/` - NPM packages (recreated via `npm install`)
- `artifacts/` - Compiled contracts (recreated via `npx hardhat compile`)
- `cache/` - Hardhat cache
- `coverage/` - Test coverage reports

### Temporary Files
- `*-addresses.json` - Deployment addresses (regenerated each deploy)
- `complete-deployment.json` - Temporary deployment info
- Build files and logs

### Environment Files
- `.env` - Private keys and API keys (NEVER commit!)
- `.env.local`, `.env.production`

### IDE/OS Files
- `.vscode/`, `.idea/` - Editor settings
- `.DS_Store` - macOS metadata
- `*.Zone.Identifier` - Windows metadata

---

## 📦 Dependency Categories

### Smart Contract Development
- `hardhat` - Development framework
- `@nomicfoundation/hardhat-toolbox` - Testing tools
- `@openzeppelin/contracts` - Security contracts

### Frontend
- `react`, `react-dom` - UI framework
- `@reduxjs/toolkit`, `react-redux` - State management
- `ethers` - Blockchain interaction
- `react-router-dom` - Routing
- `bootstrap`, `react-bootstrap` - UI components

### Testing & Utilities
- `chai` - Assertions
- `lodash` - Utilities
- `date-fns` - Date handling

---

## 🔑 Key Files to Know

### **For Development**
1. `contracts/DexAggregator.sol` - Main smart contract
2. `src/components/Aggregator.js` - Main UI component
3. `src/store/interactions.js` - Blockchain interaction logic
4. `scripts/deploy_all.js` - Deployment script

### **For Configuration**
1. `hardhat.config.js` - Network settings
2. `src/config.json` - Contract addresses
3. `.env` - Private keys (create this yourself!)

### **For Documentation**
1. `README.md` - Start here
2. `docs/QUICK_START.md` - Quick reference
3. `docs/IMPROVEMENTS.md` - What changed in v2.0

---

## 🎨 Frontend Routing

| URL | Component | Description |
|-----|-----------|-------------|
| `/` | `Swap.js` | DEX 1 trading interface |
| `/aggregator` | `Aggregator.js` | ⭐ Best price finder |
| `/deposit` | `Deposit.js` | Add liquidity |
| `/withdraw` | `Withdraw.js` | Remove liquidity |
| `/charts` | `Charts.js` | Trading analytics |

---

## 🔒 Security Files

### Smart Contracts
- Use OpenZeppelin imports for security
- ReentrancyGuard in `DexAggregator.sol`
- Pausable emergency mechanism
- Ownable access control

### Environment Security
- `.env` for private keys (NEVER commit!)
- `.gitignore` excludes sensitive files
- No hardcoded credentials

---

## 📊 Build Output

When you build/compile, these are generated:

```
artifacts/
├── contracts/
│   ├── DexAggregator.sol/
│   │   └── DexAggregator.json    # ABI + bytecode
│   ├── AMM.sol/
│   └── Token.sol/
└── build-info/                    # Compilation metadata

cache/
├── solidity-files-cache.json     # Compilation cache
└── console-history.txt            # Console logs
```

---

## 🎓 Learning Path

**New to the project? Read in this order:**

1. `README.md` - Project overview
2. `docs/QUICK_START.md` - Get it running
3. `contracts/DexAggregator.sol` - Understand the core logic
4. `src/components/Aggregator.js` - See how UI interacts
5. `docs/IMPROVEMENTS.md` - Learn about v2.0 enhancements
6. `test/DexAggregator.js` - See comprehensive examples

---

## 🛠️ Maintenance

### Adding New Contracts
1. Create `.sol` file in `contracts/`
2. Import in deployment script
3. Add tests in `test/`
4. Update ABIs in `src/abis/`
5. Document in this file

### Adding New Features
1. Update smart contracts if needed
2. Update frontend components
3. Add tests
4. Update documentation
5. Update CHANGELOG.md

---

**Last Updated:** 2025-10-29  
**Version:** 2.0.0
