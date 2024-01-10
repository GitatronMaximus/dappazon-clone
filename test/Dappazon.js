const { expect } = require("chai")

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
  let Unishop, deployer, buyer, feeAccount, attacker, unishop, feePercent

  beforeEach(async () => {
    //setup accounts
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    feeAccount = accounts[1]
    attacker = accounts[2]
    buyer = accounts[3]
    [deployer, buyer, feeAccount, attacker] = await ethers.getSigners()

    const feePercent = 3

    // Deploy contract
    Unishop = await ethers.getContractFactory("Unishop")
    unishop = await Unishop.deploy(feeAccount.address, feePercent)
  })

describe("Deployment", () => {

  it('Sets the owner', async () => {
    expect(await unishop.owner()).to.equal(deployer.address)
  })

  it('tracks the fee account', async () => {
    expect(await unishop.feeAccount()).to.equal(feeAccount.address)
  })

  it('tracks the fee percent', async () => {
    expect(await unishop.feePercent()).to.equal(feePercent)
  })
})

describe("Listing", () => {
  let transaction

  const ID = 3


  beforeEach(async () => {
    transaction = await unishop.connect(deployer).list(
      ID,
      NAME,
      CATEGORY, 
      IMAGE, 
      COST, 
      RATING, 
      STOCK
      )

    await transaction.wait()       

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

    it("Emits List event", async () => {
      await expect(transaction).to.emit(unishop, "List")
    })
  })
})

describe('Failure', async () => {

  it('Rejects invalid user listing', async () => {
    await expect(unishop.connect(attacker).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)).to.be.reverted
  })
})

//describe("Buying", () => {
  let transaction

  const ID = 3


  beforeEach(async () => {
    //List an item
    transaction = await unishop.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
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

describe("Withdrawing", () => {

  let balanceBefore

  describe('Success', () => {

    beforeEach(async () => {

    // List an item
      let transaction = await unishop.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
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
})
  describe('Failure', () => {

    it('Rejects invalid owner withdrawal', async () => {
      await expect(unishop.connect(attacker).withdraw()).to.be.reverted

    })
  })
//})
