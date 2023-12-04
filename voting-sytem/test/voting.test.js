const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Voting Contract", () => {
  let Voting;
  let voting;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async () => {
    Voting = await ethers.getContractFactory("Voting");
    [owner, addr1, addr2] = await ethers.getSigners();

    voting = await Voting.deploy();
    await voting.deployed();
  });

  it("Should initialize with the correct owner", async () => {
    expect(await voting.owner()).to.equal(owner.address);
  });

  it("Should propose a new item", () => {
    voting.connect(owner).proposeItem("Item 1")
    .then(async () => {
      const items = await voting.items(1);
      expect(items.name).to.equal("Item 1");
      expect(items.voteCount).to.equal(0);
    });
  });

  it("Should not allow non-owners to propose items", async () => {
    await expect(voting.connect(addr1).proposeItem("Item 1")).to.be.revertedWith(
      "Only the owner can call this function"
    );
  });

  it("Should vote for a specific item", async () => {
    await voting.connect(owner).proposeItem("Item 1");
    voting.connect(addr1).voteForItem(1)
    .then(async () => {
      const hasVoted = await voting.hasVoted(addr1.address);
      const item = await voting.items(1);

      expect(hasVoted).to.equal(true);
      expect(item.voteCount).to.equal(1)
    });
  });

  it("Should not allow a user to vote more than once", async () => {
    await voting.connect(owner).proposeItem("Item 1");
    await voting.connect(addr1).voteForItem(1);

    await expect(voting.connect(addr1).voteForItem(1)).to.be.revertedWith(
      "You have already voted"
    );
  });

  it("Should get the winner", async () => {
    await voting.connect(owner).proposeItem("Item 1");
    await voting.connect(addr1).voteForItem(1);
    await voting.connect(addr2).voteForItem(1);

    const [winningItemId, winningItemName] = await voting.getWinner();

    expect(winningItemId).to.equal(1);
    expect(winningItemName).to.equal("Item 1");
  });

  it("Should revert when trying to vote for an invalid item ID", async () => {
    await expect(voting.connect(owner).voteForItem(0)).to.be.revertedWith(
      "Invalid item ID"
    );
  });

  it("Should revert when trying to get the winner with no proposed items", async () => {
    await expect(voting.getWinner()).to.be.revertedWith("No items proposed yet");
  });
});


