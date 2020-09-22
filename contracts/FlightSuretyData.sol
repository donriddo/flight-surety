// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <=0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false
    uint256 public activeAirlineCount = 0;
    uint256 public airlineCount = 0;
    uint256 flightCount = 0;
    uint256 private percentageApproval = 50;
    uint256 private insuranceFactor = 150;

    mapping(address => uint256) private authorizedContracts;

    struct Airline {
        uint256 id;
        string name;
        bool isApproved;
        bool hasFunded;
        uint256 approvalCount;
        mapping(address => bool) approvals;
    }
    mapping(address => Airline) airlines;
    address[] airlineAddresses;

    struct Insuree {
        bool hasInsured;
        uint256 bal; // how much insuree owns within the contract
        uint256 amountPaid;
        bool isRefunded;
    }

    struct Flight {
        uint256 id;
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        uint256 insureeCount;
        mapping(address => Insuree) insurees;
        address[] insureeAddresses;
    }
    mapping(bytes32 => Flight) private flights;
    bytes32[] private flightKeys;
    mapping(address => uint256) private passengers;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() public {
        contractOwner = msg.sender;
        Airline memory genesisAirline;

        genesisAirline.id = airlineCount + 1;
        genesisAirline.name = "Genesis Airline";
        genesisAirline.isApproved = true;
        genesisAirline.hasFunded = true;

        airlines[contractOwner] = genesisAirline;
        airlineCount += 1;
        activeAirlineCount += 1;
        airlineAddresses.push(contractOwner);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsCallerAuthorized() {
        require(
            authorizedContracts[msg.sender] == 1,
            "Caller is not authorized"
        );
        _;
    }

    modifier isRegistered(address caller) {
        require(airlines[caller].id > 0, "You are not a registered airline");
        _;
    }

    modifier canRegister(address registrar, address airline) {
        require(
            airlines[registrar].id > 0 || registrar == airline,
            "You are not a registered airline"
        );
        require(
            airlines[registrar].isApproved || registrar == airline,
            "You cannnot perform this operation. You have not been approved"
        );
        require(
            airlines[registrar].hasFunded || registrar == airline,
            "You cannnot perform this operation. You are yet to fund"
        );
        _;
    }

    modifier isApproved(address caller) {
        require(
            airlines[caller].isApproved,
            "You cannnot perform this operation. You have not been approved"
        );
        _;
    }

    modifier hasFunded(address caller) {
        require(
            airlines[caller].hasFunded,
            "You cannnot perform this operation. You are yet to fund"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */

    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */

    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function setPercentageApproval(uint256 percentage)
        external
        requireContractOwner
        requireIsOperational
    {
        percentageApproval = percentage;
    }

    function setInsuranceFactor(uint256 factor)
        external
        requireContractOwner
        requireIsOperational
    {
        insuranceFactor = factor;
    }

    function getFlightKey(address airline, uint256 timestamp)
        internal
        view
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(airline, timestamp));
    }

    // Function that allows you to convert an address into a payable address
    function _make_payable(address x) internal pure returns (address payable) {
        return address(uint160(x));
    }

    function authorizeContract(address contractAddress)
        external
        requireContractOwner
    {
        authorizedContracts[contractAddress] = 1;
    }

    function isContractAuthorized(address contractAddress)
        public
        view
        returns (bool)
    {
        return authorizedContracts[contractAddress] == 1;
    }

    function deauthorizeContract(address contractAddress)
        external
        requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */

    function registerAirline(
        address registrar,
        address addr,
        string calldata name,
        bool approved,
        bool funded
    )
        external
        requireIsOperational
        requireIsCallerAuthorized
        canRegister(registrar, addr)
    {
        require(airlines[addr].id == 0, "Airline is already registered");
        Airline memory newAirline;

        newAirline.id = airlineCount + 1;
        newAirline.name = name;
        newAirline.isApproved = approved;
        newAirline.hasFunded = funded;

        airlines[addr] = newAirline;
        airlineCount += 1;

        if (newAirline.isApproved && newAirline.hasFunded) {
            activeAirlineCount += 1;
        }

        airlineAddresses.push(addr);
    }

    function getAirlines() external view returns (address[] memory) {
        return airlineAddresses;
    }

    function getAirline(address addr)
        external
        view
        returns (
            uint256,
            string memory,
            bool,
            uint256,
            bool
        )
    {
        Airline memory airline = airlines[addr];
        return (
            airline.id,
            airline.name,
            airline.isApproved,
            airline.approvalCount,
            airline.hasFunded
        );
    }

    function isAirline(address addr) external view returns (bool) {
        return airlines[addr].id > 0;
    }

    function getGenesisAirline()
        public
        view
        returns (
            uint256,
            string memory,
            bool,
            uint256,
            bool
        )
    {
        Airline memory airline = airlines[contractOwner];
        return (
            airline.id,
            airline.name,
            airline.isApproved,
            airline.approvalCount,
            airline.hasFunded
        );
    }

    function approveAirline(address approver, address addr)
        external
        requireIsOperational
        requireIsCallerAuthorized
        isRegistered(approver)
        isApproved(approver)
        hasFunded(approver)
    {
        require(approver != addr, "You cannot approve yourself");
        require(
            airlines[addr].isApproved == false,
            "Airline has already been approved"
        );
        require(airlines[addr].id > 0, "Airline has not been registered");
        require(
            airlines[addr].approvals[approver] == false,
            "You have already approved this airline"
        );

        airlines[addr].approvalCount += 1;
        airlines[addr].approvals[approver] = true;

        if (
            airlines[addr].approvalCount.mul(100).div(activeAirlineCount) >=
            percentageApproval
        ) {
            airlines[addr].isApproved = true;
        }
    }

    function getPercentageApproval(address addr)
        external
        view
        returns (uint256)
    {
        return airlines[addr].approvalCount.mul(100).div(activeAirlineCount);
    }

    function registerFlight(address registrar, uint256 ts)
        external
        requireIsOperational
        requireIsCallerAuthorized
        isRegistered(registrar)
        isApproved(registrar)
        hasFunded(registrar)
    {
        Flight memory newFlight;

        newFlight.id = flightCount + 1;
        newFlight.isRegistered = true;
        newFlight.statusCode = 0;
        newFlight.updatedTimestamp = ts;
        newFlight.airline = registrar;

        bytes32 flightKey = getFlightKey(registrar, ts);
        flights[flightKey] = newFlight;
        flightKeys.push(flightKey);
        flightCount += 1;
    }

    function getFlightKeys() external view returns (bytes32[] memory) {
        return flightKeys;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */

    function buyInsurance(
        address buyer,
        bytes32 flightKey,
        uint256 amountPaid
    ) external payable requireIsOperational requireIsCallerAuthorized {
        require(flights[flightKey].id > 0, "Flight does not exist");

        Insuree memory newInsuree;

        newInsuree.hasInsured = true;
        newInsuree.bal = 0;
        newInsuree.amountPaid = amountPaid;

        flights[flightKey].insurees[buyer] = newInsuree;

        uint256 newCount = flights[flightKey].insureeCount + 1;
        // update insuree count
        flights[flightKey].insureeCount = newCount;
        // keep track of new insuree address for easy refund
        flights[flightKey].insureeAddresses.push(buyer);
        passengers[buyer] = 0;
    }

    function getFlightInsurees(bytes32 flightKey)
        external
        view
        returns (address[] memory)
    {
        return flights[flightKey].insureeAddresses;
    }

    function getFlightDetails(bytes32 flightKey)
        external
        view
        returns (
            uint256, // id;
            bool, // isRegistered;
            uint8, // statusCode;
            uint256, // updatedTimestamp;
            address, // airline;
            uint256 // insureeCount
        )
    {
        require(flights[flightKey].id > 0, "Flight does not exist");
        Flight memory flight = flights[flightKey];

        return (
            flight.id,
            flight.isRegistered,
            flight.statusCode,
            flight.updatedTimestamp,
            flight.airline,
            flight.insureeCount
        );
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(bytes32 flightKey)
        external
        requireIsOperational
        requireIsCallerAuthorized
    {
        require(flights[flightKey].id > 0, "Flight does not exist");
        require(
            flights[flightKey].insureeCount > 0,
            "No passenger has insured this flight"
        );
        for (uint256 i = 0; i < flights[flightKey].insureeCount; i++) {
            address insureeAddress = flights[flightKey].insureeAddresses[i];

            if (!flights[flightKey].insurees[insureeAddress].isRefunded) {
                uint256 amountPaid = flights[flightKey].insurees[insureeAddress]
                    .amountPaid;
                uint256 refundable = amountPaid.mul(insuranceFactor).div(100);
                uint256 newBal = flights[flightKey].insurees[insureeAddress]
                    .bal
                    .add(refundable);

                flights[flightKey].insurees[insureeAddress].bal = newBal;

                flights[flightKey].insurees[insureeAddress].isRefunded = true;

                passengers[insureeAddress] += newBal;
            }
        }
    }

    function getPassengerBalance(address passenger)
        external
        view
        returns (uint256)
    {
        return passengers[passenger];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay(address caller)
        external
        requireIsOperational
        requireIsCallerAuthorized
    {
        // Check
        require(passengers[caller] > 0, "You have no funds to withdraw");
        // Effect
        passengers[caller] = 0;
        // Interaction
        address payable passenger = _make_payable(caller);
        passenger.transfer(passengers[caller]);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */

    function fund(address caller)
        external
        payable
        requireIsOperational
        requireIsCallerAuthorized
        isRegistered(caller)
        isApproved(caller)
    {
        require(!airlines[caller].hasFunded, "You have already funded");

        airlines[caller].hasFunded = true;
        // Now allow airline to be able to partake in decision making
        activeAirlineCount += 1;
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    receive() external payable {}
}
