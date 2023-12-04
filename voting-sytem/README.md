## Voting Smart Contract

### Overview

This smart contract implements a basic voting system, allowing users to propose items, vote for them, and determine the winner based on votes. It includes functionalities for proposing items, voting, and determining the winner.

### Smart Contract Details

#### State Variables

1. **`owner`**: The address of the contract owner.
2. **`items`**: An array to store proposed items.
3. **`hasVoted`**: A mapping to keep track of whether an address has voted.

#### Events

4. **`ItemProposed(uint256 itemId, string itemName)`**: Emitted when a new item is proposed.
5. **`Voted(address voter, uint256 itemId)`**: Emitted when a user votes for an item.

#### Modifiers

1. **`onlyOwner`**: Restricts certain functions to be called only by the contract owner.
2. **`hasNotVoted`**: Ensures a user can vote only once.

#### Constructor

Sets the owner of the contract during deployment.

#### Functions

1. **`proposeItem(string memory _itemName) external onlyOwner`**: Proposes a new item for voting and Callable only by the owner.
2. **`voteForItem(uint256 _itemId) external hasNotVoted`**: Votes for a specific item by ID and Callable by any user who has not voted yet.
3. **`getWinner() external view returns (uint256 winningItemId, string memory winningItemName)`**: Gets the ID and name of the item with the most votes and Returns the winning item's ID and name.

### How to Run

#### Environment Setup

- Ensure you have `Node.js` and npm installed on your machine.

#### Install Dependencies

- Run `npm install` to install the required dependencies.

#### Run Tests

- Execute `npx hardhat test` to run the provided tests and ensure the smart contract functions as expected.

### Deploy on Ethereum Network

- Update the `hardhat.config.js` file with your Ethereum network configuration.
- Run `npx hardhat run scripts/deploy.js --network <your-network>` to deploy the smart contract (example: `npx hardhat run scripts/deploy.js --network sepolia`).
- Run `npx hardhat verify --network sepolia <CONTRACT_ADDRESS>` to verify the smart contract, and add the Etherscan API key in `.env` file.

### Contract Deployed on Sepolia Testnet

[Contract Address on Sepolia Testnet](https://sepolia.etherscan.io/address/0x1FFfCb494ddd7CcC96c23520967aA3D3A73a768f)

### Libraries Used

1. **`Hardhat`**: Used for Ethereum development, testing, and deployment.
2. **`Ethers`**: Ethereum JavaScript library for interacting with smart contracts.

### Purpose of Libraries

1. **`Hardhat`**: Facilitates smart contract development, testing, and deployment on the Ethereum network.
2. **`Ethers`**: Provides a simple and consistent interface for interacting with Ethereum smart contracts in JavaScript.
