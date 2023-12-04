# EURST Smart Contract

This project is an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```
## Deploy smart contract via Fireblocks Setup
- Create ```.env``` file comparing the ```.env.example``` file
- Assign the ```fireblocks_secret.key``` file path to ```FIREBLOCKS_API_PRIVATE_KEY_PATH``` in .env
- Assign the api user key from fireblocks console to ```FIREBLOCKS_API_KEY``` in ```.env```
- Assign the vault account id to ```FIREBLOCKS_VAULT_ACCOUNT_IDS``` in ```.env```

## Unit Test
- To run unit test case
```shell
npm run test
```
- To run test coverage
```shell
npm run coverage
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Goerli.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Goerli node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network goerli scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
