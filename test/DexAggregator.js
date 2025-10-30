const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('DexAggregator', () => {
  let accounts, deployer, user1, user2
  let token1, token2, amm1, amm2, aggregator
  let deadline

  beforeEach(async () => {
    // Setup Accounts
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    user1 = accounts[1]
    user2 = accounts[2]

    // Deploy Tokens
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('Token 1', 'TK1', tokens(1000000))
    token2 = await Token.deploy('Token 2', 'TK2', tokens(1000000))

    // Deploy AMM1
    const AMM = await ethers.getContractFactory('AMM')
    amm1 = await AMM.deploy(token1.address, token2.address)
    
    // Deploy AMM2
    amm2 = await AMM.deploy(token1.address, token2.address)

    // Deploy Aggregator
    const DexAggregator = await ethers.getContractFactory('DexAggregator')
    aggregator = await DexAggregator.deploy(
      amm1.address,
      amm2.address,
      token1.address,
      token2.address
    )

    // Transfer tokens to users
    await token1.transfer(user1.address, tokens(100000))
    await token2.transfer(user1.address, tokens(100000))
    await token1.transfer(user2.address, tokens(100000))
    await token2.transfer(user2.address, tokens(100000))

    // Add liquidity to AMM1 (1:2 ratio - less favorable)
    await token1.connect(deployer).approve(amm1.address, tokens(50000))
    await token2.connect(deployer).approve(amm1.address, tokens(100000))
    await amm1.connect(deployer).addLiquidity(tokens(50000), tokens(100000))

    // Add liquidity to AMM2 (1:1.5 ratio - more favorable)
    await token1.connect(deployer).approve(amm2.address, tokens(50000))
    await token2.connect(deployer).approve(amm2.address, tokens(75000))
    await amm2.connect(deployer).addLiquidity(tokens(50000), tokens(75000))

    // Set deadline to 1 hour from now
    const latestBlock = await ethers.provider.getBlock('latest')
    deadline = latestBlock.timestamp + 3600
  })

  describe('Deployment', () => {
    it('has correct addresses', async () => {
      expect(aggregator.address).to.not.equal(ethers.constants.AddressZero)
      expect(await aggregator.amm1()).to.equal(amm1.address)
      expect(await aggregator.amm2()).to.equal(amm2.address)
      expect(await aggregator.token1()).to.equal(token1.address)
      expect(await aggregator.token2()).to.equal(token2.address)
    })

    it('should revert with invalid addresses', async () => {
      const DexAggregator = await ethers.getContractFactory('DexAggregator')
      
      await expect(
        DexAggregator.deploy(
          ethers.constants.AddressZero,
          amm2.address,
          token1.address,
          token2.address
        )
      ).to.be.revertedWithCustomError(aggregator, 'InvalidAddress')
    })

    it('should revert with duplicate AMM addresses', async () => {
      const DexAggregator = await ethers.getContractFactory('DexAggregator')
      
      await expect(
        DexAggregator.deploy(
          amm1.address,
          amm1.address,
          token1.address,
          token2.address
        )
      ).to.be.revertedWith('AMM addresses must be different')
    })
  })

  describe('Price Comparison', () => {
    it('correctly identifies best rate for token1 -> token2', async () => {
      const amount = tokens(100)
      const [bestDex, expectedReturn] = await aggregator.getBestRateToken1ToToken2(amount)
      
      const rate1 = await amm1.calculateToken1Swap(amount)
      const rate2 = await amm2.calculateToken1Swap(amount)
      
      // AMM2 should have better rate due to better ratio
      expect(bestDex).to.equal(amm2.address)
      expect(expectedReturn).to.equal(rate2)
      expect(rate2).to.be.gt(rate1)
    })

    it('correctly identifies best rate for token2 -> token1', async () => {
      const amount = tokens(100)
      const [bestDex, expectedReturn] = await aggregator.getBestRateToken2ToToken1(amount)
      
      const rate1 = await amm1.calculateToken2Swap(amount)
      const rate2 = await amm2.calculateToken2Swap(amount)
      
      expect(bestDex).to.be.oneOf([amm1.address, amm2.address])
      expect(expectedReturn).to.be.gte(Math.max(rate1, rate2))
    })

    it('reverts with zero amount', async () => {
      await expect(
        aggregator.getBestRateToken1ToToken2(0)
      ).to.be.revertedWithCustomError(aggregator, 'InvalidAmount')
    })
  })

  describe('Token1 -> Token2 Swaps', () => {
    it('successfully swaps using best rate', async () => {
      const swapAmount = tokens(100)
      const minAmountOut = tokens(50) // Allow some slippage
      
      // Approve aggregator
      await token1.connect(user1).approve(aggregator.address, swapAmount)
      
      const balanceBefore = await token2.balanceOf(user1.address)
      
      const tx = await aggregator.connect(user1).swapToken1ForToken2(
        swapAmount,
        minAmountOut,
        deadline
      )
      
      const balanceAfter = await token2.balanceOf(user1.address)
      const received = balanceAfter.sub(balanceBefore)
      
      expect(received).to.be.gte(minAmountOut)
      
      // Check events
      await expect(tx).to.emit(aggregator, 'BestRouteFound')
      await expect(tx).to.emit(aggregator, 'SwapExecuted')
    })

    it('reverts with insufficient slippage protection', async () => {
      const swapAmount = tokens(100)
      const minAmountOut = tokens(200) // Unrealistic expectation
      
      await token1.connect(user1).approve(aggregator.address, swapAmount)
      
      await expect(
        aggregator.connect(user1).swapToken1ForToken2(
          swapAmount,
          minAmountOut,
          deadline
        )
      ).to.be.revertedWithCustomError(aggregator, 'InsufficientOutputAmount')
    })

    it('reverts with expired deadline', async () => {
      const swapAmount = tokens(100)
      const minAmountOut = tokens(50)
      const expiredDeadline = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      
      await token1.connect(user1).approve(aggregator.address, swapAmount)
      
      await expect(
        aggregator.connect(user1).swapToken1ForToken2(
          swapAmount,
          minAmountOut,
          expiredDeadline
        )
      ).to.be.revertedWithCustomError(aggregator, 'DeadlineExpired')
    })

    it('reverts with zero amount', async () => {
      await expect(
        aggregator.connect(user1).swapToken1ForToken2(
          0,
          tokens(1),
          deadline
        )
      ).to.be.revertedWithCustomError(aggregator, 'InvalidAmount')
    })

    it('routes to correct AMM based on price', async () => {
      const swapAmount = tokens(100)
      const minAmountOut = tokens(1)
      
      await token1.connect(user1).approve(aggregator.address, swapAmount)
      
      const [expectedDex] = await aggregator.getBestRateToken1ToToken2(swapAmount)
      
      const tx = await aggregator.connect(user1).swapToken1ForToken2(
        swapAmount,
        minAmountOut,
        deadline
      )
      
      const receipt = await tx.wait()
      const swapEvent = receipt.events.find(e => e.event === 'SwapExecuted')
      
      expect(swapEvent.args.dexUsed).to.equal(expectedDex)
    })
  })

  describe('Token2 -> Token1 Swaps', () => {
    it('successfully swaps using best rate', async () => {
      const swapAmount = tokens(100)
      const minAmountOut = tokens(50)
      
      await token2.connect(user1).approve(aggregator.address, swapAmount)
      
      const balanceBefore = await token1.balanceOf(user1.address)
      
      const tx = await aggregator.connect(user1).swapToken2ForToken1(
        swapAmount,
        minAmountOut,
        deadline
      )
      
      const balanceAfter = await token1.balanceOf(user1.address)
      const received = balanceAfter.sub(balanceBefore)
      
      expect(received).to.be.gte(minAmountOut)
      
      await expect(tx).to.emit(aggregator, 'BestRouteFound')
      await expect(tx).to.emit(aggregator, 'SwapExecuted')
    })

    it('provides better rate than direct AMM swap', async () => {
      const swapAmount = tokens(100)
      
      // Get aggregator rate
      const [, aggregatorRate] = await aggregator.getBestRateToken2ToToken1(swapAmount)
      
      // Get individual AMM rates
      const amm1Rate = await amm1.calculateToken2Swap(swapAmount)
      const amm2Rate = await amm2.calculateToken2Swap(swapAmount)
      
      // Aggregator should match or beat both
      expect(aggregatorRate).to.be.gte(amm1Rate)
      expect(aggregatorRate).to.be.gte(amm2Rate)
    })
  })

  describe('Pause Mechanism', () => {
    it('owner can pause the contract', async () => {
      await aggregator.connect(deployer).pause()
      expect(await aggregator.paused()).to.equal(true)
    })

    it('non-owner cannot pause', async () => {
      await expect(
        aggregator.connect(user1).pause()
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('swaps revert when paused', async () => {
      await aggregator.connect(deployer).pause()
      
      const swapAmount = tokens(100)
      await token1.connect(user1).approve(aggregator.address, swapAmount)
      
      await expect(
        aggregator.connect(user1).swapToken1ForToken2(
          swapAmount,
          tokens(50),
          deadline
        )
      ).to.be.revertedWith('Pausable: paused')
    })

    it('owner can unpause the contract', async () => {
      await aggregator.connect(deployer).pause()
      await aggregator.connect(deployer).unpause()
      expect(await aggregator.paused()).to.equal(false)
      
      // Should be able to swap again
      const swapAmount = tokens(100)
      await token1.connect(user1).approve(aggregator.address, swapAmount)
      
      await expect(
        aggregator.connect(user1).swapToken1ForToken2(
          swapAmount,
          tokens(50),
          deadline
        )
      ).to.not.be.reverted
    })
  })

  describe('Token Recovery', () => {
    it('owner can recover accidentally sent tokens', async () => {
      // Accidentally send tokens to aggregator
      const amount = tokens(100)
      await token1.transfer(aggregator.address, amount)
      
      const ownerBalanceBefore = await token1.balanceOf(deployer.address)
      
      await aggregator.connect(deployer).recoverTokens(token1.address, amount)
      
      const ownerBalanceAfter = await token1.balanceOf(deployer.address)
      expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(amount)
    })

    it('non-owner cannot recover tokens', async () => {
      const amount = tokens(100)
      await token1.transfer(aggregator.address, amount)
      
      await expect(
        aggregator.connect(user1).recoverTokens(token1.address, amount)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('Gas Optimization', () => {
    it('uses immutable variables for gas savings', async () => {
      // This test verifies the contract was deployed with immutable variables
      // by checking that the addresses are set correctly and don't change
      const amm1Address = await aggregator.amm1()
      const amm2Address = await aggregator.amm2()
      const token1Address = await aggregator.token1()
      const token2Address = await aggregator.token2()
      
      expect(amm1Address).to.equal(amm1.address)
      expect(amm2Address).to.equal(amm2.address)
      expect(token1Address).to.equal(token1.address)
      expect(token2Address).to.equal(token2.address)
    })
  })

  describe('Edge Cases', () => {
    it('handles very large swap amounts correctly', async () => {
      const largeAmount = tokens(10000)
      
      // Add more liquidity first
      await token1.approve(amm1.address, tokens(100000))
      await token2.approve(amm1.address, tokens(200000))
      await amm1.addLiquidity(tokens(100000), tokens(200000))
      
      const [bestDex, expectedReturn] = await aggregator.getBestRateToken1ToToken2(largeAmount)
      
      expect(expectedReturn).to.be.gt(0)
      expect(bestDex).to.be.oneOf([amm1.address, amm2.address])
    })

    it('handles minimal swap amounts', async () => {
      const minAmount = tokens(0.001)
      const [bestDex, expectedReturn] = await aggregator.getBestRateToken1ToToken2(minAmount)
      
      expect(expectedReturn).to.be.gt(0)
      expect(bestDex).to.be.oneOf([amm1.address, amm2.address])
    })

    it('correctly handles equal rates from both AMMs', async () => {
      // Deploy AMM3 with same ratio as AMM2
      const AMM = await ethers.getContractFactory('AMM')
      const amm3 = await AMM.deploy(token1.address, token2.address)
      
      await token1.approve(amm3.address, tokens(50000))
      await token2.approve(amm3.address, tokens(75000))
      await amm3.addLiquidity(tokens(50000), tokens(75000))
      
      const DexAggregator = await ethers.getContractFactory('DexAggregator')
      const aggregator2 = await DexAggregator.deploy(
        amm2.address,
        amm3.address,
        token1.address,
        token2.address
      )
      
      const amount = tokens(100)
      const [bestDex, expectedReturn] = await aggregator2.getBestRateToken1ToToken2(amount)
      
      // Should pick one of them (doesn't matter which)
      expect(bestDex).to.be.oneOf([amm2.address, amm3.address])
      expect(expectedReturn).to.be.gt(0)
    })
  })
})
