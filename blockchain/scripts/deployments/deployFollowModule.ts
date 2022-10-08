import { ethers } from "hardhat";
import { deployedContracts } from "../deployedContracts";

async function main() {
  const hub = deployedContracts.hub;

  const FollowModule = await ethers.getContractFactory("FollowCreator");
  const followModule = await FollowModule.deploy(hub);

  await followModule.deployed();

  console.log(`Deployed Follow Module to ${followModule.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
