const hre = require("hardhat");

async function main() {
  console.log('🚀 Starting Complete DEX Aggregator Deployment...\n');
  
  // Step 1: Deploy Tokens using WorkingToken (two-step pattern)
  console.log('📦 Step 1: Deploying Tokens...');
  const WorkingToken = await hre.ethers.getContractFactory('WorkingToken')

  // Deploy with proper supply - use ethers.utils.parseEther for proper 18 decimal tokens
  // 1,000,000 tokens = 1,000,000 * 10^18 wei
  const totalSupply = hre.ethers.utils.parseEther('1000000')
  
  console.log('   Deploying USD Token...')
  const usd = await WorkingToken.deploy(totalSupply)
  await usd.deployed()
  console.log(`   ✅ USD Token deployed: ${usd.address}`)
  
  // Initialize USD token
  await usd.initialize('US Dollar', 'USD')
  console.log(`   ✅ USD Token initialized`)

  console.log('   Deploying ETH Token...')
  const eth = await WorkingToken.deploy(totalSupply)
  await eth.deployed()
  console.log(`   ✅ ETH Token deployed: ${eth.address}`)
  
  // Initialize ETH token
  await eth.initialize('Ethereum', 'ETH')
  console.log(`   ✅ ETH Token initialized`)

  console.log('   Deploying OP Token...')
  const op = await WorkingToken.deploy(totalSupply)
  await op.deployed()
  console.log(`   ✅ OP Token deployed: ${op.address}`)
  
  // Initialize OP token
  await op.initialize('Optimism', 'OP')
  console.log(`   ✅ OP Token initialized`)

  // Step 2: Deploy AMM1 (ETH/USD pair)
  console.log('\n🔄 Step 2: Deploying AMM1 (ETH/USD pair)...');
  const AMM = await hre.ethers.getContractFactory('AMM')
  const amm1 = await AMM.deploy(eth.address, usd.address)
  await amm1.deployed()
  console.log(`   ✅ AMM1 (ETH/USD): ${amm1.address}`)

  // Step 3: Deploy AMM2 (OP/USD pair)
  console.log('\n🔄 Step 3: Deploying AMM2 (OP/USD pair)...');
  const amm2 = await AMM.deploy(op.address, usd.address)
  await amm2.deployed()
  console.log(`   ✅ AMM2 (OP/USD): ${amm2.address}`)

  // Step 4: Deploy DEX Aggregator (compares ETH/USD vs OP/USD)
  console.log('\n🎯 Step 4: Deploying DEX Aggregator...');
  const DexAggregator = await hre.ethers.getContractFactory('DexAggregator')
  const aggregator = await DexAggregator.deploy(
    amm1.address,
    amm2.address,
    eth.address,
    usd.address
  )
  await aggregator.deployed()
  console.log(`   ✅ DEX Aggregator: ${aggregator.address}`)

  // Step 5: Save all addresses
  console.log('\n💾 Step 5: Saving deployment addresses...');
  const fs = require('fs');
  const addresses = {
    tokens: {
      usd: usd.address,
      eth: eth.address,
      op: op.address
    },
    amms: {
      amm1: {
        address: amm1.address,
        pair: 'ETH/USD'
      },
      amm2: {
        address: amm2.address,
        pair: 'OP/USD'
      }
    },
    aggregator: aggregator.address
  };
  
  fs.writeFileSync('complete-deployment.json', JSON.stringify(addresses, null, 2));
  console.log('   ✅ Addresses saved to complete-deployment.json');

  // Summary
  console.log('\n🎉 DEPLOYMENT COMPLETE! 🎉');
  console.log('\n📋 Deployment Summary:');
  console.log('═══════════════════════════════════════════════');
  console.log(`💵 USD Token:       ${usd.address}`);
  console.log(`⟠  ETH Token:       ${eth.address}`);
  console.log(`🔴 OP Token:        ${op.address}`);
  console.log(`🔄 AMM1 (ETH/USD):  ${amm1.address}`);
  console.log(`🔄 AMM2 (OP/USD):   ${amm2.address}`);
  console.log(`🎯 DEX Aggregator:  ${aggregator.address}`);
  console.log('═══════════════════════════════════════════════');
  console.log('\n📝 Trading Pairs:');
  console.log('• AMM1: ETH/USD  (Ethereum → US Dollar)');
  console.log('• AMM2: OP/USD   (Optimism → US Dollar)');
  console.log('\n📝 Next Steps:');
  console.log('1. Update src/config.json with these addresses');
  console.log('2. Add liquidity to both AMMs');
  console.log('3. Test swapping ETH and OP for USD');
  console.log('4. Start the React frontend\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
