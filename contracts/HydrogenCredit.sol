// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HydrogenCredit
 * @dev ERC20 token representing green hydrogen production credits
 * @notice This contract manages the issuance, transfer, and tracking of green hydrogen credits
 */
contract HydrogenCredit is ERC20, Ownable, Pausable, ReentrancyGuard {
    // Events
    event CreditIssued(
        address indexed producer,
        uint256 amount,
        string indexed plantId,
        uint256 timestamp,
        string renewableSource
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

    // Structs
    struct Producer {
        string plantId;
        string location;
        string renewableSource;
        uint256 totalProduced;
        uint256 registrationTime;
        bool isActive;
    }
    
    struct CreditBatch {
        uint256 batchId;
        address producer;
        uint256 amount;
        string plantId;
        uint256 productionTime;
        string renewableSource;
        bool isRetired;
    }

    // State variables
    mapping(address => Producer) public producers;
    mapping(uint256 => CreditBatch) public creditBatches;
    mapping(address => uint256[]) public producerBatches;
    mapping(address => uint256) public retiredCredits;
    
    uint256 public totalCreditBatches;
    uint256 public totalRetiredCredits;
    address[] public registeredProducers;
    
    // Constants
    uint256 private constant DECIMALS_MULTIPLIER = 10**18;
    
    // Modifiers
    modifier onlyRegisteredProducer() {
        require(producers[msg.sender].isActive, "Producer not registered or inactive");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        // Constructor now initializes Ownable with initialOwner
    }

    /**
     * @dev Register a new hydrogen producer
     * @param producer Address of the producer
     * @param plantId Unique identifier for the production plant
     * @param location Physical location of the plant
     * @param renewableSource Type of renewable energy used (solar, wind, etc.)
     */
    function registerProducer(
        address producer,
        string memory plantId,
        string memory location,
        string memory renewableSource
    ) external onlyOwner {
        require(producer != address(0), "Invalid producer address");
        require(!producers[producer].isActive, "Producer already registered");
        require(bytes(plantId).length > 0, "Plant ID cannot be empty");
        require(bytes(location).length > 0, "Location cannot be empty");
        require(bytes(renewableSource).length > 0, "Renewable source cannot be empty");

        producers[producer] = Producer({
            plantId: plantId,
            location: location,
            renewableSource: renewableSource,
            totalProduced: 0,
            registrationTime: block.timestamp,
            isActive: true
        });
        
        registeredProducers.push(producer);
        
        emit ProducerRegistered(producer, plantId, location, block.timestamp);
    }

    /**
     * @dev Issue new hydrogen credits to a producer
     * @param producer Address of the producer
     * @param amount Amount of credits to issue (in kg of hydrogen * 10^18)
     * @param productionTime Timestamp of hydrogen production
     */
    function issueCredits(
        address producer,
        uint256 amount,
        uint256 productionTime
    ) external onlyOwner validAmount(amount) whenNotPaused {
        require(producers[producer].isActive, "Producer not registered or inactive");
        require(productionTime <= block.timestamp, "Production time cannot be in the future");
        
        Producer storage prod = producers[producer];
        
        // Create new credit batch
        totalCreditBatches++;
        uint256 batchId = totalCreditBatches;
        
        creditBatches[batchId] = CreditBatch({
            batchId: batchId,
            producer: producer,
            amount: amount,
            plantId: prod.plantId,
            productionTime: productionTime,
            renewableSource: prod.renewableSource,
            isRetired: false
        });
        
        producerBatches[producer].push(batchId);
        prod.totalProduced += amount;
        
        // Mint tokens to producer
        _mint(producer, amount);
        
        emit CreditIssued(
            producer,
            amount,
            prod.plantId,
            productionTime,
            prod.renewableSource
        );
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
     * @dev Get producer information
     * @param producer Address of the producer
     * @return Producer struct containing producer details
     */
    function getProducer(address producer) external view returns (Producer memory) {
        return producers[producer];
    }

    /**
     * @dev Get credit batch information
     * @param batchId ID of the credit batch
     * @return CreditBatch struct containing batch details
     */
    function getCreditBatch(uint256 batchId) external view returns (CreditBatch memory) {
        require(batchId <= totalCreditBatches && batchId > 0, "Invalid batch ID");
        return creditBatches[batchId];
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
     * @dev Get total number of registered producers
     * @return Number of registered producers
     */
    function getRegisteredProducersCount() external view returns (uint256) {
        return registeredProducers.length;
    }

    /**
     * @dev Get all registered producer addresses
     * @return Array of producer addresses
     */
    function getAllProducers() external view returns (address[] memory) {
        return registeredProducers;
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

    /**
     * @dev Get contract statistics
     * @return totalSupply Current total supply
     * @return totalBatches Total number of credit batches
     * @return totalRetired Total retired credits
     * @return producerCount Number of registered producers
     */
    function getContractStats() external view returns (
        uint256 totalSupply,
        uint256 totalBatches,
        uint256 totalRetired,
        uint256 producerCount
    ) {
        return (
            super.totalSupply(),
            totalCreditBatches,
            totalRetiredCredits,
            registeredProducers.length
        );
    }
}
