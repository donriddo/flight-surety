import Web3 from "web3";
import FSApp from "../../../build/contracts/FlightSuretyApp.json";
import FSData from "../../../build/contracts/FlightSuretyData.json";
import BigNumber from 'bignumber.js';

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const statusCodes = {
    [STATUS_CODE_UNKNOWN]: 'Currently Unknown',
    [STATUS_CODE_ON_TIME]: 'Arrived on time',
    [STATUS_CODE_LATE_AIRLINE]: 'Flight delayed',
    [STATUS_CODE_LATE_WEATHER]: 'Flight delayed due to bad weather',
    [STATUS_CODE_LATE_TECHNICAL]: 'Flight delayed due to technical issues',
    [STATUS_CODE_LATE_OTHER]: 'Flight delayed due to some unforseen issues'
};

const App = {
    web3: null,
    account: null,
    meta: null,
    data: null,
    currentActor: null,
    itemStates: [
    ],

    start: async function () {
        const { web3 } = this;
        console.log(web3);

        try {
            // get contract instance
            const networkId = await web3.eth.net.getId();
            console.log({ networkId, nws: FSApp.networks });
            const deployedNetwork = FSApp.networks[networkId];

            this.meta = new web3.eth.Contract(
                FSApp.abi,
                deployedNetwork.address,
            );

            this.meta.events.FlightStatusInfo({
                fromBlock: 0
            }, function (error, event) {
                if (error) console.log(error)
                console.log(event);
                if (
                    event.returnValues &&
                    event.returnValues.flightKey &&
                    event.returnValues.status &&
                    event.returnValues.airline &&
                    event.returnValues.timestamp
                ) {
                    App.setResponse(`Flight Status: ${statusCodes[event.returnValues.status]}`);
                }
            });

            this.meta.events.InsureesCredited({
                fromBlock: 0
            }, function (error, event) {
                if (error) console.log(error)
                console.log(event);
                if (
                    event.returnValues &&
                    event.returnValues.flightKey &&
                    event.returnValues.statusCode
                ) {
                    App.setResponse(`
                    All passengers who insured the flight with key(${event.returnValues.flightKey})
                    have been refunded.
                    Flight status came back as (${statusCodes[event.returnValues.statusCode]}).
                    If you have insured this flight, please check your wallet balance.
                    You can request for withdrawal anytime.
                `);

                    App.setWalletBalance();
                }
            });

            this.data = new web3.eth.Contract(
                FSData.abi,
                FSData.networks[networkId].address,
            );
            console.log(FSData.networks[networkId].address);
            console.log(deployedNetwork.address);

            // get accounts
            const accounts = await web3.eth.getAccounts();
            this.account = accounts[0];
            this.currentActor = accounts[0];

            const { authorizeContract } = this.data.methods;
            const { amIAuthorized } = this.meta.methods;
            const isAuthorized = await amIAuthorized().call();
            if (!isAuthorized) {
                await authorizeContract(deployedNetwork.address).send({
                    from: this.account,
                });
            }

            $('#currentActorId').text(this.currentActor);
            $('#regAirlineAddress').val(this.currentActor);
            $('#setCurrentActor').val(this.currentActor);

            $('#setCurrentActorBtn').click(e => {
                e.preventDefault();
                const value = $("#setCurrentActor").val();
                if (value) {
                    this.currentActor = $("#setCurrentActor").val();
                    $('#currentActorId').text(this.currentActor);
                }
            });

            $('#seeCurrentActorBtn').click(e => {
                e.preventDefault();
                $("#currentActor").show();
            });

            $('#closeCurrentActorBtn').click(e => {
                e.preventDefault();
                $("#currentActor").hide();
            });

            $('#seeWalletBalanceBtn').click(e => {
                e.preventDefault();
                $("#walletBalance").show();
            });

            $('#closeWalletBalanceBtn').click(e => {
                e.preventDefault();
                $("#walletBalance").hide();
            });

            $('#closeResponsePanelBtn').click(e => {
                e.preventDefault();
                $("#responsePanel").hide();
            });

            $('#regAirlineBtn').click(async e => {
                e.preventDefault();
                const regAirlineName = $("#regAirlineName").val();
                const regAirlineAddress = $("#regAirlineAddress").val();

                console.log({
                    regAirlineName,
                    regAirlineAddress,
                })

                await this.registerAirline(
                    regAirlineName,
                    regAirlineAddress,
                );
            });

            $('#approveAirlineBtn').click(async e => {
                e.preventDefault();
                const approveAirlineAddress = $("#approveAirlineAddress").val();

                console.log({
                    approveAirlineAddress,
                })

                await this.approveAirline(
                    approveAirlineAddress,
                );
            });

            $('#getAirlineBtn').click(async e => {
                e.preventDefault();
                const getAirlineAddress = $("#getAirlineAddress").val();

                console.log({
                    getAirlineAddress,
                })

                await this.getAirline(
                    getAirlineAddress,
                );
            });

            $('#signupAirlineBtn').click(async e => {
                e.preventDefault();
                const signupAirlineName = $("#signupAirlineName").val();

                console.log({
                    signupAirlineName,
                })

                await this.signupAirline(
                    signupAirlineName,
                );
            });

            $('#regFlightBtn').click(async e => {
                e.preventDefault();
                const regFlightTs = $("#regFlightTs").val();

                console.log({
                    regFlightTs,
                })

                await this.registerFlight(
                    new Date(regFlightTs).getTime() / 1000,
                );

                await this.updateFlightLists();
            });

            $('#purchaseFlightBtn').click(async e => {
                e.preventDefault();
                const purchaseFlightKey = $("#purchaseFlightKey").val();
                const purchaseFlightAmount = $("#purchaseFlightAmount").val();

                console.log({
                    purchaseFlightKey,
                    purchaseFlightAmount,
                })

                await this.purchaseFlight(
                    purchaseFlightKey,
                    purchaseFlightAmount,
                );
            });

            $('#getFlightBtn').click(async e => {
                e.preventDefault();
                const getFlightKey = $("#getFlightKey").val();

                console.log({
                    getFlightKey,
                })

                const response = await this.getFlightStatus(
                    getFlightKey,
                );

                console.log(response);
            });

            $('#withdrawFundsBtn').click(async e => {
                e.preventDefault();

                await this.withdrawFunds();
                await this.setWalletBalance();
            });

            $('#fundBtn').click(async e => {
                e.preventDefault();

                await this.fund();
            });

            await this.updateFlightLists();
        } catch (error) {
            console.error("Could not connect to contract or chain.", error);
        }
    },

    callAsyncFunction: async function () {
        const args = Array.prototype.slice.call(arguments);
        const fn = args.shift();
        console.log({ fn })
        let [method, gasFee] = args.pop().split(':');
        if (gasFee) {
            gasFee = new BigNumber(gasFee);
        }
        try {
            console.log({ from: this.currentActor, value: gasFee });
            // e.g addNewFarmer.apply(null, account).send({ from: this.currentActor })
            return await fn.apply(null, args)[method]({ from: this.web3.utils.toChecksumAddress(this.currentActor), value: gasFee });
        } catch (error) {
            console.log(error);
            this.setResponse(error);
        }
    },

    setWalletBalance: async function () {
        const response = await this.fetchPassengerBalance();
        console.log({ response });
        $('#currentWalletBalance').text(response);
    },

    setResponse: (response) => {
        $('#responsePane').text(JSON.stringify(response, null, 2));
        console.log({ response });
        $("#responsePanel").show();
    },

    updateFlightLists: async function () {
        const { getFlightKeys } = this.meta.methods;
        const flightKeys = await this.callAsyncFunction(
            getFlightKeys,
            'call',
        );
        flightKeys.forEach(key => {
            $('#registeredFlightList').append(`<li>${key}</li>`);
        });
    },

    registerAirline: async function (
        regAirlineName,
        regAirlineAddress,
    ) {
        const { registerAirline } = this.meta.methods;
        return await this.callAsyncFunction(
            registerAirline,
            regAirlineAddress,
            regAirlineName,
            'send',
        );
    },

    registerFlight: async function (
        timestamp,
    ) {
        const { registerFlight } = this.meta.methods;
        return await this.callAsyncFunction(
            registerFlight,
            timestamp,
            'send',
        );
    },

    signupAirline: async function (
        signupAirlineName,
    ) {
        const { signupAsAirline } = this.meta.methods;
        return await this.callAsyncFunction(
            signupAsAirline,
            signupAirlineName,
            'send',
        );
    },

    getAirline: async function (
        address,
    ) {
        const { getAirline } = this.meta.methods;
        const airline = await this.callAsyncFunction(
            getAirline,
            address,
            'call',
        );
        this.setResponse(airline);
    },

    approveAirline: async function (
        approveAirlineAddress,
    ) {
        const { approveAirline } = this.meta.methods;
        return await this.callAsyncFunction(
            approveAirline,
            approveAirlineAddress,
            'send',
        );
    },

    purchaseFlight: async function (
        flightKey,
        amount,
    ) {
        const { buyInsurance } = this.meta.methods;
        console.log({ buyInsurance });
        return await this.callAsyncFunction(
            buyInsurance,
            flightKey,
            `send:${amount}`,
        );
    },

    fund: async function (
    ) {
        const { fund } = this.meta.methods;
        return await this.callAsyncFunction(
            fund,
            `send:${new BigNumber(10000000000000000000)}`,
        );
    },

    getFlightStatus: async function (
        flightKey,
    ) {
        const { fetchFlightStatus } = this.meta.methods;
        return await this.callAsyncFunction(
            fetchFlightStatus,
            flightKey,
            'send',
        );
    },

    withdrawFunds: async function () {
        const { withdrawFunds } = this.meta.methods;
        return await this.callAsyncFunction(
            withdrawFunds,
            'send',
        );
    },

    fetchPassengerBalance: async function (
    ) {
        const { getPassengerBalance } = this.meta.methods;
        return await this.callAsyncFunction(
            getPassengerBalance,
            'call',
        );
    },

};

window.App = App;

window.addEventListener("load", async function () {
    if (window.ethereum) {
        // use MetaMask's provider
        App.web3 = new Web3(window.ethereum);
        await window.ethereum.enable(); // get permission to access accounts
    } else {
        console.warn("No web3 detected. Falling back to http://127.0.0.1:7545. You should remove this fallback when you deploy live",);
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
    }

    App.start();
});
