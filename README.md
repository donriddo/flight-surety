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

3. To start the client DApp, `cd` into app, `npm install` and then run  `npm run dev`

4. Run `truffle compile` to compile the contracts

5. Run `truffle test` to ensure all the tests are passing

6. From another separate tab on your terminal and **in the project folder root**, run `npm run oracle` to start up the oracles server (just a simulation)

7. Start up any ethereum node of choice. Preferrably use ganache-cli as it is already configured as part of the DApp and it also allow socket connection for the DApp and the oracles server to hook into. If using ganache, make sure to have ganache installed (https://github.com/trufflesuite/ganache-cli).

You can start up ganache with `ganche-cli -a 100 -p 8545` from another terminal tab. This will start up ganache on port 8545 and provide you with free 100 accounts to test with. The rest of the steps below assumes you are running `ganache-cli`

8. Run `truffle migrate --reset --network ganache` to deploy the contract

9. Go to `localhost:8081` or `localhost:8080` (whichever is displayed in your terminal) on your browser to interact with the app.

10. Enjoy!


### This DApp has been deployed onto the Rinkeby test network. Find details below

Flight Sure Data Transaction Hash: **0x81132ba65142cb581eab2bc020f67b3be17def83cb9b4efba1cc177566ea12f6**

Flight Sure Data Contract Address: **0x177A83d5976365352b174b5c3B69C48210d1170a**

Flight Sure App Transaction Hash: **0x2a0b779265741052d241863a4d3f78f3047ad722b2615f23cb1fb0fffd4a369e**

Flight Sure App Contract Address: **0xdb5142799277A3987DB690C9A5eB592A893c9E68**

#### Here are the development tools used

Remix IDE - (Helped in quickly deploying and testing out the sub-contracts and ensure everything is working fine)

Truffle v5.1.34 (core: 5.1.34) - used its webpack box as it contains all the starter code needed and I only just had to jump into implementation right away

Solidity - ^0.6.0 (solc-js)

Node v10.16.3

Web3.js v1.2.1

Dependencies:

```json
  {
    "@openzeppelin/contracts": "^3.2.0",
    "@truffle/hdwallet-provider": "^1.1.0",
    "dotenv": "^8.2.0"
  }
```
