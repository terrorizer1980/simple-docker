#!/usr/bin/env node
set -e
cwd="`pwd`"

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

if [[ -f address-book.json ]]
then address_book="$cwd/address-book.json"
fi

########################################
# Deploy contracts or start chain

if [[ $1 == "deploy" ]]
then
  touch $address_book
  ETH_MNEMONIC="$ETH_MNEMONIC" ETH_PROVIDER="$ETH_PROVIDER" npx connext-contracts migrate -a "$address_book" -m "$ETH_MNEMONIC" -p "$ETH_PROVIDER"
  ETH_MNEMONIC="$ETH_MNEMONIC" ETH_PROVIDER="$ETH_PROVIDER" npx connext-contracts new-token -a "$address_book" -m "$ETH_MNEMONIC" -p "$ETH_PROVIDER"
elif [[ $1 == "start" ]]
then
  ./node_modules/.bin/ganache-cli -m "$ETH_MNEMONIC" -i 1337 --defaultBalanceEther="1000000000"
else
  echo "Unsupported argument supplied, expected 'deploy' or 'start'. Got: $1"
fi