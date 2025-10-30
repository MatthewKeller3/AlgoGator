# ✅ AlgoGator Startup Checklist

## **Every Time You Start the Project:**

### **Terminal 1 - Start Hardhat Node**
```bash
cd /home/kelchain/algogator
npx hardhat node
```
✅ Leave this running

---

### **Terminal 2 - Deploy & Setup**

**1. Deploy Contracts**
```bash
npx hardhat run scripts/deploy_all.js --network localhost
```

**2. Mint Test Tokens**
```bash
npx hardhat run scripts/mint_tokens.js --network localhost
```

**3. Start Frontend**
```bash
npm start
```
✅ Opens at http://localhost:3000

---

### **MetaMask Setup**

**4. Reset MetaMask** (if restarted node)
- Settings → Advanced → "Clear activity tab data"

**5. Connect MetaMask**
- Network: Localhost 8545 (http://127.0.0.1:8545, Chain ID: 31337)
- Click "Connect Wallet" on the site

---

### **Initial Setup (First Time Using)**

**6. Add Liquidity to AMM1**
- Go to Deposit tab
- Select AMM1 (ETH/USD)
- Enter amounts (e.g., 100 ETH, 100 USD)
- Click Deposit

**7. Add Liquidity to AMM2**
- Select AMM2 (OP/USD)
- Enter amounts (e.g., 100 OP, 100 USD)
- Click Deposit

---

### **✨ Ready to Use!**
- Swap tab - Direct swaps
- Aggregator tab - Best rate finder
- Charts tab - View analytics

---

## **Common Issues & Solutions**

### **MetaMask Connection Error After Node Restart**
- **Solution**: Reset MetaMask account (Settings → Advanced → Clear activity tab data)

### **"Contract not found" Error**
- **Solution**: Redeploy contracts with `npx hardhat run scripts/deploy_all.js --network localhost`

### **"Insufficient balance" Error**
- **Solution**: Run `npx hardhat run scripts/mint_tokens.js --network localhost`

### **Pool Empty Warning**
- **Solution**: Add liquidity to both AMM1 and AMM2 pools

---

## **Hardhat Test Accounts**

When you start the node, you'll see 20 accounts. Import any into MetaMask:

**Account #1:**
- Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

Each account starts with 10,000 ETH on the local network.

---

**Project Location:** `/home/kelchain/algogator`

**Quick Start Command:**
```bash
cd /home/kelchain/algogator && npx hardhat node
```
