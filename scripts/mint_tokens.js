const hre = require("hardhat");
const config = require('../src/config.json');

async function main() {
  console.log('🪙 Minting test tokens for your account...\n');

  const accounts = await hre.ethers.getSigners();
  const deployer = accounts[0];

  // Get network
  const { chainId } = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network ChainId: ${chainId}`);

  // Load deployed token contracts
  const Token = await hre.ethers.getContractFactory('Token');
  
  const usdToken = await Token.attach(config[chainId].tokens.usd.address);
  const ethToken = await Token.attach(config[chainId].tokens.eth.address);
  const opToken = await Token.attach(config[chainId].tokens.op.address);

  // Mint to first 5 Hardhat test accounts
  const amount = hre.ethers.utils.parseUnits('100000', 'ether');
  
  console.log('🎯 Minting tokens to first 5 Hardhat accounts...\n');

  for (let i = 0; i < 5; i++) {
    const recipient = accounts[i].address;
    console.log(`\n👤 Account ${i}: ${recipient}`);
    
    // Transfer tokens from deployer to recipient
    let tx = await usdToken.connect(deployer).transfer(recipient, amount);
    await tx.wait();
    console.log('   ✅ 100,000 USD');

    tx = await ethToken.connect(deployer).transfer(recipient, amount);
    await tx.wait();
    console.log('   ✅ 100,000 ETH');

    tx = await opToken.connect(deployer).transfer(recipient, amount);
    await tx.wait();
    console.log('   ✅ 100,000 OP');
  }

  console.log('\n✨ Success! First 5 accounts now have tokens!');
  console.log('🚀 Connect any of these accounts in MetaMask to use AlgoGator!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
