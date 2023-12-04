// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const deployConfig = require("../config/deploy.config");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Deploy the UserRegistry smart contract
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy(
    deployConfig.USER_REGISTRY.MIN_BURN_BOUND,
    deployConfig.USER_REGISTRY.MAX_BURN_BOUND
  );
  await userRegistry.deployed();
  console.log("Contract UserRegistry deployed to:", userRegistry.address);

  //Deploy the EURST stablecoin smart contract
  const EURST = await hre.ethers.getContractFactory("EURST");
  const eurst = await EURST.deploy(
    deployConfig.EURST.INITIAL_SUPPLY,
    userRegistry.address,
    deployConfig.EURST.MINTER,
    deployConfig.EURST.WIPER,
    deployConfig.EURST.REGISTRY_MANAGER
  );
  await eurst.deployed();
  console.log("Contract EURST deployed to:", eurst.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
