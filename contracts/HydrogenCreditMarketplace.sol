// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./HydrogenCredit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HydrogenCreditMarketplace
 * @dev Marketplace for trading green hydrogen credits
 * @notice This contract allows users to list, buy, and sell hydrogen credits
 */
contract HydrogenCreditMarketplace is Ownable, Pausable, ReentrancyGuard {
    HydrogenCredit public immutable hydrogenCredit;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 amount,
        uint256 pricePerUnit,
        uint256 timestamp
    );
    
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller,
        uint256 timestamp
    );
    
    event Purchase(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 totalPrice,
        uint256 timestamp
    );
    
    event PriceUpdated(
        uint256 indexed listingId,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 timestamp
    );

    // Structs
    struct Listing {
        uint256 id;
        address seller;
        uint256 amount;
        uint256 pricePerUnit; // Price in wei per credit unit
        uint256 createdAt;
        bool isActive;
    }

    // State variables
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public sellerListings;
    
    uint256 public nextListingId = 1;
    uint256 public totalListings;
    uint256 public totalTradedVolume;
    uint256 public platformFeePercent = 250; // 2.5% (250 basis points)
    address public feeRecipient;

    // Constants
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant MAX_FEE_PERCENT = 1000; // Maximum 10%

    // Modifiers
    modifier validListing(uint256 listingId) {
        require(listings[listingId].isActive, "Listing not active");
        require(listings[listingId].seller != address(0), "Listing does not exist");
        _;
    }
    
    modifier onlyListingSeller(uint256 listingId) {
        require(listings[listingId].seller == msg.sender, "Not the seller");
        _;
    }

    constructor(address _hydrogenCredit, address _feeRecipient, address initialOwner) Ownable(initialOwner) {
        require(_hydrogenCredit != address(0), "Invalid HydrogenCredit address");
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        
        hydrogenCredit = HydrogenCredit(_hydrogenCredit);
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new listing to sell hydrogen credits
     * @param amount Amount of credits to sell
     * @param pricePerUnit Price per credit unit in wei
     */
    function createListing(uint256 amount, uint256 pricePerUnit) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(amount > 0, "Amount must be greater than zero");
        require(pricePerUnit > 0, "Price must be greater than zero");
        require(hydrogenCredit.balanceOf(msg.sender) >= amount, "Insufficient credit balance");
        
        // Transfer credits to marketplace (escrow)
        require(
            hydrogenCredit.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        uint256 listingId = nextListingId++;
        
        listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            amount: amount,
            pricePerUnit: pricePerUnit,
            createdAt: block.timestamp,
            isActive: true
        });
        
        sellerListings[msg.sender].push(listingId);
        totalListings++;
        
        emit ListingCreated(listingId, msg.sender, amount, pricePerUnit, block.timestamp);
    }

    /**
     * @dev Purchase hydrogen credits from a listing
     * @param listingId ID of the listing to purchase from
     * @param amount Amount of credits to purchase
     */
    function purchaseCredits(uint256 listingId, uint256 amount) 
        external 
        payable 
        validListing(listingId) 
        whenNotPaused 
        nonReentrant 
    {
        Listing storage listing = listings[listingId];
        require(listing.seller != msg.sender, "Cannot buy your own listing");
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= listing.amount, "Not enough credits available");
        
        uint256 totalPrice = amount * listing.pricePerUnit;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Calculate platform fee
        uint256 platformFee = (totalPrice * platformFeePercent) / BASIS_POINTS;
        uint256 sellerAmount = totalPrice - platformFee;
        
        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.isActive = false;
        }
        
        // Transfer credits to buyer
        require(hydrogenCredit.transfer(msg.sender, amount), "Credit transfer failed");
        
        // Transfer payments
        if (platformFee > 0) {
            payable(feeRecipient).transfer(platformFee);
        }
        payable(listing.seller).transfer(sellerAmount);
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        totalTradedVolume += amount;
        
        emit Purchase(
            listingId,
            msg.sender,
            listing.seller,
            amount,
            totalPrice,
            block.timestamp
        );
    }

    /**
     * @dev Cancel a listing and return credits to seller
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) 
        external 
        validListing(listingId) 
        onlyListingSeller(listingId) 
        nonReentrant 
    {
        Listing storage listing = listings[listingId];
        uint256 amount = listing.amount;
        
        listing.isActive = false;
        listing.amount = 0;
        
        // Return credits to seller
        require(hydrogenCredit.transfer(listing.seller, amount), "Credit return failed");
        
        emit ListingCancelled(listingId, msg.sender, block.timestamp);
    }

    /**
     * @dev Update the price of an existing listing
     * @param listingId ID of the listing to update
     * @param newPricePerUnit New price per credit unit
     */
    function updateListingPrice(uint256 listingId, uint256 newPricePerUnit)
        external
        validListing(listingId)
        onlyListingSeller(listingId)
    {
        require(newPricePerUnit > 0, "Price must be greater than zero");
        
        Listing storage listing = listings[listingId];
        uint256 oldPrice = listing.pricePerUnit;
        listing.pricePerUnit = newPricePerUnit;
        
        emit PriceUpdated(listingId, oldPrice, newPricePerUnit, block.timestamp);
    }

    /**
     * @dev Get listing details
     * @param listingId ID of the listing
     * @return Listing struct containing listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get all listing IDs for a seller
     * @param seller Address of the seller
     * @return Array of listing IDs
     */
    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    /**
     * @dev Get active listings in a range
     * @param startId Starting listing ID
     * @param endId Ending listing ID
     * @return activeListings Array of active listings
     */
    function getActiveListings(uint256 startId, uint256 endId) 
        external 
        view 
        returns (Listing[] memory activeListings) 
    {
        require(startId <= endId, "Invalid range");
        require(endId < nextListingId, "End ID too high");
        
        // First pass: count active listings
        uint256 count = 0;
        for (uint256 i = startId; i <= endId; i++) {
            if (listings[i].isActive && listings[i].seller != address(0)) {
                count++;
            }
        }
        
        // Second pass: populate array
        activeListings = new Listing[](count);
        uint256 index = 0;
        for (uint256 i = startId; i <= endId; i++) {
            if (listings[i].isActive && listings[i].seller != address(0)) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        
        return activeListings;
    }

    /**
     * @dev Get marketplace statistics
     * @return totalListingsCreated Total number of listings created
     * @return activeListingsCount Number of currently active listings
     * @return totalVolume Total traded volume
     * @return feePercent Current platform fee percentage
     */
    function getMarketplaceStats() 
        external 
        view 
        returns (
            uint256 totalListingsCreated,
            uint256 activeListingsCount,
            uint256 totalVolume,
            uint256 feePercent
        )
    {
        // Count active listings
        uint256 active = 0;
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].isActive) {
                active++;
            }
        }
        
        return (totalListings, active, totalTradedVolume, platformFeePercent);
    }

    /**
     * @dev Set platform fee percentage (only owner)
     * @param newFeePercent New fee percentage in basis points
     */
    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        platformFeePercent = newFeePercent;
    }

    /**
     * @dev Set fee recipient address (only owner)
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Pause the marketplace (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the marketplace (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw function (only owner, when paused)
     * @param to Address to withdraw to
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address to, uint256 amount) 
        external 
        onlyOwner 
        whenPaused 
    {
        require(to != address(0), "Invalid address");
        require(amount <= hydrogenCredit.balanceOf(address(this)), "Insufficient balance");
        require(hydrogenCredit.transfer(to, amount), "Transfer failed");
    }
}
