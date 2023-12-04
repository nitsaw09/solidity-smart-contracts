const { ethers } = require("ethers");
const hre = require("hardhat");

async function main() {
  const initialSupply = ethers.utils.parseUnits('1000000000', 18);
  
  const PolyTokenContract = await hre.ethers.getContractFactory("PolyToken");
  const polyTokenContract = await PolyTokenContract.deploy(initialSupply);
  await polyTokenContract.deployed();
  console.log("PolyTokenContract deployed to:", polyTokenContract.address);

  const BatchTransferContract = await hre.ethers.getContractFactory("BatchTransfer");
  const batchTransferContract = await BatchTransferContract.deploy(polyTokenContract.address);
  await batchTransferContract.deployed();
  console.log("BatchTransferContract deployed to:", batchTransferContract.address);

  const txApproval = await polyTokenContract.approve(batchTransferContract.address, initialSupply);
  console.log("Approval Txn: ", txApproval);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
