// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <=0.7.0;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "@openzeppelin/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner; // Account used to deploy contract
    bool private operational;
    FSData flightSuretyData;
    uint256 private minimumAirlineCount = 4;
    uint256 private minimumOperatorCount = 3;

    address[] multiCalls = new address[](0);

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
        // Modify to call data contract's status
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

    // Define a modifier that checks the price to pay and refunds the remaining balance
    modifier checkValue(uint256 amount) {
        _;
        if (msg.value > amount) {
            uint256 amountToReturn = msg.value - amount;
            msg.sender.transfer(amountToReturn);
        }
    }

    // Define a modifier that checks if the paid amount is sufficient to cover the price
    modifier paidEnough(uint256 amount) {
        require(msg.value >= amount, "Insufficient funds");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     *
     */
    constructor(address dataContract) public {
        contractOwner = msg.sender;
        operational = true;
        flightSuretyData = FSData(dataContract);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return operational; // Modify to call data contract's status
    }

    function setMinimumAirlineCount(uint256 count)
        external
        requireContractOwner
        requireIsOperational
    {
        minimumAirlineCount = count;
    }

    function setMinimumOperatorCount(uint256 count)
        external
        requireContractOwner
        requireIsOperational
    {
        minimumOperatorCount = count;
    }

    function setOperatingStatus(bool mode) external {
        require(
            mode != operational,
            "New mode must be different from existing mode"
        );

        bool isRegistered = flightSuretyData.isAirline(msg.sender);

        require(isRegistered, "Caller is not an airline");

        bool isDuplicate = false;
        for (uint256 c = 0; c < multiCalls.length; c++) {
            if (multiCalls[c] == msg.sender) {
                isDuplicate = true;
                break;
            }
        }
        require(!isDuplicate, "Caller has already called this function.");

        multiCalls.push(msg.sender);
        if (multiCalls.length >= minimumOperatorCount) {
            operational = mode;
            multiCalls = new address[](0);
        }
    }

    // Function that allows you to convert an address into a payable address
    function _make_payable(address x) internal pure returns (address payable) {
        return address(uint160(x));
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function amIAuthorized() public view returns (bool) {
        return flightSuretyData.isContractAuthorized(address(this));
    }

    /**
     * @dev Add an airline to the registration queue
     *
     */

    function registerAirline(address addr, string memory name) public {
        uint256 currentAirlineCount = flightSuretyData.airlineCount();
        if (currentAirlineCount >= 4) {
            // can no longer be auto-approved but wait for 50% approval
            flightSuretyData.registerAirline(
                msg.sender,
                addr,
                name,
                false, // isApproved
                false // hasFunded
            );
        } else {
            // auto-approved but still have to fund to participate
            flightSuretyData.registerAirline(
                msg.sender,
                addr,
                name,
                true, // isApproved
                false // hasFunded
            );
        }
    }

    function getAirlines() public view returns (address[] memory) {
        return flightSuretyData.getAirlines();
    }

    function getFlightInsurees(bytes32 flightKey)
        public
        view
        returns (address[] memory)
    {
        return flightSuretyData.getFlightInsurees(flightKey);
    }

    function getFlightKeys() public view returns (bytes32[] memory) {
        return flightSuretyData.getFlightKeys();
    }

    function getAppBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getDataBalance() public view returns (uint256) {
        return flightSuretyData.getBalance();
    }

    function getAirline(address addr)
        public
        view
        returns (
            string memory name,
            bool isApproved,
            uint256 approvalCount,
            bool hasFunded,
            uint256 percentageApproval,
            uint256 totalActiveAirlines
        )
    {
        uint256 percentage = flightSuretyData.getPercentageApproval(addr);
        uint256 activeAirlineCount = flightSuretyData.activeAirlineCount();
        (
            uint256 id,
            string memory name,
            bool isApproved,
            uint256 approvalCount,
            bool hasFunded
        ) = flightSuretyData.getAirline(addr);

        return (
            name,
            isApproved,
            approvalCount,
            hasFunded,
            percentage,
            activeAirlineCount
        );
    }

    function signupAsAirline(string memory name) public {
        uint256 currentAirlineCount = flightSuretyData.airlineCount();
        require(
            currentAirlineCount >= minimumAirlineCount,
            "You can only be registered by an existing airline"
        );
        flightSuretyData.registerAirline(
            msg.sender,
            msg.sender,
            name,
            false,
            false
        );
    }

    /**
     * @dev Approve an airline
     *
     */

    function approveAirline(address addr) public {
        flightSuretyData.approveAirline(msg.sender, addr);
    }

    /**
     * @dev Fund
     *
     */

    function fund() public payable paidEnough(10 ether) checkValue(10 ether) {
        flightSuretyData.fund(msg.sender);
        address payable fsdata = _make_payable(address(flightSuretyData));
        fsdata.transfer(10 ether);
    }

    /**
     * @dev Withdraw Funds
     *
     */

    function withdrawFunds() public {
        flightSuretyData.pay(msg.sender);
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */

    function registerFlight(uint256 ts) public {
        flightSuretyData.registerFlight(msg.sender, ts);
    }

    /**
     * @dev Buy flight insurance
     *
     */

    function buyInsurance(bytes32 flightKey)
        public
        payable
        checkValue(1 ether)
    {
        uint256 amountPaid;

        if (msg.value <= 1 ether) {
            amountPaid = msg.value;
        } else {
            amountPaid = 1 ether;
        }

        flightSuretyData.buyInsurance(msg.sender, flightKey, amountPaid);
        address payable fsdata = _make_payable(address(flightSuretyData));
        fsdata.transfer(amountPaid);
    }

    /**
     * @dev Called after oracle has updated flight status
     *
     */

    event InsureesCredited(bytes32 flightKey, uint8 statusCode);

    function processFlightStatus(bytes32 flightKey, uint8 statusCode) internal {
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.creditInsurees(flightKey);
            emit InsureesCredited(flightKey, statusCode);
        }
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(bytes32 flightKey)
        external
        returns (
            uint8, // statusCode,
            uint256, // updatedTimestamp,
            address, // airline,
            uint256 // insureeCount
        )
    {
        (
            uint256 id,
            bool isRegistered,
            uint8 statusCode,
            uint256 updatedTimestamp,
            address airline,
            uint256 insureeCount
        ) = flightSuretyData.getFlightDetails(flightKey);

        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flightKey, updatedTimestamp)
        );

        ResponseInfo memory newResponse;
        newResponse.requester = msg.sender;
        newResponse.isOpen = true;

        oracleResponses[key] = newResponse;

        emit OracleRequest(flightKey, index, airline, updatedTimestamp);
        return (statusCode, updatedTimestamp, airline, insureeCount);
    }

    function getPassengerBalance() public view returns (uint256) {
        return flightSuretyData.getPassengerBalance(msg.sender);
    }

    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        bytes32 flightKey,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        bytes32 flightKey,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        bytes32 flightKey,
        uint8 index,
        address airline,
        uint256 timestamp
    );

    event OracleRegistered(address oracle, uint8[3] indexes);

    // Register an oracle with the contract
    function registerOracle()
        external
        payable
        paidEnough(REGISTRATION_FEE)
        checkValue(REGISTRATION_FEE)
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
        emit OracleRegistered(msg.sender, indexes);
        address payable fsdata = _make_payable(address(flightSuretyData));
        fsdata.transfer(REGISTRATION_FEE);
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        bytes32 flightKey,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flightKey, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flightKey, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flightKey, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(flightKey, statusCode);
        }
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion

    receive() external payable checkValue(10 ether) {
        flightSuretyData.fund(msg.sender);
        address payable fsdata = _make_payable(address(flightSuretyData));
        fsdata.transfer(10 ether);
    }
}

interface FSData {
    function registerAirline(
        address registrar,
        address addr,
        string calldata name,
        bool isApproved,
        bool hasFunded
    ) external;

    function approveAirline(address approver, address addr) external;

    function registerFlight(address registrar, uint256 ts) external;

    function buyInsurance(
        address caller,
        bytes32 flightKey,
        uint256 amountPaid
    ) external payable;

    function creditInsurees(bytes32 flightKey) external;

    function pay(address caller) external;

    function fund(address caller) external payable;

    function airlineCount() external view returns (uint256);

    function activeAirlineCount() external view returns (uint256);

    function authorizeContract(address contractAddress) external;

    function isContractAuthorized(address contractAddress)
        external
        view
        returns (bool);

    function getAirline(address addr)
        external
        view
        returns (
            uint256,
            string memory,
            bool,
            uint256,
            bool
        );

    function isAirline(address addr) external view returns (bool);

    function getAirlines() external view returns (address[] memory);

    function getFlightKeys() external view returns (bytes32[] memory);

    function getBalance() external view returns (uint256);

    function getFlightInsurees(bytes32 flightKey)
        external
        view
        returns (address[] memory);

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
        );

    function getPassengerBalance(address passenger)
        external
        view
        returns (uint256);

    function getPercentageApproval(address addr)
        external
        view
        returns (uint256);
}
