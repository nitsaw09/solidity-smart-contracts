const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { deployContract } = require('ethereum-waffle');
const EURSTContract = require('../artifacts/contracts/EURST.sol/EURST.json');
const UserRegisty = require('../artifacts/contracts/UserRegistry.sol/UserRegistry.json');
const RegistryAttributes = require('./utils/regitry-attibutes');
const ERC20 = require('../artifacts/contracts/mocks/ERC20Mintable.sol/ERC20Mintable.json');

const Reverter = require('./utils/reverter');

let registry;
let owner;
let minter;
let wiper;
let registryManager;
let other;
let user;
let user2;
let reverter;

const DEFAULT_ADMIN_ROLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
const MINTER_ROLE = ethers.utils.id('MINTER_ROLE');
const WIPER_ROLE = ethers.utils.id('WIPER_ROLE');
const REGISTRY_MANAGER_ROLE = ethers.utils.id('REGISTRY_MANAGER_ROLE');

const userId = '73e5360f-012f-4ac9-8908-770060733ca';

describe('EURST', () => {
  before(async () => {
    reverter = new Reverter();
    await reverter.snapshot();
  });

  describe('#deployment', () => {
    let EURST;
    let EURSTFromOther;
    let testAdmin;

    before(async () => {
      [
        owner,
        other,
        minter,
        wiper,
        registryManager,
        user,
        testAdmin,
      ] = await ethers.getSigners();

      EURST = await deployContract(owner, EURSTContract, [
        `${1e18}`,
        '0x0000000000000000000000000000000000000000',
        minter.address,
        wiper.address,
        registryManager.address,
      ]);

      EURSTFromOther = EURST.connect(other);
    });

    // initial suply

    it('Should mint initialSuply to owner', async () => {
      const ownerBalance = await EURST.balanceOf(owner.address);
      expect(ownerBalance).to.equal(`${1e18}`);
    });

    it('Should not allow to set roles to non DEFAULT_ADMIN_ROLE address', async () => {
      const errorString = `AccessControl: account ${other.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`;
      await expect(
        EURSTFromOther.grantRole(MINTER_ROLE, user.address, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith(errorString);
      await expect(
        EURSTFromOther.grantRole(WIPER_ROLE, user.address, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith(errorString);
      await expect(
        EURSTFromOther.grantRole(REGISTRY_MANAGER_ROLE, user.address, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith(errorString);
    });

    it('Should allow to set roles to DEFAULT_ADMIN_ROLE address', async () => {
      await expect(
        EURST.grantRole(MINTER_ROLE, testAdmin.address, { gasLimit: 5000000 })
      )
        .to.emit(EURST, 'RoleGranted')
        .withArgs(MINTER_ROLE, testAdmin.address, owner.address);

      await expect(
        EURST.grantRole(WIPER_ROLE, testAdmin.address, { gasLimit: 5000000 })
      )
        .to.emit(EURST, 'RoleGranted')
        .withArgs(WIPER_ROLE, testAdmin.address, owner.address);

      await expect(
        EURST.grantRole(REGISTRY_MANAGER_ROLE, testAdmin.address, {
          gasLimit: 5000000,
        })
      )
        .to.emit(EURST, 'RoleGranted')
        .withArgs(REGISTRY_MANAGER_ROLE, testAdmin.address, owner.address);
    });
  });

  // setUserRegistry
  describe('#setUserRegistry', () => {
    let EURST;
    let EURSTFromRegistryManager;

    before(async () => {
      await reverter.revert();

      [
        owner,
        other,
        minter,
        wiper,
        registryManager,
        user,
        user2,
      ] = await ethers.getSigners();

      registry = await deployContract(owner, UserRegisty, [
        `${10e18}`,
        `${15e18}`,
      ]);

      EURST = await deployContract(owner, EURSTContract, [
        `${1e18}`,
        registry.address,
        minter.address,
        wiper.address,
        registryManager.address,
      ]);
    });

    it('Should not allow to set registry to account without registryManager role', async () => {
      EURSTRegistry = EURST.connect(user2);
      await expect(
        EURSTRegistry.setUserRegistry(registry.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('Caller is not a registry manager');
    });

    it('Should allow to set registry to account with registryManager role', async () => {
      EURSTFromRegistryManager = EURST.connect(registryManager);
      await expect(
        EURSTFromRegistryManager.setUserRegistry(registry.address, {
          gasLimit: 5000000,
        })
      )
        .to.emit(EURST, 'SetUserRegistry')
        .withArgs(registry.address);
    });
  });

  // mint
  describe('#mint', () => {
    let EURST;
    let EURSTFromMinter;

    before(async () => {
      await reverter.revert();

      [
        owner,
        other,
        minter,
        wiper,
        registryManager,
        user,
      ] = await ethers.getSigners();

      registry = await deployContract(owner, UserRegisty, [
        `${10e18}`,
        `${15e18}`,
      ]);

      EURST = await deployContract(owner, EURSTContract, [
        `${1e18}`,
        registry.address,
        minter.address,
        wiper.address,
        registryManager.address,
      ]);

      const EURSTFromRegistryManager = EURST.connect(registryManager);
      await EURSTFromRegistryManager.setUserRegistry(registry.address, {
        gasLimit: 5000000,
      });

      EURSTFromMinter = EURST.connect(minter);
    });

    // only minter
    it('Should not allow to mint to address without minter role', async () => {
      await expect(
        EURST.mint(user.address, '1', { gasLimit: 5000000 })
      ).to.be.revertedWith('Caller is not a minter');
    });

    // _requireCanMint
    it('Should not allow to mint when recipient is not KYC verified', async () => {
      await expect(
        EURSTFromMinter.mint(user.address, '1', { gasLimit: 5000000 })
      ).to.be.revertedWith('user has not KYC');
    });

    it('Should not allow to mint when recipient is blocked', async () => {
      await registry.registerNewUser(user.address, userId, {
        gasLimit: 5000000,
      });
      await registry.userKycVerified(user.address, { gasLimit: 5000000 });
      await registry.blockAccount(user.address, { gasLimit: 5000000 });

      await expect(
        EURSTFromMinter.mint(user.address, '1', { gasLimit: 5000000 })
      ).to.be.revertedWith('blocklisted');
    });

    it('Should allow to mint when recipient is KYC verified and non blocked', async () => {
      await registry.unblockAccount(user.address, { gasLimit: 5000000 });
      await EURSTFromMinter.mint(user.address, `${1e18}`, {
        gasLimit: 5000000,
      });

      const userBalance = await EURST.balanceOf(user.address);
      expect(userBalance).to.equal(`${1e18}`);
    });
  });

  // transfer
  describe('#transfer', () => {
    let EURST;
    let EURSTFromUser;
    let EURSTFromMinter;
    let userRedeemAddress;
    before(async () => {
      await reverter.revert();

      [
        owner,
        other,
        minter,
        wiper,
        registryManager,
        user,
        user2,
      ] = await ethers.getSigners();

      registry = await deployContract(owner, UserRegisty, [
        `${10e18}`,
        `${15e18}`,
      ]);
      EURST = await deployContract(owner, EURSTContract, [
        `${1e18}`,
        registry.address,
        minter.address,
        wiper.address,
        registryManager.address,
      ]);
      const EURSTFromRegistryManager = EURST.connect(registryManager);
      await EURSTFromRegistryManager.setUserRegistry(registry.address, {
        gasLimit: 5000000,
      });

      EURSTFromMinter = EURST.connect(minter);
      EURSTFromUser = EURST.connect(user);

      await registry.registerNewUser(user.address, userId, {
        gasLimit: 5000000,
      });
      await registry.userKycVerified(user.address, { gasLimit: 5000000 });
      await EURSTFromMinter.mint(user.address, `${100e18}`, {
        gasLimit: 5000000,
      });

      userRedeemAddress = await registry.getRedeemAddress(user.address);
    });

    it('Should not allow to transfer FROM a blocked account', async () => {
      await registry.blockAccount(user.address, { gasLimit: 5000000 });

      await expect(
        EURSTFromUser.transfer(user2.address, `${10e18}`, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('blocklisted');
    });

    it('Should not allow to transfer TO a blocked account', async () => {
      await registry.unblockAccount(user.address, { gasLimit: 5000000 });
      await registry.blockAccount(user2.address, { gasLimit: 5000000 });

      await expect(
        EURSTFromUser.transfer(user2.address, `${10e18}`, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('blocklisted');
    });

    it('Should performe a regular transfer when recipient is not a redeem address', async () => {
      await registry.unblockAccount(user2.address, { gasLimit: 5000000 });
      expect(await EURST.balanceOf(user2.address)).to.equal(0);

      await EURSTFromUser.transfer(user2.address, `${1e18}`, {
        gasLimit: 5000000,
      });
      expect(await EURST.balanceOf(user2.address)).to.equal(`${1e18}`);
    });

    it('Should not be able to burn when transfering tokens to a redeem address that can not burn', async () => {
      await registry.setAttribute(
        userRedeemAddress,
        RegistryAttributes.CAN_BURN.hex,
        0,
        { gasLimit: 5000000 }
      );
      await expect(
        EURSTFromUser.transfer(userRedeemAddress, `${1e18}`, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('can not burn');
      await registry.setAttribute(
        userRedeemAddress,
        RegistryAttributes.CAN_BURN.hex,
        1,
        { gasLimit: 5000000 }
      );
    });

    it('Should not be able to burn when transferingF tokens to a redeem address that can burn but amount lower than min bound', async () => {
      await registry.setAttribute(
        userRedeemAddress,
        RegistryAttributes.CAN_BURN.hex,
        1,
        { gasLimit: 5000000 }
      );
      await expect(
        EURSTFromUser.transfer(userRedeemAddress, `${9e18}`, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('below min bound');
    });

    it('Should not be able to burn when transfering tokens to a redeem address that can burn but amount greater than min bound', async () => {
      await registry.setAttribute(
        userRedeemAddress,
        RegistryAttributes.CAN_BURN.hex,
        1,
        { gasLimit: 5000000 }
      );
      await expect(
        EURSTFromUser.transfer(userRedeemAddress, `${16e18}`, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('above max bound');
    });

    it('Should be able to burn when transfering tokens to a redeem address that can burn', async () => {
      const totalSupplyBefore = await EURSTFromUser.totalSupply();
      const trasferTx = EURSTFromUser.transfer(userRedeemAddress, `${10e18}`, {
        gasLimit: 5000000,
      });

      await expect(trasferTx)
        .to.emit(EURSTFromUser, 'Transfer')
        .withArgs(
          user.address,
          '0x0000000000000000000000000000000000000000',
          BigNumber.from(`${10e18}`).toString()
        );

      await expect(trasferTx)
        .to.emit(EURSTFromUser, 'Burn')
        .withArgs(user.address, BigNumber.from(`${10e18}`).toString());

      expect(await EURSTFromUser.totalSupply()).to.equal(
        totalSupplyBefore.sub(`${10e18}`)
      );
    });
  });

  // transferFrom
  describe('#transferFrom', () => {
    let EURST;
    let EURSTFromUser;
    let EURSTFromApprovedUser;
    let EURSTFromMinter;
    let userRedeemAddress;
    let approvedUser;

    before(async () => {
      await reverter.revert();

      [
        owner,
        other,
        minter,
        wiper,
        registryManager,
        user,
        user2,
        approvedUser,
      ] = await ethers.getSigners();

      registry = await deployContract(owner, UserRegisty, [
        `${10e18}`,
        `${15e18}`,
      ]);
      EURST = await deployContract(owner, EURSTContract, [
        `${1e18}`,
        registry.address,
        minter.address,
        wiper.address,
        registryManager.address,
      ]);
      const EURSTFromRegistryManager = EURST.connect(registryManager);
      await EURSTFromRegistryManager.setUserRegistry(registry.address, {
        gasLimit: 5000000,
      });

      EURSTFromUser = EURST.connect(user);
      EURSTFromMinter = EURST.connect(minter);

      userRedeemAddress = await registry.getRedeemAddress(user.address);
      await registry.registerNewUser(userRedeemAddress, `redeem-${userId}`, {
        gasLimit: 5000000,
      });
      await registry.userKycVerified(userRedeemAddress, { gasLimit: 5000000 });
      await registry.enableRedeemAddress(userRedeemAddress, {
        gasLimit: 5000000,
      });

      await registry.registerNewUser(user.address, userId, {
        gasLimit: 5000000,
      });
      await registry.userKycVerified(user.address, { gasLimit: 5000000 });
      await registry.enableRedeemAddress(user.address, { gasLimit: 5000000 });
      await EURSTFromMinter.mint(user.address, `${100e18}`, {
        gasLimit: 5000000,
      });
      
      await EURSTFromUser.approve(approvedUser.address, `${100e18}`, {
        gasLimit: 5000000,
      });
      EURSTFromApprovedUser = EURST.connect(approvedUser);
    });

    it('Should not allow to transferFrom when SPENDER is a blocked account', async () => {
      await registry.blockAccount(approvedUser.address, { gasLimit: 5000000 });
      await expect(
        EURSTFromApprovedUser.transferFrom(
          user.address,
          user2.address,
          `${1e18}`
        )
      ).to.be.revertedWith('blocklisted');
    });

    it('Should not allow to transferFrom FROM a blocked account', async () => {
      await registry.unblockAccount(approvedUser.address, {
        gasLimit: 5000000,
      });
      await registry.blockAccount(user.address, { gasLimit: 5000000 });

      await expect(
        EURSTFromApprovedUser.transferFrom(
          user.address,
          user2.address,
          `${1e18}`,
          { gasLimit: 5000000 }
        )
      ).to.be.revertedWith('blocklisted');
    });

    it('Should not allow to transferFrom TO a blocked account', async () => {
      await registry.unblockAccount(user.address, { gasLimit: 5000000 });
      await registry.blockAccount(user2.address, { gasLimit: 5000000 });

      await expect(
        EURSTFromApprovedUser.transferFrom(
          user.address,
          user2.address,
          `${1e18}`,
          { gasLimit: 5000000 }
        )
      ).to.be.revertedWith('blocklisted');
    });

    it('Should performe a regular transferFrom when recipient is not a redeem address', async () => {
      await registry.unblockAccount(user2.address, { gasLimit: 5000000 });
      expect(await EURST.balanceOf(user2.address)).to.equal(0);

      const initialUserBalance = await EURST.balanceOf(user.address);

      await EURSTFromApprovedUser.transferFrom(
        user.address,
        user2.address,
        `${1e18}`,
        { gasLimit: 5000000 }
      );
      expect(await EURST.balanceOf(user2.address)).to.equal(`${1e18}`);
      expect(await EURST.balanceOf(user.address)).to.equal(
        initialUserBalance.sub(`${1e18}`)
      );
    });

    it('Should not be able to burn when transferingFrom tokens to a redeem address that can not burn', async () => {
      await registry.setAttribute(
        userRedeemAddress,
        RegistryAttributes.CAN_BURN.hex,
        0,
        { gasLimit: 5000000 }
      );
      await expect(
        EURSTFromApprovedUser.transferFrom(
          user.address,
          userRedeemAddress,
          `${1e18}`,
          { gasLimit: 5000000 }
        )
      ).to.be.revertedWith('can not burn');
    });

    it('Should not be able to burn when transferingFrom tokens to a redeem address that can burn but amount lower than min bound', async () => {
      await registry.setAttribute(
        userRedeemAddress,
        RegistryAttributes.CAN_BURN.hex,
        1,
        { gasLimit: 5000000 }
      );
      await expect(
        EURSTFromApprovedUser.transferFrom(
          user.address,
          userRedeemAddress,
          `${9e18}`,
          { gasLimit: 5000000 }
        )
      ).to.be.revertedWith('below min bound');
    });

    it('Should not be able to burn when transferingFrom tokens to a redeem address that can burn but amount greater than min bound', async () => {
      await registry.setAttribute(
        userRedeemAddress,
        RegistryAttributes.CAN_BURN.hex,
        1,
        { gasLimit: 5000000 }
      );
      await expect(
        EURSTFromApprovedUser.transferFrom(
          user.address,
          userRedeemAddress,
          `${16e18}`,
          { gasLimit: 5000000 }
        )
      ).to.be.revertedWith('above max bound');
    });
  });

  // wipeBlocklistedAccount
  describe('#wipeBlocklistedAccount', () => {
    let EURST;
    let EURSTFromMinter;
    let EURSTFromWiper;

    before(async () => {
      await reverter.revert();

      [
        owner,
        other,
        minter,
        wiper,
        registryManager,
        user,
        user2,
      ] = await ethers.getSigners();

      EURST = await deployContract(owner, EURSTContract, [
        `${1e18}`,
        '0x0000000000000000000000000000000000000000',
        minter.address,
        wiper.address,
        registryManager.address,
      ]);

      registry = await deployContract(owner, UserRegisty, [
        `${10e18}`,
        `${15e18}`,
      ]);
      const EURSTFromRegistryManager = EURST.connect(registryManager);
      await EURSTFromRegistryManager.setUserRegistry(registry.address, {
        gasLimit: 5000000,
      });

      EURSTFromMinter = EURST.connect(minter);
      EURSTFromWiper = EURST.connect(wiper);

      await registry.registerNewUser(user.address, userId, {
        gasLimit: 5000000,
      });
      await registry.userKycVerified(user.address, { gasLimit: 5000000 });
      await EURSTFromMinter.mint(user.address, `${10e18}`, {
        gasLimit: 5000000,
      });

      await registry.blockAccount(user.address, { gasLimit: 5000000 });
    });

    it('Should not allow to wipe blocklisted account without minter role', async () => {
      await expect(
        EURST.wipeBlocklistedAccount(user.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('Caller is not a wiper');
    });

    it('Should not allow to wipe non blocklisted account', async () => {
      await expect(
        EURSTFromWiper.wipeBlocklistedAccount(user2.address, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('can not wipe');
    });

    it('Should allow to wipe blocklisted account', async () => {
      const wipeTx = EURSTFromWiper.wipeBlocklistedAccount(user.address, {
        gasLimit: 5000000,
      });

      await expect(wipeTx)
        .to.emit(EURST, 'Transfer')
        .withArgs(
          user.address,
          '0x0000000000000000000000000000000000000000',
          BigNumber.from(`${10e18}`).toString()
        );

      await expect(wipeTx)
        .to.emit(EURST, 'WipeBlocklistedAccount')
        .withArgs(user.address, BigNumber.from(`${10e18}`).toString());

      expect(await EURST.balanceOf(user.address)).to.equal(0);
    });
  });

  describe('Claimer', () => {
    let kakaroto;
    let karpincho;
    let someToken;
    let EURST;

    before(async () => {
      await reverter.revert();

      [owner, kakaroto, karpincho] = await ethers.getSigners();

      [
        owner,
        other,
        minter,
        wiper,
        registryManager,
        kakaroto,
        karpincho,
      ] = await ethers.getSigners();

      registry = await deployContract(owner, UserRegisty, [
        `${10e18}`,
        `${15e18}`,
      ]);
      EURST = await deployContract(owner, EURSTContract, [
        `${1e18}`,
        registry.address,
        minter.address,
        wiper.address,
        registryManager.address,
      ]);
      const EURSTFromRegistryManager = EURST.connect(registryManager);
      await EURSTFromRegistryManager.setUserRegistry(registry.address, {
        gasLimit: 5000000,
      });

      someToken = await deployContract(kakaroto, ERC20, ['A Token', 'ATOKEN']);

      await someToken.mint(`${10e18}`, { gasLimit: 5000000 });
    });

    it('Should allow to claim ERC20 by the owner', async () => {
      await someToken.transfer(EURST.address, `${1e18}`, { gasLimit: 5000000 });
      const claimerBalanceBefore = await someToken.balanceOf(EURST.address);
      const ownerBalanceBefore = await someToken.balanceOf(owner.address);

      expect(claimerBalanceBefore).to.equal(`${1e18}`);
      expect(ownerBalanceBefore).to.equal(0);
      
      const EURSTFromOwner = EURST.connect(owner);
      await EURSTFromOwner.claimToken(someToken.address, owner.address, {
        gasLimit: 5000000,
      });

      const claimerBalanceAfter = await someToken.balanceOf(EURST.address);
      const ownerBalanceAfter = await someToken.balanceOf(owner.address);

      expect(claimerBalanceAfter).to.equal(0);
      expect(ownerBalanceAfter).to.equal(claimerBalanceBefore);
    });

    it('Should not allow to receive ETH', async () => {
      await expect(
        kakaroto.sendTransaction({
          to: EURST.address,
          value: ethers.utils.parseEther('1.0'),
        })
      ).to.be.reverted;
    });

    it('Should not allow to claim ERC20 by the non owner', async () => {
      await someToken.transfer(EURST.address, `${1e18}`, { gasLimit: 5000000 });
      const claimerBalanceBefore = await someToken.balanceOf(EURST.address);

      expect(claimerBalanceBefore).to.equal(`${1e18}`);

      const EURSTFromKarpincho = EURST.connect(karpincho);

      await expect(
        EURSTFromKarpincho.claimToken(someToken.address, karpincho.address, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('Ownable: caller is not the owner');

      const claimerBalanceAfter = await someToken.balanceOf(EURST.address);
      expect(claimerBalanceAfter).to.equal(`${1e18}`);
    });
  });
});
