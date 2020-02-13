#!/usr/bin/env node
set -e

ETH_NETWORK="${1:-ganache}"

cwd="`pwd`"

log="$cwd/.ganache.log"

########################################
# Setup env vars

ETH_PROVIDER=$ETH_PROVIDER

if [[ -z "$ETH_PROVIDER" ]]
then ETH_PROVIDER="http://localhost:8545"
fi

if [[ -z "$ETH_MNEMONIC" ]]
then ETH_MNEMONIC="candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
fi

sleep 1 # give the user a sec to ctrl-c in case above is wrong

touch $log

if [[ -f address-book.json ]]
then address_book="$cwd/address-book.json"
fi

########################################
# Deploy contracts

ETH_MNEMONIC="$ETH_MNEMONIC" ETH_PROVIDER="$ETH_PROVIDER" node migrate-contracts.js
