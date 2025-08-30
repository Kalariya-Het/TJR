// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ProductionOracle.sol";

/**
 * @title HydrogenCreditV2
 * @dev Enhanced ERC20 token with production verification via oracle
 * @notice This contract manages verified green hydrogen production credits
 */
contract HydrogenCreditV2 is ERC20, Ownable, Pausable, ReentrancyGuard {
    
    // Events
    event CreditIssued(
        address indexed producer,
        uint256 amount,
        string indexed plantId,
        uint256 timestamp,
        string renewableSource,
        bytes32 indexed verificationHash
    );
    
    event CreditTransferred(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );
    
    event ProducerRegistered(
        address indexed producer,
        string plantId,
        string location,
        uint256 timestamp
    );
    
    event CreditRetired(
        address indexed owner,
        uint256 amount,
        string reason,
        uint256 timestamp
    );

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    
    event ProductionLimitUpdated(address indexed producer, uint256 newLimit);

    // Structs
    struct Producer {
        string plantId;
        string location;
        string renewableSource;
        uint256 totalProduced;
        uint256 registrationTime;
        uint256 monthlyProductionLimit;
        uint256 currentMonthProduction;
        uint256 lastProductionMonth;
        bool isActive;
        bool isVerified; // KYC verification status
    }
    
    struct CreditBatch {
        uint256 batchId;
        address producer;
        uint256 amount;
        string plantId;
        uint256 productionTime;
        string renewableSource;
        bytes32 verificationHash;
        bool isRetired;
        string ipfsHash;
    }

    // State variables
    mapping(address => Producer) public producers;
    mapping(uint256 => CreditBatch) public creditBatches;
    mapping(address => uint256[]) public producerBatches;
    mapping(address => uint256) public retiredCredits;
    mapping(bytes32 => bool) public usedVerifications;
    
    uint256 public totalCreditBatches;
    uint256 public totalRetiredCredits;
    address[] public registeredProducers;
    
    ProductionOracle public productionOracle;
    
    // Constants
    uint256 private constant DECIMALS_MULTIPLIER = 10**18;
    uint256 private constant MAX_MONTHLY_PRODUCTION = 10000 * DECIMALS_MULTIPLIER; // 10,000 kg default limit
    
    // Modifiers
    modifier onlyRegisteredProducer() {
        require(producers[msg.sender].isActive, "Producer not registered or inactive");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }

    modifier onlyVerifiedProducer(address producer) {
        require(producers[producer].isVerified, "Producer not KYC verified");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        address _productionOracle
    ) ERC20(name, symbol) Ownable(initialOwner) {
        require(_productionOracle != address(0), "Invalid oracle address");
        productionOracle = ProductionOracle(_productionOracle);
    }

    /**
     * @dev Register a new hydrogen producer with enhanced verification
     * @param producer Address of the producer
     * @param plantId Unique identifier for the production plant
     * @param location Physical location of the plant
     * @param renewableSource Type of renewable energy used
     * @param monthlyLimit Monthly production limit for this producer
     */
    function registerProducer(
        address producer,
        string memory plantId,
        string memory location,
        string memory renewableSource,
        uint256 monthlyLimit
    ) external onlyOwner {
        require(producer != address(0), "Invalid producer address");
        require(!producers[producer].isActive, "Producer already registered");
        require(bytes(plantId).length > 0, "Plant ID cannot be empty");
        require(bytes(location).length > 0, "Location cannot be empty");
        require(bytes(renewableSource).length > 0, "Renewable source cannot be empty");
        require(monthlyLimit > 0 && monthlyLimit <= MAX_MONTHLY_PRODUCTION, "Invalid monthly limit");

        producers[producer] = Producer({
            plantId: plantId,
            location: location,
            renewableSource: renewableSource,
            totalProduced: 0,
            registrationTime: block.timestamp,
            monthlyProductionLimit: monthlyLimit,
            currentMonthProduction: 0,
            lastProductionMonth: _getCurrentMonth(),
            isActive: true,
            isVerified: false // Requires separate KYC verification
        });
        
        registeredProducers.push(producer);
        
        emit ProducerRegistered(producer, plantId, location, block.timestamp);
    }

    /**
     * @dev Verify producer KYC status (only owner)
     * @param producer Address of the producer
     * @param verified Verification status
     */
    function setProducerVerification(address producer, bool verified) external onlyOwner {
        require(producers[producer].isActive, "Producer not registered");
        producers[producer].isVerified = verified;
    }

    /**
     * @dev Issue credits based on verified production data from oracle
     * @param verificationHash Hash of the verified production data from oracle
     */
    function issueCreditsFromVerification(
        bytes32 verificationHash
    ) external onlyOwner whenNotPaused nonReentrant {
        require(!usedVerifications[verificationHash], "Verification already used");
        require(productionOracle.isProductionVerified(verificationHash), "Production not verified");
        
        ProductionOracle.ProductionData memory data = productionOracle.getProductionData(verificationHash);
        require(data.isVerified, "Data not verified");
        require(producers[data.producer].isActive, "Producer not active");
        require(producers[data.producer].isVerified, "Producer not KYC verified");
        
        Producer storage prod = producers[data.producer];
        
        // Check monthly production limits
        uint256 currentMonth = _getCurrentMonth();
        if (prod.lastProductionMonth != currentMonth) {
            prod.currentMonthProduction = 0;
            prod.lastProductionMonth = currentMonth;
        }
        
        require(
            prod.currentMonthProduction + data.amount <= prod.monthlyProductionLimit,
            "Monthly production limit exceeded"
        );
        
        // Mark verification as used
        usedVerifications[verificationHash] = true;
        
        // Create new credit batch
        totalCreditBatches++;
        uint256 batchId = totalCreditBatches;
        
        creditBatches[batchId] = CreditBatch({
            batchId: batchId,
            producer: data.producer,
            amount: data.amount,
            plantId: data.plantId,
            productionTime: data.productionTime,
            renewableSource: prod.renewableSource,
            verificationHash: verificationHash,
            isRetired: false,
            ipfsHash: data.ipfsHash
        });
        
        producerBatches[data.producer].push(batchId);
        prod.totalProduced += data.amount;
        prod.currentMonthProduction += data.amount;
        
        // Mint tokens to producer
        _mint(data.producer, data.amount);
        
        emit CreditIssued(
            data.producer,
            data.amount,
            data.plantId,
            data.productionTime,
            prod.renewableSource,
            verificationHash
        );
    }

    /**
     * @dev Update production oracle address (only owner)
     * @param newOracle Address of the new oracle contract
     */
    function updateProductionOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        address oldOracle = address(productionOracle);
        productionOracle = ProductionOracle(newOracle);
        emit OracleUpdated(oldOracle, newOracle);
    }

    /**
     * @dev Update monthly production limit for a producer
     * @param producer Address of the producer
     * @param newLimit New monthly production limit
     */
    function updateProductionLimit(address producer, uint256 newLimit) external onlyOwner {
        require(producers[producer].isActive, "Producer not registered");
        require(newLimit > 0 && newLimit <= MAX_MONTHLY_PRODUCTION, "Invalid limit");
        
        producers[producer].monthlyProductionLimit = newLimit;
        emit ProductionLimitUpdated(producer, newLimit);
    }

    /**
     * @dev Transfer credits with additional logging
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        validAmount(amount) 
        whenNotPaused 
        returns (bool) 
    {
        bool success = super.transfer(to, amount);
        if (success) {
            emit CreditTransferred(msg.sender, to, amount, block.timestamp);
        }
        return success;
    }

    /**
     * @dev Transfer credits from one address to another with additional logging
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transferFrom(address from, address to, uint256 amount)
        public
        override
        validAmount(amount)
        whenNotPaused
        returns (bool)
    {
        bool success = super.transferFrom(from, to, amount);
        if (success) {
            emit CreditTransferred(from, to, amount, block.timestamp);
        }
        return success;
    }

    /**
     * @dev Retire credits to prevent double counting
     * @param amount Amount of credits to retire
     * @param reason Reason for retirement
     */
    function retireCredits(uint256 amount, string memory reason) 
        external 
        validAmount(amount) 
        whenNotPaused 
        nonReentrant 
    {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(bytes(reason).length > 0, "Reason cannot be empty");
        
        _burn(msg.sender, amount);
        retiredCredits[msg.sender] += amount;
        totalRetiredCredits += amount;
        
        emit CreditRetired(msg.sender, amount, reason, block.timestamp);
    }

    /**
     * @dev Get producer information with enhanced details
     * @param producer Address of the producer
     * @return Producer struct containing producer details
     */
    function getProducer(address producer) external view returns (Producer memory) {
        return producers[producer];
    }

    /**
     * @dev Get credit batch information with verification details
     * @param batchId ID of the credit batch
     * @return CreditBatch struct containing batch details
     */
    function getCreditBatch(uint256 batchId) external view returns (CreditBatch memory) {
        require(batchId <= totalCreditBatches && batchId > 0, "Invalid batch ID");
        return creditBatches[batchId];
    }

    /**
     * @dev Get remaining monthly production capacity for a producer
     * @param producer Address of the producer
     * @return Remaining production capacity for current month
     */
    function getRemainingMonthlyCapacity(address producer) external view returns (uint256) {
        Producer memory prod = producers[producer];
        if (!prod.isActive) return 0;
        
        uint256 currentMonth = _getCurrentMonth();
        if (prod.lastProductionMonth != currentMonth) {
            return prod.monthlyProductionLimit;
        }
        
        return prod.monthlyProductionLimit > prod.currentMonthProduction 
            ? prod.monthlyProductionLimit - prod.currentMonthProduction 
            : 0;
    }

    /**
     * @dev Get all batch IDs for a producer
     * @param producer Address of the producer
     * @return Array of batch IDs
     */
    function getProducerBatches(address producer) external view returns (uint256[] memory) {
        return producerBatches[producer];
    }

    /**
     * @dev Get contract statistics with enhanced metrics
     * @return totalSupply Current total supply
     * @return totalBatches Total number of credit batches
     * @return totalRetired Total retired credits
     * @return producerCount Number of registered producers
     * @return verifiedProducerCount Number of KYC verified producers
     */
    function getContractStats() external view returns (
        uint256 totalSupply,
        uint256 totalBatches,
        uint256 totalRetired,
        uint256 producerCount,
        uint256 verifiedProducerCount
    ) {
        uint256 verified = 0;
        for (uint256 i = 0; i < registeredProducers.length; i++) {
            if (producers[registeredProducers[i]].isVerified) {
                verified++;
            }
        }
        
        return (
            super.totalSupply(),
            totalCreditBatches,
            totalRetiredCredits,
            registeredProducers.length,
            verified
        );
    }

    /**
     * @dev Get current month as a number for production tracking
     * @return Current month number (YYYYMM format)
     */
    function _getCurrentMonth() internal view returns (uint256) {
        return (block.timestamp / 30 days);
    }

    /**
     * @dev Deactivate a producer
     * @param producer Address of the producer to deactivate
     */
    function deactivateProducer(address producer) external onlyOwner {
        require(producers[producer].isActive, "Producer not active");
        producers[producer].isActive = false;
    }

    /**
     * @dev Reactivate a producer
     * @param producer Address of the producer to reactivate
     */
    function reactivateProducer(address producer) external onlyOwner {
        require(!producers[producer].isActive, "Producer already active");
        require(producers[producer].registrationTime > 0, "Producer not registered");
        producers[producer].isActive = true;
    }

    /**
     * @dev Get all registered producer addresses
     * @return Array of producer addresses
     */
    function getAllProducers() external view returns (address[] memory) {
        return registeredProducers;
    }

    /**
     * @dev Get total number of registered producers
     * @return Number of registered producers
     */
    function getRegisteredProducersCount() external view returns (uint256) {
        return registeredProducers.length;
    }

    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
