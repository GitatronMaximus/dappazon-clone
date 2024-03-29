// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const { items } = require("../src/items.json")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  //setup accounts
  const [deployer] = await ethers.getSigners()

  const feeAccount = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
  const feePercent = 3

  //deploy unishop
  const Unishop = await hre.ethers.getContractFactory("Unishop")
  const unishop = await Unishop.deploy(feeAccount, feePercent)
  await unishop.deployed()

  console.log(`Deployed Unishop Contract at: ${unishop.address}\n`)

  //listing items
  for (let i = 0; i < items.length; i++) {
    const feeAmount = ethers.utils.parseEther((items[i].price * 0.03).toString()); // Calculate the 3% fee

    const transaction = await unishop.connect(deployer).list(
      items[i].id,
      items[i].name,
      items[i].category,
      items[i].image,
      ethers.utils.parseEther(items[i].price.toString()),      
      items[i].rating,
      items[i].stock,
      {
        value: feeAmount
      }
    )

    await transaction.wait()

    console.log(`listed item ${items[i].id}: ${items[i].name}`)
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
