const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const BigNumber = require('bignumber.js');

let accounts;
const AIRLINE_FEE = 10000000000000000000; // 10 ether
const INSURANCE_FEE = 1000000000000000000; // 1 ether
let FLIGHT_KEYS = [];

contract('FlightSuretyApp', (accs) => {
  accounts = accs;
});

it('ensures no one can call data contract', async () => {
  const appInstance = await FlightSuretyApp.deployed();
  try {
    await appInstance.registerAirline(accounts[1], "Some name", { from: accounts[0] });
  } catch (error) {
    assert.include(error.message, 'Caller is not authorized');
  }
});

it('ensures contract owner can authorize contract', async () => {
  const appInstance = await FlightSuretyApp.deployed();
  const dataInstance = await FlightSuretyData.deployed();
  const genesisAirline = await appInstance.getAirline.call(accounts[0]);
  const count = await dataInstance.airlineCount.call();

  // first airline must have been created
  assert.equal(genesisAirline.name, 'Genesis Airline'); // name
  assert.equal(genesisAirline.isApproved, true); // isApproved
  assert.equal(genesisAirline.approvalCount, 0); // approvalCount
  assert.equal(genesisAirline.hasFunded, true); // hasFunded
  assert.equal(count, 1);

  await dataInstance.authorizeContract(appInstance.address, { from: accounts[0] });
  const isAuthorized = await dataInstance.isContractAuthorized.call(appInstance.address);
  assert.equal(isAuthorized, true);
  const amIAuthorized = await appInstance.amIAuthorized.call();
  assert.equal(amIAuthorized, true);

  // should be able to register airline now
  await appInstance.registerAirline(accounts[1], "Some name", { from: accounts[0] });

  const airlines = await appInstance.getAirlines.call();
  assert.equal(airlines.length, 2); // including the first airline created on contract deployment
  assert.equal(airlines[0], accounts[0]);
  assert.equal(airlines[1], accounts[1]);
});

it('ensures no airline can be registered more than once', async () => {
  const appInstance = await FlightSuretyApp.deployed();
  try {
    await appInstance.registerAirline(accounts[1], "Some name", { from: accounts[0] });
  } catch (error) {
    assert.include(error.message, 'Airline is already registered');
  }
});

it('ensures no airline can sign up on their own until there are at least 4 airlines', async () => {
  const appInstance = await FlightSuretyApp.deployed();

  try {
    await appInstance.signupAsAirline("Some name", { from: accounts[2] });
  } catch (error) {
    assert.include(error.message, 'You can only be registered by an existing airline');
  }

  await appInstance.registerAirline(accounts[2], "Some name", { from: accounts[0] });

  let airlines = await appInstance.getAirlines.call();
  assert.equal(airlines.length, 3);
  assert.equal(airlines[0], accounts[0]);
  assert.equal(airlines[1], accounts[1]);
  assert.equal(airlines[2], accounts[2]);

  await appInstance.registerAirline(accounts[3], "Some name", { from: accounts[0] });

  airlines = await appInstance.getAirlines.call();
  assert.equal(airlines.length, 4);
  assert.equal(airlines[0], accounts[0]);
  assert.equal(airlines[1], accounts[1]);
  assert.equal(airlines[2], accounts[2]);
  assert.equal(airlines[3], accounts[3]);

  await appInstance.signupAsAirline("Signup Airline", { from: accounts[4] });
  airlines = await appInstance.getAirlines.call();
  assert.equal(airlines.length, 5);
  assert.equal(airlines[0], accounts[0]);
  assert.equal(airlines[1], accounts[1]);
  assert.equal(airlines[2], accounts[2]);
  assert.equal(airlines[3], accounts[3]);
  assert.equal(airlines[4], accounts[4]);
});

it('ensures no airline can participate until approved and has funded', async () => {
  const appInstance = await FlightSuretyApp.deployed();
  try {
    await appInstance.registerAirline(accounts[5], "Some name", { from: accounts[1] });
  } catch (error) {
    assert.include(error.message, 'You cannnot perform this operation. You are yet to fund');
  }

  try {
    await appInstance.approveAirline(accounts[1], { from: accounts[0] });
  } catch (error) {
    assert.include(error.message, 'Airline has already been approved');
  }

  try {
    await appInstance.fund({ from: accounts[1], value: 10 });
  } catch (error) {
    assert.include(error.message, 'Insufficient funds');
  }

  // fund 1 (total balance in contract = 10 ether)
  await appInstance.fund({ from: accounts[1], value: new BigNumber(AIRLINE_FEE) });

  const appBal = await appInstance.getAppBalance.call();
  const dataBal = await appInstance.getDataBalance.call();
  assert.equal((new BigNumber(appBal)).isEqualTo(0), true);
  assert.equal((new BigNumber(dataBal)).isEqualTo(AIRLINE_FEE), true);

  const airline = await appInstance.getAirline.call(accounts[1])
  // first airline must have been created
  assert.equal(airline.name, 'Some name'); // name
  assert.equal(airline.isApproved, true); // isApproved
  assert.equal(airline.approvalCount, 0); // approvalCount
  assert.equal(airline.hasFunded, true); // hasFunded

  // should now allow airline perform action
  await appInstance.registerAirline(accounts[5], "Some name", { from: accounts[1] });

  try {
    await appInstance.fund({ from: accounts[1], value: new BigNumber(AIRLINE_FEE) });
  } catch (error) {
    assert.include(error.message, 'You have already funded');
  }

  // fund 2 (total balance in contract = 20 ether)
  await appInstance.fund({ from: accounts[2], value: new BigNumber(AIRLINE_FEE) });
  // fund 3 (total balance in contract = 30 ether)
  await appInstance.fund({ from: accounts[3], value: new BigNumber(AIRLINE_FEE) });
  try {
    // signup airline is not auto-approved and cannot fund until approved
    await appInstance.fund({ from: accounts[4], value: new BigNumber(AIRLINE_FEE) });
  } catch (error) {
    assert.include(error.message, 'You cannnot perform this operation. You have not been approved');
  }
});

it('ensures 50% multiparty is reached before airline can be approved', async () => {
  const appInstance = await FlightSuretyApp.deployed();
  const dataInstance = await FlightSuretyData.deployed();

  const active = await dataInstance.activeAirlineCount.call();
  assert.equal(active, 4);

  let signupAirline = await appInstance.getAirline.call(accounts[4]);
  assert.equal(signupAirline.name, 'Signup Airline');
  assert.equal(signupAirline.isApproved, false);
  assert.equal(signupAirline.hasFunded, false);
  assert.equal(signupAirline.approvalCount, 0);
  assert.equal(signupAirline.percentageApproval, 0);

  await appInstance.approveAirline(accounts[4], { from: accounts[0] });
  signupAirline = await appInstance.getAirline.call(accounts[4]);
  assert.equal(signupAirline.approvalCount, 1);
  assert.equal(signupAirline.percentageApproval, 25); // 1 out of 4 active airlines approved

  try {
    // ensure one airline cannot approve user twice
    await appInstance.approveAirline(accounts[4], { from: accounts[0] });
  } catch (error) {
    assert.include(error.message, 'You have already approved this airline');
  }

  await appInstance.approveAirline(accounts[4], { from: accounts[1] });
  signupAirline = await appInstance.getAirline.call(accounts[4]);
  assert.equal(signupAirline.approvalCount, 2);
  assert.equal(signupAirline.percentageApproval, 50);
  // should now be approved
  assert.equal(signupAirline.isApproved, true);
});

it('ensures approved and funded airline can register flight', async () => {
  const appInstance = await FlightSuretyApp.deployed();
  await appInstance.registerFlight(Date.now(), { from: accounts[0] });
  const flightKeys = await appInstance.getFlightKeys.call();
  FLIGHT_KEYS = FLIGHT_KEYS.concat(flightKeys);
  assert.equal(FLIGHT_KEYS.length, 1);
});

it('ensures passenger can purchase flight insurance', async () => {
  const appInstance = await FlightSuretyApp.deployed();

  try {
    await appInstance.buyInsurance(appInstance.address, { from: accounts[7] });
  } catch (error) {
    assert.include(error.message, 'Flight does not exist');
  }

  await appInstance.buyInsurance(FLIGHT_KEYS[0], { from: accounts[5], value: INSURANCE_FEE });
  const flightInsurees = await appInstance.getFlightInsurees.call(FLIGHT_KEYS[0]);

  assert.equal(flightInsurees.length, 1);
  assert.equal(flightInsurees[0], accounts[5]);

  const totalContractBalance = (new BigNumber(AIRLINE_FEE)).multipliedBy(3).plus(INSURANCE_FEE);

  const appBal = await appInstance.getAppBalance.call();
  const dataBal = await appInstance.getDataBalance.call();
  assert.equal((new BigNumber(appBal)).isEqualTo(0), true);
  assert.equal((new BigNumber(dataBal)).isEqualTo(totalContractBalance), true);
});
