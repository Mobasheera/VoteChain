const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VoteChain", function () {
  async function setup() {
    const [owner, voter1, voter2, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("VoteChain");
    const contract = await Factory.deploy("Test Election");
    await contract.waitForDeployment();
    await contract.addCandidate("Alice", "Candidate one");
    await contract.addCandidate("Bob", "Candidate two");
    await contract.setVoterEligibility(voter1.address, true);
    await contract.setVoterEligibility(voter2.address, true);
    return { contract, owner, voter1, voter2, outsider };
  }

  it("allows the admin to add candidates before voting", async function () {
    const { contract } = await setup();
    expect(await contract.getCandidateCount()).to.equal(2n);
  });

  it("requires at least two candidates before starting", async function () {
    const [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("VoteChain");
    const contract = await Factory.deploy("Small Election");
    await contract.waitForDeployment();
    await expect(contract.startVoting()).to.be.revertedWith("Add at least two candidates");
  });

  it("records a vote from an eligible account", async function () {
    const { contract, voter1 } = await setup();
    await contract.startVoting();
    await contract.connect(voter1).castVote(0);
    const candidate = await contract.getCandidate(0);
    expect(candidate.voteCount).to.equal(1n);
    expect(await contract.hasVoted(voter1.address)).to.equal(true);
  });

  it("prevents an account from voting twice", async function () {
    const { contract, voter1 } = await setup();
    await contract.startVoting();
    await contract.connect(voter1).castVote(0);
    await expect(contract.connect(voter1).castVote(1)).to.be.revertedWith("This account has already voted");
  });

  it("rejects accounts that are not eligible", async function () {
    const { contract, outsider } = await setup();
    await contract.startVoting();
    await expect(contract.connect(outsider).castVote(0)).to.be.revertedWith("This account is not an eligible voter");
  });

  it("does not allow voting after the election is finalized", async function () {
    const { contract, owner, voter1 } = await setup();
    await contract.startVoting();
    await contract.endVoting();
    await expect(contract.connect(voter1).castVote(0)).to.be.revertedWith("Voting is not open");
  });
});
