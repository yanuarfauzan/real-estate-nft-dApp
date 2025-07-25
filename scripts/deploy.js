// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  let buyer, seller, inspector, lender;
  let realestate, escrow, transaction;

  // setup akun
  [buyer, seller, inspector, lender] = await ethers.getSigners();

  const Realestate = await ethers.getContractFactory("RealEstate");
  realestate = await Realestate.deploy();
  await realestate.deployed();

  console.log("RealEstate deployed to:", realestate.address);
  console.log('Minting 3 properties...');

  transaction = await realestate.connect(seller).mint('http://ipfs.io/ipfs/QmbWPX8d5wdU4enXCSEwUb4Vv1Vs7e26mVAUg31hWEAJBs');
  await transaction.wait();

  transaction = await realestate.connect(seller).mint('http://ipfs.io/ipfs/QmQCjhFuG69TPdc4s7iJP1V8QGP1caubTTN5qLQ3fG5Fh2');
  await transaction.wait();

  transaction = await realestate.connect(seller).mint('http://ipfs.io/ipfs/QmXSUqJJNTd2FuWDfogQew3yMnZcJHq1GxukZ8Bnh7qrh2');
  await transaction.wait();


  const Escrow = await ethers.getContractFactory("Escrow");
  escrow = await Escrow.deploy(realestate.address, seller.address, inspector.address, lender.address);
  await escrow.deployed();

  console.log("Escrow deployed to:", escrow.address);
  for (let i = 1; i <= 3; i++) {
    transaction = await realestate.connect(seller).approve(escrow.address, i);
    await transaction.wait();
  }


  transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10));
  await transaction.wait();

  transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5));
  await transaction.wait();

  transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5));
  await transaction.wait();

  console.log('Finished');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
