// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProductionOracle
 * @dev Oracle contract for verifying hydrogen production data
 * @notice This contract manages production data verification from external sources
 */
contract ProductionOracle is Ownable, Pausable, ReentrancyGuard {
    
    // Events
    event ProductionDataSubmitted(
        address indexed producer,
        string indexed plantId,
        uint256 amount,
        uint256 timestamp,
        bytes32 dataHash
    );
    
    event ProductionDataVerified(
        address indexed producer,
        string indexed plantId,
        uint256 amount,
        uint256 timestamp,
        address indexed verifier
    );
    
    event VerifierAdded(address indexed verifier, string name);
    event VerifierRemoved(address indexed verifier);
    
    // Structs
    struct ProductionData {
        address producer;
        string plantId;
        uint256 amount;
        uint256 productionTime;
        uint256 submissionTime;
        bytes32 dataHash;
        bool isVerified;
        address verifier;
        string ipfsHash; // For storing detailed production reports
    }
    
    struct Verifier {
        string name;
        string organization;
        bool isActive;
        uint256 verificationCount;
        uint256 registrationTime;
    }
    
    // State variables
    mapping(bytes32 => ProductionData) public productionRecords;
    mapping(address => Verifier) public verifiers;
    mapping(address => bytes32[]) public producerSubmissions;
    mapping(address => uint256) public verifierReputationScore;
    
    address[] public activeVerifiers;
    bytes32[] public pendingVerifications;
    
    uint256 public constant VERIFICATION_TIMEOUT = 24 hours;
    uint256 public constant MIN_VERIFIERS_REQUIRED = 2;
    uint256 public verificationFee = 0.001 ether;
    
    // Modifiers
    modifier onlyVerifier() {
        require(verifiers[msg.sender].isActive, "Not an active verifier");
        _;
    }
    
    modifier validProductionData(uint256 amount, uint256 productionTime) {
        require(amount > 0, "Amount must be greater than zero");
        require(productionTime <= block.timestamp, "Production time cannot be in future");
        require(productionTime >= block.timestamp - 30 days, "Production data too old");
        _;
    }
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Add a new verifier to the system
     * @param verifier Address of the verifier
     * @param name Name of the verifier
     * @param organization Organization name
     */
    function addVerifier(
        address verifier,
        string memory name,
        string memory organization
    ) external onlyOwner {
        require(verifier != address(0), "Invalid verifier address");
        require(!verifiers[verifier].isActive, "Verifier already exists");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        verifiers[verifier] = Verifier({
            name: name,
            organization: organization,
            isActive: true,
            verificationCount: 0,
            registrationTime: block.timestamp
        });
        
        activeVerifiers.push(verifier);
        verifierReputationScore[verifier] = 100; // Starting reputation
        
        emit VerifierAdded(verifier, name);
    }
    
    /**
     * @dev Remove a verifier from the system
     * @param verifier Address of the verifier to remove
     */
    function removeVerifier(address verifier) external onlyOwner {
        require(verifiers[verifier].isActive, "Verifier not active");
        
        verifiers[verifier].isActive = false;
        
        // Remove from active verifiers array
        for (uint256 i = 0; i < activeVerifiers.length; i++) {
            if (activeVerifiers[i] == verifier) {
                activeVerifiers[i] = activeVerifiers[activeVerifiers.length - 1];
                activeVerifiers.pop();
                break;
            }
        }
        
        emit VerifierRemoved(verifier);
    }
    
    /**
     * @dev Submit production data for verification
     * @param producer Address of the producer
     * @param plantId Plant identifier
     * @param amount Amount of hydrogen produced (in kg * 10^18)
     * @param productionTime Timestamp of production
     * @param ipfsHash IPFS hash of detailed production report
     */
    function submitProductionData(
        address producer,
        string memory plantId,
        uint256 amount,
        uint256 productionTime,
        string memory ipfsHash
    ) external payable validProductionData(amount, productionTime) whenNotPaused {
        require(msg.value >= verificationFee, "Insufficient verification fee");
        require(bytes(plantId).length > 0, "Plant ID cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        
        // Create unique hash for this submission
        bytes32 dataHash = keccak256(abi.encodePacked(
            producer,
            plantId,
            amount,
            productionTime,
            ipfsHash
        ));
        
        require(productionRecords[dataHash].submissionTime == 0, "Data already submitted");
        
        productionRecords[dataHash] = ProductionData({
            producer: producer,
            plantId: plantId,
            amount: amount,
            productionTime: productionTime,
            submissionTime: block.timestamp,
            dataHash: dataHash,
            isVerified: false,
            verifier: address(0),
            ipfsHash: ipfsHash
        });
        
        producerSubmissions[producer].push(dataHash);
        pendingVerifications.push(dataHash);
        
        emit ProductionDataSubmitted(producer, plantId, amount, productionTime, dataHash);
        
        // Refund excess payment
        if (msg.value > verificationFee) {
            payable(msg.sender).transfer(msg.value - verificationFee);
        }
    }
    
    /**
     * @dev Verify production data (called by authorized verifiers)
     * @param dataHash Hash of the production data to verify
     * @param isValid Whether the production data is valid
     */
    function verifyProductionData(
        bytes32 dataHash,
        bool isValid
    ) external onlyVerifier whenNotPaused nonReentrant {
        ProductionData storage data = productionRecords[dataHash];
        require(data.submissionTime > 0, "Production data not found");
        require(!data.isVerified, "Data already verified");
        require(
            block.timestamp <= data.submissionTime + VERIFICATION_TIMEOUT,
            "Verification timeout exceeded"
        );
        
        if (isValid) {
            data.isVerified = true;
            data.verifier = msg.sender;
            
            // Update verifier stats
            verifiers[msg.sender].verificationCount++;
            verifierReputationScore[msg.sender] += 1;
            
            // Remove from pending verifications
            _removePendingVerification(dataHash);
            
            emit ProductionDataVerified(
                data.producer,
                data.plantId,
                data.amount,
                data.productionTime,
                msg.sender
            );
        } else {
            // Invalid data - remove from system
            _removePendingVerification(dataHash);
            delete productionRecords[dataHash];
        }
    }
    
    /**
     * @dev Get production data by hash
     * @param dataHash Hash of the production data
     * @return ProductionData struct
     */
    function getProductionData(bytes32 dataHash) external view returns (ProductionData memory) {
        return productionRecords[dataHash];
    }
    
    /**
     * @dev Get all submissions for a producer
     * @param producer Address of the producer
     * @return Array of data hashes
     */
    function getProducerSubmissions(address producer) external view returns (bytes32[] memory) {
        return producerSubmissions[producer];
    }
    
    /**
     * @dev Get pending verifications
     * @return Array of pending data hashes
     */
    function getPendingVerifications() external view returns (bytes32[] memory) {
        return pendingVerifications;
    }
    
    /**
     * @dev Get active verifiers
     * @return Array of verifier addresses
     */
    function getActiveVerifiers() external view returns (address[] memory) {
        return activeVerifiers;
    }
    
    /**
     * @dev Check if production data is verified and ready for credit issuance
     * @param dataHash Hash of the production data
     * @return bool Whether data is verified
     */
    function isProductionVerified(bytes32 dataHash) external view returns (bool) {
        return productionRecords[dataHash].isVerified;
    }
    
    /**
     * @dev Set verification fee (only owner)
     * @param newFee New verification fee in wei
     */
    function setVerificationFee(uint256 newFee) external onlyOwner {
        verificationFee = newFee;
    }
    
    /**
     * @dev Withdraw accumulated fees (only owner)
     * @param to Address to withdraw to
     */
    function withdrawFees(address payable to) external onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        to.transfer(balance);
    }
    
    /**
     * @dev Emergency cleanup of expired pending verifications
     */
    function cleanupExpiredVerifications() external {
        uint256 currentTime = block.timestamp;
        
        for (uint256 i = pendingVerifications.length; i > 0; i--) {
            bytes32 dataHash = pendingVerifications[i - 1];
            ProductionData storage data = productionRecords[dataHash];
            
            if (currentTime > data.submissionTime + VERIFICATION_TIMEOUT) {
                // Remove expired verification
                pendingVerifications[i - 1] = pendingVerifications[pendingVerifications.length - 1];
                pendingVerifications.pop();
                delete productionRecords[dataHash];
            }
        }
    }
    
    /**
     * @dev Internal function to remove pending verification
     * @param dataHash Hash to remove
     */
    function _removePendingVerification(bytes32 dataHash) internal {
        for (uint256 i = 0; i < pendingVerifications.length; i++) {
            if (pendingVerifications[i] == dataHash) {
                pendingVerifications[i] = pendingVerifications[pendingVerifications.length - 1];
                pendingVerifications.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
