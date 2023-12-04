const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployContract } = require('ethereum-waffle');
const { provider } = ethers;
const Claimer = require('../artifacts/contracts/mocks/ClaimerMock.sol/ClaimerMock.json');
const ERC20 = require('../artifacts/contracts/mocks/ERC20Mintable.sol/ERC20Mintable.json');

let owner;
let kakaroto;
let karpincho;
let claimerContract;
let someToken;

describe('Claimer', () => {
  before(async () => {
    [owner, kakaroto, karpincho] = await ethers.getSigners();
    claimerContract = await deployContract(owner, Claimer, []);
    someToken = await deployContract(kakaroto, ERC20, ['A Token', 'ATOKEN']);

    await someToken.mint(`${10e18}`);
  });

  it('Should allow to claim ERC20 by the owner', async () => {
    await someToken.transfer(claimerContract.address, `${1e18}`);
    const claimerBalanceBefore = await someToken.balanceOf(
      claimerContract.address
    );
    const ownerBalanceBefore = await someToken.balanceOf(owner.address);

    expect(claimerBalanceBefore).to.equal(`${1e18}`);
    expect(ownerBalanceBefore).to.equal(0);

    await claimerContract.claimToken(someToken.address, owner.address, {
      gasLimit: 5000000,
    });

    const claimerBalanceAfter = await someToken.balanceOf(
      claimerContract.address
    );
    const ownerBalanceAfter = await someToken.balanceOf(owner.address);

    expect(claimerBalanceAfter).to.equal(0);
    expect(ownerBalanceAfter).to.equal(claimerBalanceBefore);
  });

  it('Should allow to claim ETH by the owner', async () => {
    await kakaroto.sendTransaction({
      to: claimerContract.address,
      value: ethers.utils.parseEther('1.0'),
    });
    const claimerBalanceBefore = await provider.getBalance(
      claimerContract.address
    );
    const karpinchoBalanceBefore = await karpincho.getBalance();

    expect(claimerBalanceBefore).to.equal(`${1e18}`);

    await claimerContract.claimEther(karpincho.address);

    const claimerBalanceAfter = await provider.getBalance(
      claimerContract.address
    );
    const karpinchoBalanceAfter = await karpincho.getBalance();

    expect(claimerBalanceAfter).to.equal(0);
    expect(karpinchoBalanceAfter).to.equal(
      claimerBalanceBefore.add(karpinchoBalanceBefore)
    );
  });

  it('Should not allow to claim ERC20 by the non owner', async () => {
    await someToken.transfer(claimerContract.address, `${1e18}`);
    const claimerBalanceBefore = await someToken.balanceOf(
      claimerContract.address
    );

    expect(claimerBalanceBefore).to.equal(`${1e18}`);

    const claimerContractFromKarpincho = claimerContract.connect(karpincho);

    await expect(
      claimerContractFromKarpincho.claimToken(
        someToken.address,
        karpincho.address,
        { gasLimit: 5000000 }
      )
    ).to.be.revertedWith('Ownable: caller is not the owner');

    const claimerBalanceAfter = await someToken.balanceOf(
      claimerContract.address
    );

    expect(claimerBalanceAfter).to.equal(`${1e18}`);
  });

  it('Should not allow to claim ETH by the non owner', async () => {
    await kakaroto.sendTransaction({
      to: claimerContract.address,
      value: ethers.utils.parseEther('1.0'),
    });
    const claimerBalanceBefore = await provider.getBalance(
      claimerContract.address
    );

    expect(claimerBalanceBefore).to.equal(`${1e18}`);

    const claimerContractFromKarpincho = claimerContract.connect(karpincho);
    await expect(
      claimerContractFromKarpincho.claimEther(karpincho.address, { gasLimit: 5000000 })
    ).to.be.revertedWith('Ownable: caller is not the owner');

    const claimerBalanceAfter = await provider.getBalance(
      claimerContract.address
    );

    expect(claimerBalanceAfter).to.equal(`${1e18}`);
  });
});
