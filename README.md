# AlgoGator — DEX Aggregator

**A 1inch-style DEX aggregator: queries multiple AMMs, routes each swap to the best price, and enforces slippage + deadline protection on-chain.** Solidity 0.8.20 · Hardhat · React/Redux.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Tests](https://img.shields.io/badge/tests-20%2B%20passing-green)](test/)

<!-- SCREENSHOT: aggregator comparison view here — docs/screenshot-aggregator.png -->

## How it works

1. User submits a swap with a slippage tolerance (0.1%–50%)
2. The aggregator contract queries every registered AMM for the output amount
3. Best route is selected; `minAmountOut` is computed from the slippage setting
4. Swap executes on the winning AMM inside one transaction, guarded by deadline + reentrancy checks

```solidity
function swapToken1ForToken2(
    uint256 amount,
    uint256 minAmountOut,   // slippage protection
    uint256 deadline        // stale-tx protection
) external nonReentrant whenNotPaused returns (uint256 received);

function getBestRateToken1ToToken2(uint256 amount)
    public view returns (address bestDex, uint256 expectedReturn);
```

## Security design

- **ReentrancyGuard** (OpenZeppelin) on all swap paths
- **Slippage protection** — user-set `minAmountOut` enforced on-chain
- **Deadline checks** — transactions auto-expire (10 min default)
- **Pausable** — emergency circuit breaker
- **Ownable** — admin functions restricted; includes stuck-token recovery
- Gas: immutable variables, custom errors

## Run it locally

```bash
npm install
npx hardhat node                                        # terminal 1
npx hardhat run scripts/deploy_all.js --network localhost   # terminal 2
npm start                                               # terminal 3 → http://localhost:3000
```

MetaMask: RPC `http://127.0.0.1:8545`, chain ID `31337`.

## Testing

```bash
npx hardhat test              # 20+ cases: routing, slippage, deadlines, pause, recovery, edge cases
REPORT_GAS=true npx hardhat test
npx hardhat coverage
```

## Project structure

```
contracts/   DexAggregator.sol · AMM.sol · Token.sol · interfaces/
scripts/     deploy_all.js · seed.js
test/        DexAggregator.js · AMM.js · Token.js
src/         React frontend (components, Redux store, ABIs)
docs/        QUICK_START · DEPLOYMENT_GUIDE · IMPROVEMENTS · CHANGELOG
```

## Status

Feature-complete and fully tested on local/test networks. **Not audited — not intended for mainnet deployment without a professional security review.**

### Roadmap
- Multi-hop routing (A → B → C) and 3+ AMM support
- Public testnet deployment + hosted demo
- Analytics dashboard with historical swap data

## License

MIT
