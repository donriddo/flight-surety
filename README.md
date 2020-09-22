# Flight Surety DApp

This repository contains an Ethereum DApp that demonstrates the ability of passengers to puchase insurance for their flights.

## Problem

Airlines delay some flights unnecessarily and some time for personal gains. Passengers need to know these airlines are accountable and should they default, they have to pay them back a certain amount of money.

## Solution

Airlines pay a default fee of 10 ether before they can use the system. Also after the first 4 airlines have been registered and approved by default, the 5th and subsequent airlines have to be approved via a multiparty consensus. A default of 50% approval of the total active airline is required before the new airline can be approved. Approved and funded airlines can register flights and passengers can purchase insurance for these flights. If the flight is delayed for no tangible reason like bad weather, technical difficulty etc, the passenger is paid back multiple of how much they insured the flight with (a default of 1.5X).


## Steps to run the application

0. Make sure you have Truffle installed (https://www.trufflesuite.com/docs/truffle/getting-started/installation). Also have Metamask chrome extension installed (https://metamask.io/)

1. Clone this repository

2. run `npm install`

3. `cd` into app and again `npm install`

4. Run `truffle compile` to compile the contracts

5. Run `truffle test` to ensure all the tests are passing

6. From a separate tab on your terminal and in the project root, run `npm run client` to start up the DApp UI

7. From another separate tab on your terminal and in the project root, run `npm run oracle` to start up the oracles server (just a simulation)

8. Start up any ethereum node of choice. Preferrably use ganache-cli as it is already configured as part of the DApp and it also allow socket connection for the DApp and the oracles server to hook into. If using ganache, make sure to have ganache installed (https://github.com/trufflesuite/ganache-cli).

You can start up ganache with `ganche-cli -a 100 -p 8545` from another terminal tab. This will start up ganache on port 8545 and provide you with free 100 accounts to test with. The rest of the steps below assumes you are running `ganache-cli`

9. Run `truffle migrate --reset --network ganache` to deploy the contract

10. Go to `localhost:8081` on your browser to interact with the app.

11. Enjoy!


### This DApp has been deployed onto the Rinkeby test network. Find details below

Transaction Hash: **0x7e36108674547428d422157e0d7850d8b303e25f9867b3eaf925dab4f7ac5f0d**

Contract Address: **0x3841A5d26f46cd49dDCa40B5928e8732C356CA15**

#### Here are the development tools used

Remix IDE - (Helped in quickly deploying and testing out the sub-contracts and ensure everything is working fine)

Truffle v5.1.34 (core: 5.1.34) - used its webpack box as it contains all the starter code needed and I only just had to jump into implementation right away

Solidity v0.5.16 (solc-js)

Node v10.16.3

Web3.js v1.2.1

Dependencies:

```json
  {
    "@truffle/hdwallet-provider": "^1.0.43",
    "dotenv": "^8.2.0"
  }
```
