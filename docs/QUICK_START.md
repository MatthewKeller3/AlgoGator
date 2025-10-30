# 🚀 AlgoGator Quick Start Guide

## TL;DR - Get Running in 5 Minutes

```bash
# 1. Install dependencies
npm install

# 2. Start local blockchain (Terminal 1)
npx hardhat node

# 3. Deploy contracts (Terminal 2)
npx hardhat run scripts/deploy_all.js --network localhost

# 4. Run tests
npx hardhat test

# 5. Start frontend (Terminal 3)
npm start
```

---

## 📦 What's Included

### Smart Contracts
- **DexAggregator** - Finds best rates across multiple AMMs
- **AMM** - Constant product market maker (x * y = k)
- **Token** - ERC-20 token implementation

### Frontend
- **Aggregator Interface** - Best price finder
- **DEX 1/2 Interfaces** - Direct AMM trading
- **Liquidity Management** - Deposit/Withdraw
- **Charts** - Trading analytics

---

## 🎯 Key Features (v2.0.0)

### Security ✅
- Slippage protection (0.1% - 50% configurable)
- Deadline protection (auto 10-minute expiry)
- ReentrancyGuard protection
- Emergency pause mechanism
- Token approval flow

### User Experience ✅
- Price impact warnings
- Minimum received display
- One-click slippage presets
- Automatic approval detection
- Real-time rate comparison

---

## 🔧 Common Tasks

### Deploy Fresh Contracts
```bash
npx hardhat run scripts/deploy_all.js --network localhost
```

### Run Specific Tests
```bash
# Test aggregator only
npx hardhat test test/DexAggregator.js

# Test AMM only
npx hardhat test test/AMM.js

# Test all
npx hardhat test
```

### Add Test Liquidity
1. Go to **Deposit** tab
2. AMM1: Add `1000 Token1 + 2000 Token2` (1:2 ratio)
3. AMM2: Add `1000 Token1 + 1500 Token2` (1:1.5 ratio)
4. This creates price differences for testing

### Test Aggregator
1. Go to **Aggregator** tab
2. Set slippage (e.g., 0.5%)
3. Enter swap amount (e.g., 100 tokens)
4. Check price impact warning
5. Approve tokens (first time only)
6. Execute swap

---

## ⚙️ Configuration

### MetaMask Setup
```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH
```

### Slippage Settings
- **0.1%** - Very strict (may fail in volatile markets)
- **0.5%** - Recommended default
- **1.0%** - Relaxed (for larger trades)
- **Custom** - Advanced users

### Price Impact Thresholds
- **< 5%** - ✅ Safe (green indicator)
- **> 5%** - ⚠️ Caution (yellow warning)
- **> 10%** - 🛑 High impact (consider smaller amount)

---

## 🧪 Testing Checklist

### Before Each Test
- [ ] Hardhat node running
- [ ] Contracts deployed
- [ ] MetaMask connected to localhost
- [ ] Test account imported

### Functionality Tests
- [ ] Add liquidity to both AMMs
- [ ] Swap on DEX 1 interface
- [ ] Swap on DEX 2 interface
- [ ] Compare prices on Aggregator
- [ ] Execute aggregator swap
- [ ] Check price impact warnings
- [ ] Test slippage protection
- [ ] Remove liquidity

### Edge Cases
- [ ] Very large swap (high price impact)
- [ ] Very small swap (minimal amount)
- [ ] Insufficient balance
- [ ] Insufficient allowance
- [ ] Expired deadline (shouldn't happen with auto-deadline)

---

## 🐛 Troubleshooting

### "Transaction Reverted"
**Causes:**
- Insufficient slippage tolerance
- Deadline expired
- Not enough token balance
- Token not approved

**Solutions:**
1. Increase slippage tolerance
2. Check token balance
3. Approve tokens first
4. Try smaller amount

### "Contract Not Deployed"
```bash
# Redeploy everything
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy_all.js --network localhost
```

### "MetaMask Nonce Too High"
```
MetaMask → Settings → Advanced → Reset Account
```

### Price Impact Too High
**Solutions:**
1. Reduce swap amount
2. Add more liquidity to pools
3. Wait for better rates
4. Accept higher slippage (not recommended)

### Approval Not Working
```javascript
// Check current allowance
await token.allowance(userAddress, aggregatorAddress)

// Should be MaxUint256 after approval
// If not, manually reset:
await token.approve(aggregatorAddress, 0)
await token.approve(aggregatorAddress, MaxUint256)
```

---

## 📊 Understanding the Aggregator

### How It Works
```
User wants: 100 Token1 → Token2

Step 1: Query both AMMs
  AMM1: 100 Token1 → 190 Token2 (1:2 ratio)
  AMM2: 100 Token1 → 142 Token2 (1:1.5 ratio)

Step 2: Find best rate
  Best: AMM2 (142 Token2)

Step 3: Calculate slippage protection
  Slippage: 0.5%
  Min receive: 142 * 0.995 = 141.29 Token2

Step 4: Execute swap on AMM2
  - Transfer 100 Token1 from user to aggregator
  - Approve AMM2 to spend 100 Token1
  - Call AMM2.swapToken1(100)
  - Receive ~142 Token2
  - Transfer Token2 to user
  - Verify: received >= 141.29 ✅
```

### Price Impact Calculation
```javascript
Price Impact = |
  (Best Output / Input) - (Average Output / Input)
| / (Average Output / Input) * 100%

Example:
  AMM1: 190 tokens
  AMM2: 142 tokens
  Average: (190 + 142) / 2 = 166
  Best: 190
  Impact: |190 - 166| / 166 * 100% = 14.5%
```

---

## 🎓 Developer Examples

### Swap with Custom Parameters
```javascript
import { ethers } from 'ethers'

// Calculate minimum output with 1% slippage
const expectedOutput = ethers.utils.parseEther("142.5")
const minOutput = expectedOutput.mul(99).div(100) // 1% slippage

// Set deadline to 10 minutes from now
const deadline = Math.floor(Date.now() / 1000) + 600

// Execute swap
const tx = await aggregator.swapToken1ForToken2(
  ethers.utils.parseEther("100"),  // amount
  minOutput,                        // minAmountOut
  deadline                          // deadline
)

await tx.wait()
```

### Check Best Rate
```javascript
const amount = ethers.utils.parseEther("100")
const [bestDex, expectedReturn] = await aggregator.getBestRateToken1ToToken2(amount)

console.log("Best DEX:", bestDex)
console.log("Expected:", ethers.utils.formatEther(expectedReturn))
```

### Listen to Events
```javascript
// Listen for best route found
aggregator.on("BestRouteFound", (user, dex, inputAmount, outputAmount) => {
  console.log(`Best route for ${user}:`)
  console.log(`  DEX: ${dex}`)
  console.log(`  Input: ${ethers.utils.formatEther(inputAmount)}`)
  console.log(`  Output: ${ethers.utils.formatEther(outputAmount)}`)
})

// Listen for swaps
aggregator.on("SwapExecuted", (user, tokenIn, tokenOut, amountIn, amountOut, dexUsed) => {
  console.log(`Swap executed:`)
  console.log(`  User: ${user}`)
  console.log(`  In: ${ethers.utils.formatEther(amountIn)} ${tokenIn}`)
  console.log(`  Out: ${ethers.utils.formatEther(amountOut)} ${tokenOut}`)
  console.log(`  Via: ${dexUsed}`)
})
```

---

## 📱 Frontend Integration

### Using the Aggregator Component
```jsx
import Aggregator from './components/Aggregator'

function App() {
  return (
    <Router>
      <Route path="/aggregator" element={<Aggregator />} />
    </Router>
  )
}
```

### Custom Slippage Hook
```javascript
const [slippage, setSlippage] = useState(0.5)

// Preset buttons
<Button onClick={() => setSlippage(0.1)}>0.1%</Button>
<Button onClick={() => setSlippage(0.5)}>0.5%</Button>
<Button onClick={() => setSlippage(1.0)}>1.0%</Button>

// Custom input
<input 
  type="number"
  value={slippage}
  onChange={(e) => setSlippage(parseFloat(e.target.value))}
/>
```

---

## 🔐 Security Best Practices

### For Users
1. ✅ Always check price impact before swapping
2. ✅ Use lower slippage for normal trades (0.5%)
3. ✅ Review minimum received amount
4. ✅ Start with small test transactions
5. ✅ Verify token contract addresses

### For Developers
1. ✅ Never hardcode private keys
2. ✅ Use environment variables for sensitive data
3. ✅ Test on testnet before mainnet
4. ✅ Implement rate limiting for API calls
5. ✅ Keep dependencies updated

---

## 📈 Performance Tips

### Gas Optimization
- Batch approvals (approve once with MaxUint256)
- Use aggregator for better rates (saves ~5-15% vs worst AMM)
- Monitor gas prices, trade during low-usage times

### Frontend Performance
- Implement debouncing for input updates
- Cache contract instances
- Use React.memo for expensive components
- Lazy load heavy components

---

## 🎯 Next Steps

1. ✅ Review [IMPROVEMENTS.md](./IMPROVEMENTS.md) for detailed changes
2. ✅ Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment
3. ✅ Read [CHANGELOG.md](./CHANGELOG.md) for version history
4. ⚠️ Schedule security audit before mainnet
5. 🚀 Deploy to testnet for extended testing

---

## 📞 Need Help?

- **Smart Contract Issues**: Check test files for examples
- **Frontend Issues**: Review component source code
- **Deployment Issues**: See DEPLOYMENT_GUIDE.md
- **General Questions**: Check README.md

---

**Happy Building! 🚀**
