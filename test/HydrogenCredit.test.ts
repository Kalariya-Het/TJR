import { expect } from "chai";
import { ethers } from "hardhat";
import { HydrogenCredit } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("HydrogenCredit", function () {
  let hydrogenCredit: HydrogenCredit;
  let owner: SignerWithAddress;
  let producer: SignerWithAddress;
  let user: SignerWithAddress;
  let otherUser: SignerWithAddress;

  const TOKEN_NAME = "Green Hydrogen Credit";
  const TOKEN_SYMBOL = "GHC";
  const PLANT_ID = "PLANT-001";
  const LOCATION = "Hamburg, Germany";
  const RENEWABLE_SOURCE = "Solar";

  beforeEach(async function () {
    [owner, producer, user, otherUser] = await ethers.getSigners();

    const HydrogenCreditFactory = await ethers.getContractFactory("HydrogenCredit");
    hydrogenCredit = await HydrogenCreditFactory.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      owner.address
    );
    await hydrogenCredit.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct name, symbol, and owner", async function () {
      expect(await hydrogenCredit.name()).to.equal(TOKEN_NAME);
      expect(await hydrogenCredit.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await hydrogenCredit.owner()).to.equal(owner.address);
    });

    it("Should have 18 decimals", async function () {
      expect(await hydrogenCredit.decimals()).to.equal(18);
    });

    it("Should start with zero total supply", async function () {
      expect(await hydrogenCredit.totalSupply()).to.equal(0);
    });
  });

  describe("Producer Registration", function () {
    it("Should allow owner to register a producer", async function () {
      await expect(hydrogenCredit.registerProducer(
        producer.address,
        PLANT_ID,
        LOCATION,
        RENEWABLE_SOURCE
      )).to.emit(hydrogenCredit, "ProducerRegistered");

      const producerInfo = await hydrogenCredit.getProducer(producer.address);
      expect(producerInfo.plantId).to.equal(PLANT_ID);
      expect(producerInfo.location).to.equal(LOCATION);
      expect(producerInfo.renewableSource).to.equal(RENEWABLE_SOURCE);
      expect(producerInfo.isActive).to.be.true;
      expect(producerInfo.totalProduced).to.equal(0);
    });

    it("Should not allow non-owner to register a producer", async function () {
      await expect(hydrogenCredit.connect(user).registerProducer(
        producer.address,
        PLANT_ID,
        LOCATION,
        RENEWABLE_SOURCE
      )).to.be.revertedWithCustomError(hydrogenCredit, "OwnableUnauthorizedAccount");
    });

    it("Should not allow registering the same producer twice", async function () {
      await hydrogenCredit.registerProducer(
        producer.address,
        PLANT_ID,
        LOCATION,
        RENEWABLE_SOURCE
      );

      await expect(hydrogenCredit.registerProducer(
        producer.address,
        "PLANT-002",
        LOCATION,
        RENEWABLE_SOURCE
      )).to.be.revertedWith("Producer already registered");
    });

    it("Should not allow empty plant ID", async function () {
      await expect(hydrogenCredit.registerProducer(
        producer.address,
        "",
        LOCATION,
        RENEWABLE_SOURCE
      )).to.be.revertedWith("Plant ID cannot be empty");
    });

    it("Should track registered producers", async function () {
      await hydrogenCredit.registerProducer(producer.address, PLANT_ID, LOCATION, RENEWABLE_SOURCE);
      await hydrogenCredit.registerProducer(user.address, "PLANT-002", LOCATION, "Wind");

      expect(await hydrogenCredit.getRegisteredProducersCount()).to.equal(2);
      const producers = await hydrogenCredit.getAllProducers();
      expect(producers).to.include(producer.address);
      expect(producers).to.include(user.address);
    });
  });

  describe("Credit Issuance", function () {
    beforeEach(async function () {
      await hydrogenCredit.registerProducer(
        producer.address,
        PLANT_ID,
        LOCATION,
        RENEWABLE_SOURCE
      );
    });

    it("Should allow owner to issue credits to registered producer", async function () {
      const amount = ethers.parseEther("1000");
      const productionTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      await expect(hydrogenCredit.issueCredits(
        producer.address,
        amount,
        productionTime
      )).to.emit(hydrogenCredit, "CreditIssued")
        .withArgs(producer.address, amount, PLANT_ID, productionTime, RENEWABLE_SOURCE);

      expect(await hydrogenCredit.balanceOf(producer.address)).to.equal(amount);
      expect(await hydrogenCredit.totalSupply()).to.equal(amount);

      const producerInfo = await hydrogenCredit.getProducer(producer.address);
      expect(producerInfo.totalProduced).to.equal(amount);

      // Check credit batch
      const batch = await hydrogenCredit.getCreditBatch(1);
      expect(batch.producer).to.equal(producer.address);
      expect(batch.amount).to.equal(amount);
      expect(batch.plantId).to.equal(PLANT_ID);
      expect(batch.renewableSource).to.equal(RENEWABLE_SOURCE);
      expect(batch.isRetired).to.be.false;
    });

    it("Should not allow issuing credits to non-registered producer", async function () {
      const amount = ethers.parseEther("1000");
      const productionTime = Math.floor(Date.now() / 1000);

      await expect(hydrogenCredit.issueCredits(
        user.address,
        amount,
        productionTime
      )).to.be.revertedWith("Producer not registered or inactive");
    });

    it("Should not allow non-owner to issue credits", async function () {
      const amount = ethers.parseEther("1000");
      const productionTime = Math.floor(Date.now() / 1000);

      await expect(hydrogenCredit.connect(user).issueCredits(
        producer.address,
        amount,
        productionTime
      )).to.be.revertedWithCustomError(hydrogenCredit, "OwnableUnauthorizedAccount");
    });

    it("Should not allow future production time", async function () {
      const amount = ethers.parseEther("1000");
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future

      await expect(hydrogenCredit.issueCredits(
        producer.address,
        amount,
        futureTime
      )).to.be.revertedWith("Production time cannot be in the future");
    });

    it("Should track multiple credit batches for producer", async function () {
      const amount1 = ethers.parseEther("500");
      const amount2 = ethers.parseEther("300");
      const productionTime = Math.floor(Date.now() / 1000) - 3600;

      await hydrogenCredit.issueCredits(producer.address, amount1, productionTime);
      await hydrogenCredit.issueCredits(producer.address, amount2, productionTime);

      const batches = await hydrogenCredit.getProducerBatches(producer.address);
      expect(batches.length).to.equal(2);
      expect(batches[0]).to.equal(1);
      expect(batches[1]).to.equal(2);

      const producerInfo = await hydrogenCredit.getProducer(producer.address);
      expect(producerInfo.totalProduced).to.equal(amount1 + amount2);
    });
  });

  describe("Credit Transfers", function () {
    beforeEach(async function () {
      await hydrogenCredit.registerProducer(producer.address, PLANT_ID, LOCATION, RENEWABLE_SOURCE);
      const amount = ethers.parseEther("1000");
      await hydrogenCredit.issueCredits(producer.address, amount, Math.floor(Date.now() / 1000));
    });

    it("Should transfer credits between accounts", async function () {
      const transferAmount = ethers.parseEther("100");

      await expect(hydrogenCredit.connect(producer).transfer(user.address, transferAmount))
        .to.emit(hydrogenCredit, "CreditTransferred");

      expect(await hydrogenCredit.balanceOf(producer.address)).to.equal(ethers.parseEther("900"));
      expect(await hydrogenCredit.balanceOf(user.address)).to.equal(transferAmount);
    });

    it("Should allow transferFrom with proper allowance", async function () {
      const transferAmount = ethers.parseEther("100");

      await hydrogenCredit.connect(producer).approve(user.address, transferAmount);
      
      await expect(hydrogenCredit.connect(user).transferFrom(
        producer.address,
        otherUser.address,
        transferAmount
      )).to.emit(hydrogenCredit, "CreditTransferred");

      expect(await hydrogenCredit.balanceOf(otherUser.address)).to.equal(transferAmount);
    });

    it("Should not allow transfers when paused", async function () {
      await hydrogenCredit.pause();
      const transferAmount = ethers.parseEther("100");

      await expect(hydrogenCredit.connect(producer).transfer(user.address, transferAmount))
        .to.be.revertedWithCustomError(hydrogenCredit, "EnforcedPause");
    });
  });

  describe("Credit Retirement", function () {
    beforeEach(async function () {
      await hydrogenCredit.registerProducer(producer.address, PLANT_ID, LOCATION, RENEWABLE_SOURCE);
      const amount = ethers.parseEther("1000");
      await hydrogenCredit.issueCredits(producer.address, amount, Math.floor(Date.now() / 1000));
    });

    it("Should allow users to retire their credits", async function () {
      const retireAmount = ethers.parseEther("100");
      const reason = "Carbon offset for company operations";

      await expect(hydrogenCredit.connect(producer).retireCredits(retireAmount, reason))
        .to.emit(hydrogenCredit, "CreditRetired");

      expect(await hydrogenCredit.balanceOf(producer.address)).to.equal(ethers.parseEther("900"));
      expect(await hydrogenCredit.totalSupply()).to.equal(ethers.parseEther("900"));
      expect(await hydrogenCredit.retiredCredits(producer.address)).to.equal(retireAmount);
      expect(await hydrogenCredit.totalRetiredCredits()).to.equal(retireAmount);
    });

    it("Should not allow retiring more credits than balance", async function () {
      const retireAmount = ethers.parseEther("2000");
      const reason = "Test retirement";

      await expect(hydrogenCredit.connect(producer).retireCredits(retireAmount, reason))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should not allow retiring credits without reason", async function () {
      const retireAmount = ethers.parseEther("100");

      await expect(hydrogenCredit.connect(producer).retireCredits(retireAmount, ""))
        .to.be.revertedWith("Reason cannot be empty");
    });
  });

  describe("Producer Management", function () {
    beforeEach(async function () {
      await hydrogenCredit.registerProducer(producer.address, PLANT_ID, LOCATION, RENEWABLE_SOURCE);
    });

    it("Should allow owner to deactivate producer", async function () {
      await hydrogenCredit.deactivateProducer(producer.address);
      
      const producerInfo = await hydrogenCredit.getProducer(producer.address);
      expect(producerInfo.isActive).to.be.false;
    });

    it("Should allow owner to reactivate producer", async function () {
      await hydrogenCredit.deactivateProducer(producer.address);
      await hydrogenCredit.reactivateProducer(producer.address);
      
      const producerInfo = await hydrogenCredit.getProducer(producer.address);
      expect(producerInfo.isActive).to.be.true;
    });

    it("Should not allow issuing credits to deactivated producer", async function () {
      await hydrogenCredit.deactivateProducer(producer.address);
      
      const amount = ethers.parseEther("1000");
      const productionTime = Math.floor(Date.now() / 1000);

      await expect(hydrogenCredit.issueCredits(producer.address, amount, productionTime))
        .to.be.revertedWith("Producer not registered or inactive");
    });
  });

  describe("Contract Statistics", function () {
    it("Should return correct contract statistics", async function () {
      // Register producers and issue credits
      await hydrogenCredit.registerProducer(producer.address, PLANT_ID, LOCATION, RENEWABLE_SOURCE);
      await hydrogenCredit.registerProducer(user.address, "PLANT-002", LOCATION, "Wind");
      
      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("500");
      
      await hydrogenCredit.issueCredits(producer.address, amount1, Math.floor(Date.now() / 1000));
      await hydrogenCredit.issueCredits(user.address, amount2, Math.floor(Date.now() / 1000));
      
      // Retire some credits
      const retireAmount = ethers.parseEther("200");
      await hydrogenCredit.connect(producer).retireCredits(retireAmount, "Test retirement");
      
      const stats = await hydrogenCredit.getContractStats();
      expect(stats[0]).to.equal(amount1 + amount2 - retireAmount); // totalSupply
      expect(stats[1]).to.equal(2); // totalBatches
      expect(stats[2]).to.equal(retireAmount); // totalRetired
      expect(stats[3]).to.equal(2); // producerCount
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await hydrogenCredit.pause();
      expect(await hydrogenCredit.paused()).to.be.true;

      await hydrogenCredit.unpause();
      expect(await hydrogenCredit.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(hydrogenCredit.connect(user).pause())
        .to.be.revertedWithCustomError(hydrogenCredit, "OwnableUnauthorizedAccount");
    });

    it("Should prevent credit issuance when paused", async function () {
      await hydrogenCredit.registerProducer(producer.address, PLANT_ID, LOCATION, RENEWABLE_SOURCE);
      await hydrogenCredit.pause();

      const amount = ethers.parseEther("1000");
      await expect(hydrogenCredit.issueCredits(producer.address, amount, Math.floor(Date.now() / 1000)))
        .to.be.revertedWithCustomError(hydrogenCredit, "EnforcedPause");
    });
  });
});
