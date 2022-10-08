import { ethers } from "hardhat";
import { deployedContracts } from "../deployedContracts";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const hub = deployedContracts.hub;
  const ReferenceMod = await ethers.getContractFactory("ReferenceMod");
  const referenceMod = await ReferenceMod.deploy(hub);

  await referenceMod.deployed();

  console.log(`Deployed ReferenceMod to ${referenceMod.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
