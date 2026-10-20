const fs = require("fs");
const path = require("path");
const { ethers, artifacts } = require("hardhat");

async function main() {
  const [admin] = await ethers.getSigners();
  const VoteChain = await ethers.getContractFactory("VoteChain");
  const contract = await VoteChain.deploy("Computer Engineering Class Election");
  await contract.waitForDeployment();

  await (await contract.addCandidate("Aarav Mehta", "Focused on better lab coordination")).wait();
  await (await contract.addCandidate("Diya Shah", "More peer learning and study groups")).wait();
  await (await contract.addCandidate("Kabir Patel", "Clearer communication and class updates")).wait();

  const signers = await ethers.getSigners();
  for (const signer of signers.slice(1, 7)) {
    await (await contract.setVoterEligibility(await signer.getAddress(), true)).wait();
  }

  const artifact = await artifacts.readArtifact("VoteChain");
  const output = {
    address: await contract.getAddress(),
    abi: artifact.abi,
    chainId: 31337,
    admin: await admin.getAddress(),
    voters: await Promise.all(signers.slice(1, 7).map(s => s.getAddress())),
    deployedAt: new Date().toISOString()
  };
  fs.mkdirSync(path.join(__dirname, "..", "build"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "..", "build", "contracts.json"), JSON.stringify(output, null, 2));
  console.log(`VoteChain deployed to ${output.address}`);
  console.log(`Contract configuration written to build/contracts.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
