import { ethers } from "hardhat";
import { deployedContracts } from "../deployedContracts";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const hub = deployedContracts.hub;
  const CollectPosts = await ethers.getContractFactory("CollectPosts");
  const collectPosts = await CollectPosts.deploy(hub);

  await collectPosts.deployed();

  console.log(`Deployed CollectPosts to ${collectPosts.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
