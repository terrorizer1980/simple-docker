# simple-docker

Simple docker file and instructions for getting an indra node up and running.

## Prerequisites

You must have the following installed:

- Postgres
- Docker
- Ganache (if running locally)
- Node (if running locally)
- Ethers (if running locally)

Note: the local dependencies are to allow you to deploy contracts to a local ganache network.

## Setup

The docker-compose file in this repository does not set up a postgres service for the node, and instead takes in connection information for an existing database.

Before starting, make sure to create a postgres super-user (needed to create extensions like pg-crypto), database, and password. To use the supplied defaults, run the following:

```bash
# make sure postgres is installed before starting
createuser "indra-test" --pwprompt --superuser --createdb
# in the password prompt, enter indra-node
```

Additionally, make sure the `INDRA_ETH_CONTRACT_ADDRESSES` variable is up to date. To verify, check the `address-book.json` file in this repository (master version found in the main indra [repository](https://github.com/ConnextProject/indra/blob/staging/modules/contracts/address-book.json)). The environment variable is simply a string of the value in the `.json` file.

Finally, if you are planning on running on ganache, don't forget to install all dependencies:

```bash
npm install
```

## Running on rinkeby or mainnet (fastest)

Make sure you have set-up your database correctly as described above. Additionally, you may will want to change the following variables from their defaults:

- `INDRA_ETH_MNEMONIC`: The default value supplied is NOT SECURE (generally, don't trust mnemonics found on GitHub). Please change this and fund the signing address with tokens and ETH. The signing address can be found using:

```typescript
import { Wallet } = from "ethers/utils";
const signingAddress = Wallet.fromMnemonic(INDRA_ETH_MNEMONIC).address;
```

- `INDRA_ETH_RPC_URL`: The default value provided here assumes that you will be running on the `ganache` network. Use any eth provider URL, such as one generated from [Infura](https://infura.io) or [Alchemy](https://alchemyapi.io)

- `INDRA_ALLOWED_SWAPS`: The default value provided assumes you will be running on ganache. Check the `address-book.json` to find the supported token value for rinkeby or mainnet. Additionally, updat the `type` field to be `"HARDCODED"`

Once you have updated any environment variables, start the stack by running:

```bash
npm run start
```

## Running on Ganache

Set up your database as described in the [Setup](#setup) section.

To run the node on ganache, you will need to take the additional step of deploying all the contracts locally:

1. First, in a new terminal window start ganache with the following command:

```bash
# Use the value from `INDRA_ETH_MNEMONIC` to start ganache. Also make sure to specify the
# network ID and increase the default balance of ether (accounts are funded in
# `migrate-contracts.js`)
ganache-cli -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat" -i 1337 --defaultBalanceEther="1000000000"

# Alternatively, just run
npm run start-chain
```

2. Deploy the contracts to your ganache network:

```bash
npm run deploy-ganache # calls entry.sh with defaults
```

In `ops/entry.sh` the default eth provider (`"http://localhost:8545"`) and mnemonic (`"candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"`) are set. You may either customize these default values in the file, or run the following to set custom values:

```bash
ETH_PROVIDER="provider-of-your-choice" ETH_MNEMONIC="mnemonic-of-your-choice" bash ops/entry.sh deploy
```

3. Ensure your `INDRA_ETH_CONTRACT_ADDRESSES`, `INDRA_SUPPORTED_TOKENS`, and `INDRA_ALLOWED_SWAPS` values are up to date with `address-book.json` in the `docker-compose.yml` file. (You'll want to set the `priceOracleType = HARDCODED` in the `INDRA_ALLOWED_SWAPS` object).

4. Start docker stack:

```bash
npm run start
```

## Running an example

Check out [index.js](./index.js) to see an example. To run the example, start the node as described above and run the following in a terminal window:

```bash

# Using rinkeby/mainnet
NODE_URL="NODE_URL" ETH_URL="ETH_URL" FUNDER="FUNDER" node index.js
# here, FUNDER is a funded mnemonic on your chain

# or, using Ganache + default values
npm run start
```

NOTE: This example will deposit some funds into a channel without deliberately storing the mnemonic, please be aware of this if running the example on mainnet.

## Description of env vars

- `INDRA_ADMIN_TOKEN`:
  Used to access admin functions on the node.

- `INDRA_ETH_MNEMONIC`:
  Mnemonic used by the node in operation and to deploy contracts (if needed)

- `INDRA_ETH_RPC_URL`:
  Any eth provider URL, such as one generated from [Infura](https://infura.io) or [Alchemy](https://alchemyapi.io)

- `INDRA_LOG_LEVEL`:
  Setting to configure logs, set to 5 for all logs or to 0 for none

- `INDRA_NATS_SERVERS`:
  Messaging server URL

- `INDRA_NATS_CLUSTER_ID`:
  Messaging cluster id

- `INDRA_NATS_TOKEN`:
  Token to use for authentication

- `INDRA_PG_DATABASE`:
  Name of postgres database

- `INDRA_PG_HOST`:
  Postgres host (default assumes localhost)

- `INDRA_PG_PASSWORD`:
  Password for postgres user

- `INDRA_PG_PORT`:
  Port running postgres (defaults to 5432)

- `INDRA_PG_USERNAME`:
  Postgres user

- `INDRA_PORT`:
  Port running indra

- `INDRA_REDIS_URL`:
  URL for redis instance

- `NODE_ENV`:
  What environment indra is running in (defaults to production).

- `INDRA_ETH_CONTRACT_ADDRESSES`:
  Location of core contracts by network, string of contents in `contracts/address-book.json`

- `INDRA_SUPPORTED_TOKENS`:
  List of supported token addresses.

- `INDRA_ALLOWED_SWAPS`:
  An array of objects with the structure:

  ```javascript
  {
    from: "0xeec918d74c746167564401103096D45BbD494B74", // token address on node network
    to: "0x0000000000000000000000000000000000000000", // token address, AddressZero is ETH
    priceOracleType: "UNISWAP" // type of price oracle, so far have only implemented uniswap
  }
  ```

  that includes all the allowed swaps of the node. Make sure all token addresses correspond to the address on the correct network (the one in the example is for ganache)
