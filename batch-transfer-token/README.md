## Batch Transfer Smart Contract

### Overview

This smart contract facilitates batch transfers of an MATIC token (ERC-20) to multiple addresses in a single transaction. It includes a reentrancy guard to prevent reentrant calls during batch transfers.

### Smart Contract Details

#### State Variables

1. `tokenAddress`: The address of the MATIC token (ERC-20) contract.

#### Events

2. `BatchTransferExecuted(address indexed sender, address[] receivers, uint256[] amounts)`: Emitted when a batch transfer is executed.

#### Modifiers

3. `noReentrancy()`: A modifier to prevent reentrant calls during batch transfers.

#### Constructor

4. `constructor(address _tokenAddress)`: Initializes the smart contract with the address of the MATIC token (ERC-20).

#### Functions

5. `transferBatch(address[] calldata _to, uint256[] calldata _amounts) external noReentrancy`: Performs multiple transfers in a single transaction. Verifies the arrays have non-zero length and the same length.

### How to Run

#### Environment Setup:

- Ensure you have `Node.js` and npm installed on your machine.

#### Install Dependencies:

- Run `npm install` to install the required dependencies.

### Deploy on Ethereum Network:

- Update the `hardhat.config.js` file with your Ethereum network configuration.
- Add the environment variables in `.env` file as given in `.env.example`.
- Run `npx hardhat run scripts/deploy.js --network <your-network>` to deploy the smart contract (example: `npx hardhat run scripts/deploy.js --network rinkeby`).
- Run `npx hardhat verify --network <your-network> <CONTRACT_ADDRESS>` to verify the smart contract.

#### ERC-20 Token Approval:

Before performing batch transfers, ensure that the sender has approved the `BatchTransfer` contract address with the appropriate allowance. This can be done by calling the `approve` function on the MATIC token contract of `PolyToken`.

### Libraries Used

1. `Hardhat`: Used for Ethereum development, testing, and deployment.
2. `Ethers`: Ethereum JavaScript library for interacting with smart contracts.

### Purpose of Libraries

1. `Hardhat`: Facilitates smart contract development, testing, and deployment on the Ethereum network.
2. `Ethers`: Provides a simple and consistent interface for interacting with Ethereum smart contracts in JavaScript.
