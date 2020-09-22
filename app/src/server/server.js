import FlightSuretyApp from '../../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

const {
  amIAuthorized,
  registerOracle,
  submitOracleResponse,
  REGISTRATION_FEE,
} = flightSuretyApp.methods;
const { authorizeContract } = flightSuretyData.methods;

const ORACLES = [];

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const STATUS_CODES = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER,
];

(async () => {
  const accounts = await web3.eth.getAccounts();
  console.log(accounts);
  // use the latter half of the whole accounts pool as cluster of oracles
  const chosenAccounts = accounts.slice(accounts.length / 2);

  web3.eth.defaultAccount = accounts[0];

  const isAuthorized = await amIAuthorized().call({
    from: accounts[0]
  });
  const networkId = await web3.eth.net.getId();
  if (!isAuthorized) {
    console.log('App contract is not authorized. Calling authorize contract');
    await authorizeContract(config.appAddress).send({
      from: accounts[0],
    });
  }

  const regFee = await REGISTRATION_FEE().call();

  chosenAccounts.forEach(async (acct) => {
    await registerOracle().send({
      from: acct,
      value: regFee,
      gas: 3000000
    });
  });
})()

flightSuretyApp.events.OracleRegistered({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  console.log(event)
  if (event.returnValues && event.returnValues.oracle && event.returnValues.indexes) {
    const existingOracleIndex = ORACLES.findIndex(o => o.address === event.returnValues.oracle);
    if (existingOracleIndex > -1) {
      ORACLES[existingOracleIndex].indexes = event.returnValues.indexes;
    } else {
      ORACLES.push({
        address: event.returnValues.oracle,
        indexes: event.returnValues.indexes,
      });
    }
  }
});

flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  console.log(event)
  if (
    event.returnValues &&
    event.returnValues.flightKey &&
    event.returnValues.index &&
    event.returnValues.airline &&
    event.returnValues.timestamp
  ) {
    const chosenOracles = ORACLES.filter(
      oracle => oracle.indexes.includes(event.returnValues.index),
    );

    chosenOracles.forEach(async (oracle) => {
      try {
        const randomStatusCode = STATUS_CODES[
          Math.floor(Math.random() * STATUS_CODES.length)
        ];
        console.log('Flight response to contract', event.returnValues.index,
          event.returnValues.airline,
          event.returnValues.flightKey,
          event.returnValues.timestamp,
          randomStatusCode,
        );
        await submitOracleResponse(
          event.returnValues.index,
          event.returnValues.airline,
          event.returnValues.flightKey,
          event.returnValues.timestamp,
          randomStatusCode
        ).send({
          from: oracle.address,
          gas: 3000000,
        })
      } catch (error) {
        console.log(`Error submitting response to contract: ${error}`);
      }
    });
  }
});

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
});

app.get('/api/oracles', (req, res) => {
  res.send({
    message: 'List of oracles retrieved successfully',
    data: ORACLES,
    meta: {
      total: ORACLES.length,
    },
  })
})

export default app;


