const { expect } = require("chai");
const { ethers } = require('hardhat');


const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

// Global constants for listing an item
const ID = 3
const NAME = "Shoes"
const CATEGORY = "Clothing"
const IMAGE ="https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
const COST = tokens(1)
const RATING = 4
const STOCK = 5


describe("Unishop", () => {
  let Unishop, deployer, buyer, feeAccount, attacker, unishop, feePercent, user, owner

  beforeEach(async () => {
    //setup accounts
    [deployer, buyer, feeAccount, attacker, user] = await ethers.getSigners()
    accounts = await ethers.getSigners()

    feePercent = 3

    // Deploy contract
    Unishop = await ethers.getContractFactory("Unishop")
    unishop = await Unishop.deploy(feeAccount.address, feePercent)
  })

  describe("Deployment", () => {

    it('Sets the owner', async () => {
      expect(await unishop.owner()).to.equal(deployer.address)
    })
    it('Adds a user', async () => {
      await unishop.connect(deployer).setUser(user.address)
      expect(await unishop.user()).to.equal(user.address)
    })

    it('tracks the fee account', async () => {
      expect(await unishop.feeAccount()).to.equal(feeAccount.address)
    })

    it('tracks the fee percent', async () => {
      expect(await unishop.feePercent()).to.equal(3)
    })
  })

  describe("Listing", async () => {
    let transaction, getBalance

    const ID = 3
    const itemCost = ethers.utils.parseEther("1"); // Item cost of 1 Ether
    const feeAmount = itemCost.mul(3).div(100); // 3% listing fee
    const totalCost = itemCost.add(feeAmount); // Total cost including the listing fee

    const user = 

    beforeEach(async () => {

      transaction = await unishop.connect(deployer).list(
        ID,
        NAME,
        CATEGORY, 
        IMAGE, 
        COST, 
        RATING, 
        STOCK,
        { value: feeAmount }
        )

      await transaction.wait()
    })       

      it('Returns item attributes', async () => {
        const item = await unishop.items(ID)
        expect(item.id).to.equal(ID)
        expect(item.name).to.equal(NAME)
        expect(item.category).to.equal(CATEGORY)
        expect(item.image).to.equal(IMAGE)
        expect(item.cost).to.equal(COST)
        expect(item.rating).to.equal(RATING)
        expect(item.stock).to.equal(STOCK)

      })

      it('Charges fee for listing', async () => {

        // Simulate listing an item
        const listTx = await unishop.connect(user).list(
          ID,
          NAME,
          CATEGORY, 
          IMAGE, 
          COST, 
          RATING, 
          STOCK,
            { value: feeAmount } // User sends item listing fee
        )
        const receipt = await listTx.wait();
        const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

        // Get balance of the user after listing
        const balanceAfter = await user.getBalance();

        // Calculate the actual Ether spent (including gas)
        const actualEtherSpent = balanceBefore.sub(balanceAfter).add(gasUsed);

        // Assert that the actual Ether spent matches the item cost plus the expected listing fee
        expect(actualEtherSpent).to.equal(feeAmount);
      })

      it("Transfers listing fee to fee account", async () => {
        const balanceAfter= await feeAccount.getBalance();
        expect(balanceAfter).to.equal(balanceBefore + feeAmount)
      })

      it("Emits List event", async () => {
        await expect(transaction).to.emit(unishop, "List")
      })
    })
  })

  describe('Failure', async () => {

    it('Rejects invalid user listing', async () => {
      await expect(unishop.connect(attacker).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)).to.be.revertedWith("Unishop: You are not authorized to list on this platform")
    })
  })

  describe("Buying", () => {

    let transaction

    const ID = 3
    const itemCost = ethers.utils.parseEther("1"); // Item cost of 1 Ether
    const feeAmount = itemCost.mul(3).div(100); // 3% listing fee
    //const totalCost = itemCost.add(feeAmount); // Total cost including the listing fee

    beforeEach(async () => {
      //List an item
      transaction = await unishop.connect(deployer, user).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK, { value: feeAmount })
      await transaction.wait()

      //Buy an item
      transaction = await unishop.connect(buyer).buy(ID, { value: COST })
    })

    it("Updates buyer's order count", async () => {
      const result = await unishop.orderCount(buyer.address)
      expect(result).to.equal(1)      
    })

    it("Adds the order", async () => {
      const order = await unishop.orders(buyer.address, 1)

      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })    

    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(unishop.address)
      expect(result).to.equal(COST)
    })

    it("Emits Buy event", () => {
      expect(transaction).to.emit(unishop, "Buy")
    })
  })

  describe("Failure", async () => { 

    let insufficientAmount = ethers.utils.parseEther("1/2");

    it("Rejects insufficient funds", async () => {
      await expect(unishop.connect(buyer).buy(ID, {value: insufficientAmount} )).to.be.revertedWith('Unishop: Insufficient funds for purchase');

    })
  })

  describe("Withdrawing", () => {

    let balanceBefore, feeAmount, user

    describe('Success', () => {

      beforeEach(async () => {

        const feePercent = 3; 
        feeAmount = COST.mul(feePercent).div(100);


        // List an item
        let transaction = await unishop.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK, { value: feeAmount })
        await transaction.wait()

        // Buy an item
        transaction = await unishop.connect(buyer).buy(ID, { value: COST })
        await transaction.wait()

        //Get Deployer balance before
        balanceBefore = await ethers.provider.getBalance(deployer.address)

        // Withdraw
        transaction = await unishop.connect(deployer).withdraw()
        await transaction.wait()
      })

      it("Updates the owner balance", async () => {
        const balanceAfter = await ethers.provider.getBalance(deployer.address)
        expect(balanceAfter).to.be.greaterThan(balanceBefore)
      })

      it("Updates the contract balance", async () => {
        const result = await ethers.provider.getBalance(unishop.address)
        expect(result).to.equal(0)
      })
    })
  
    describe('Failure', () => {

      it('Rejects invalid owner withdrawal', async () => {
        await expect(unishop.connect(attacker).withdraw()).to.be.reverted
      })
    })
  })
