const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployContract } = require('ethereum-waffle');
const { BigNumber } = ethers;
const Registy = require('../artifacts/contracts/UserRegistry.sol/UserRegistry.json');
const RegistryUser = require('../artifacts/contracts/mocks/RegistryUserMock.sol/RegistryUserMock.json');
const RegistryAttributes = require('./utils/regitry-attibutes');

const Reverter = require('./utils/reverter');

let registry;
let registryFromOther;
let registryUser;
let owner;
let other;
let user;
let user2;
let blockedCaller;
let blockedReceptor;
let blockedSender;
let reverter;

const AN_ATTRIBUTE = ethers.utils.formatBytes32String('AN_ATTRIBUTE');
const userId = '73e5360f-012f-4ac9-8908-770060733ca';
const userId2 = '88f7ea61-2b37-49a8-9d2a-4002a3da2394';

describe('Registry', () => {
  before(async () => {
    [
      owner,
      other,
      user,
      user2,
      blockedCaller,
      blockedReceptor,
      blockedSender,
    ] = await ethers.getSigners();

    registryUser = await deployContract(owner, RegistryUser);
    registry = await deployContract(owner, Registy, [
      `${10e18}`,
      `${15e18}`,
    ]);
    await registryUser.setUserRegistry(registry.address, { gasLimit: 5000000 });

    registryFromOther = registry.connect(other);
    reverter = new Reverter();
    await reverter.snapshot();
  });

  // setAttribute
  describe('#setAttribute - #hasAttribute - #getAttribute - #getAttributeValue', () => {
    it('Should not allow to set an attribute to non owner account', async () => {
      await expect(
        registryFromOther.setAttribute(user.address, AN_ATTRIBUTE, 1, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should allow to set an attribute to owner account', async () => {
      await registry.setAttribute(user.address, AN_ATTRIBUTE, 1, {
        gasLimit: 5000000,
      });

      expect(
        (await registry.attributes(user.address, AN_ATTRIBUTE)).value
      ).to.equal(1);
    });

    it('#hasAttribute should return the right value', async () => {
      expect(await registry.hasAttribute(user.address, AN_ATTRIBUTE)).to.equal(
        true
      );
    });

    it('#getAttributeValue should return the right value', async () => {
      expect(
        await registry.getAttributeValue(user.address, AN_ATTRIBUTE)
      ).to.equal(1);
    });

    it('#getAttribute should return the right value', async () => {
      const attribute = await registry.getAttribute(
        user.address,
        AN_ATTRIBUTE
      );
      expect(attribute.value).to.equal(1);
      expect(attribute.updatedBy).to.equal(owner.address);
    });
  });

  describe('#registerNewUser', () => {
    before(async () => {
      await reverter.revert();
    });

    it('Should not allow to register a new user to non owner account', async () => {
      await expect(
        registryFromOther.registerNewUser(user.address, userId, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should register a new user by the owner', async () => {
      await expect(
        registry.registerNewUser(user.address, userId, { gasLimit: 5000000 })
      )
        .to.emit(registry, 'RegisterNewUser')
        .withArgs(user.address, '0x0000000000000000000000000000000000000001');

      expect(
        await registry.getAttributeValue(
          user.address,
          RegistryAttributes.KYC_AML_VERIFIED.hex
        )
      ).to.equal(0);

      expect(
        await registry.getAttributeValue(
          user.address,
          RegistryAttributes.CAN_BURN.hex
        )
      ).to.equal(0);

      expect(
        await registry.getAttributeValue(
          '0x0000000000000000000000000000000000000001',
          RegistryAttributes.REDEEM_ADDRESS_USER.hex
        )
      ).to.equal(BigNumber.from(user.address).toString());

      expect(
        await registry.getAttributeValue(
          user.address,
          RegistryAttributes.USER_REDEEM_ADDRESS.hex
        )
      ).to.equal('0x0000000000000000000000000000000000000001');
    });

    it('Should not allow to register same accont twice', async () => {
      await expect(
        registry.registerNewUser(user.address, userId2, { gasLimit: 5000000 })
      ).to.be.revertedWith('user exist');
    });

    it('Should not allow to register same id twice', async () => {
      await expect(
        registry.registerNewUser(user2.address, userId, { gasLimit: 5000000 })
      ).to.be.revertedWith('id already taken');
    });
  });

  describe('#getUser - #getUserById - #setUserId', () => {
    before(async () => {
      await reverter.revert();

      await registry.registerNewUser(user.address, userId);
    });

    it('Should not allow to get user id to non owner account', async () => {
      try {
        await registryFromOther.getUser(user.address);
      } catch(err) {
        expect(err.message.includes('Ownable: caller is not the owner')).to.equal(true);
      }
    });

    it('Should allow to get user id to owner account', async () => {
      const userData = await registry.getUser(user.address);
      expect(userData.account).to.equal(user.address);
      expect(userData.id).to.equal(userId);
      expect(userData.redeemAddress).to.equal(
        '0x0000000000000000000000000000000000000001'
      );
      expect(userData.blocked).to.equal(false);
      expect(userData.KYC).to.equal(false);
      expect(userData.canBurn).to.equal(false);
    });

    it('Should not allow to get user by id to non owner account', async () => {
      try {
        await registryFromOther.getUserById(userId);
      } catch(err) {
        expect(err.message.includes('Ownable: caller is not the owner')).to.equal(true);
      }
    });

    it('Should allow to get user by id to owner account', async () => {
      const userData = await registry.getUserById(userId);
      expect(userData.account).to.equal(user.address);
      expect(userData.id).to.equal(userId);
      expect(userData.redeemAddress).to.equal(
        '0x0000000000000000000000000000000000000001'
      );
      expect(userData.blocked).to.equal(false);
      expect(userData.KYC).to.equal(false);
      expect(userData.canBurn).to.equal(false);
    });

    it('Should not allow to set user id to non owner account', async () => {
      await expect(
        registryFromOther.setUserId(user.address, 'other-id')
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should not allow to set user id for non user to owner account', async () => {
      await expect(
        registry.setUserId(user2.address, 'other-id')
      ).to.be.revertedWith('not a user');
    });

    it('Should not allow to set user id which is already in use', async () => {
      await registry.registerNewUser(user2.address, userId2);

      await expect(
        registry.setUserId(user2.address, userId)
      ).to.be.revertedWith('id already taken');
    });

    it('Should allow to set user id to owner account', async () => {
      const newId = 'other-id';
      const oldId = userId;
      await registry.setUserId(user.address, newId, { gasLimit: 5000000 });
      const userData = await registry.getUser(user.address);
      expect(userData.id).to.equal(newId);

      const userDataNew = await registry.getUserById(newId);
      expect(userDataNew.account).to.equal(user.address);

      const userDataOld = await registry.getUserById(oldId);
      expect(userDataOld.account).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
    });
  });

  describe('#userKycVerified - #userKycUnverified - #enableRedeemAddress - #disableRedeemAddress - #verifyKycEnableRedeem - #unverifyKycDisableRedeem', () => {
    before(async () => {
      await reverter.revert();

      await registry.registerNewUser(user.address, userId, {
        gasLimit: 5000000,
      });
    });

    it('Should not allow to set user as KYC verified to non owner account', async () => {
      await expect(
        registryFromOther.userKycVerified(user.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should not allow to set a non user as KYC verified', async () => {
      await expect(
        registry.userKycVerified(user2.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('not a user');
    });

    it('Should set user as KYC verified', async () => {
      const userRedeemAddress = await registry.getRedeemAddress(user.address);

      await expect(
        registry.userKycVerified(user.address, { gasLimit: 5000000 })
      )
        .to.emit(registry, 'UserKycVerified')
        .withArgs(user.address);

      expect(
        await registry.getAttributeValue(
          user.address,
          RegistryAttributes.KYC_AML_VERIFIED.hex
        )
      ).to.equal(1);

      expect(
        await registry.getAttributeValue(
          userRedeemAddress,
          RegistryAttributes.CAN_BURN.hex
        )
      ).to.equal(0);
    });

    it('Should not allow to enable redeem address to non owner account', async () => {
      await expect(
        registryFromOther.enableRedeemAddress(user.address, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should not allow to enable redeem address for a non user', async () => {
      await expect(
        registry.enableRedeemAddress(user2.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('not a user');
    });

    it('Should not allow to enable redeem address for a non KYC un-verified user', async () => {
      await registry.userKycUnverified(user.address, { gasLimit: 5000000 });

      await expect(
        registry.enableRedeemAddress(user.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('user has not KYC');
    });

    it('Should enable redeem address', async () => {
      const userRedeemAddress = await registry.getRedeemAddress(user.address);
      await registry.userKycVerified(user.address, { gasLimit: 5000000 });

      await expect(
        registry.enableRedeemAddress(user.address, { gasLimit: 5000000 })
      )
        .to.emit(registry, 'EnableRedeemAddress')
        .withArgs(user.address);

      expect(
        await registry.getAttributeValue(
          userRedeemAddress,
          RegistryAttributes.CAN_BURN.hex
        )
      ).to.equal(1);
    });

    it('Should not allow to set user as KYC un-verified to non owner account', async () => {
      await expect(
        registryFromOther.userKycUnverified(user.address, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should not allow to set a non user as KYC un-verified', async () => {
      await expect(
        registry.userKycUnverified(user2.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('not a user');
    });

    it('Should set user as KYC un-verified', async () => {
      await expect(
        registry.userKycUnverified(user.address, { gasLimit: 5000000 })
      )
        .to.emit(registry, 'UserKycUnverified')
        .withArgs(user.address);
      expect(
        await registry.getAttributeValue(
          user.address,
          RegistryAttributes.KYC_AML_VERIFIED.hex
        )
      ).to.equal(0);
    });

    ///
    it('Should not allow to call verifyKycEnableRedeem to non owner account', async () => {
      await expect(
        registryFromOther.verifyKycEnableRedeem(user.address, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should not allow to call verifyKycEnableRedeem with a non user as KYC un-verified', async () => {
      await expect(
        registry.verifyKycEnableRedeem(user2.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('not a user');
    });

    it('Should be able to call verifyKycEnableRedeem', async () => {
      const userRedeemAddress = await registry.getRedeemAddress(user.address);
      await registry.setAttribute(
        user.address,
        RegistryAttributes.KYC_AML_VERIFIED.hex,
        0
      );
      await registry.setAttribute(
        userRedeemAddress,
        RegistryAttributes.CAN_BURN.hex,
        0
      );

      expect(
        await registry.getAttributeValue(
          user.address,
          RegistryAttributes.KYC_AML_VERIFIED.hex
        )
      ).to.equal(0);
      expect(
        await registry.getAttributeValue(
          userRedeemAddress,
          RegistryAttributes.CAN_BURN.hex
        )
      ).to.equal(0);

      const tx = registry.verifyKycEnableRedeem(user.address, {
        gasLimit: 5000000,
      });
      await expect(tx)
        .to.emit(registry, 'UserKycVerified')
        .withArgs(user.address);

      await expect(tx)
        .to.emit(registry, 'EnableRedeemAddress')
        .withArgs(userRedeemAddress);

      const userData = await registry.getUser(user.address);

      expect(userData.KYC).to.equal(true);
      expect(userData.canBurn).to.equal(true);
    });

    ///
    it('Should not allow to call unverifyKycDisableRedeem to non owner account', async () => {
      await expect(
        registryFromOther.verifyKycEnableRedeem(user.address, {
          gasLimit: 5000000,
        })
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should not allow to call unverifyKycDisableRedeem with a non user as KYC un-verified', async () => {
      await expect(
        registry.unverifyKycDisableRedeem(user2.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('not a user');
    });

    it('Should be able to call unverifyKycDisableRedeem', async () => {
      const userRedeemAddress = await registry.getRedeemAddress(user.address);
      await registry.setAttribute(
        user.address,
        RegistryAttributes.KYC_AML_VERIFIED.hex,
        1
      );
      await registry.setAttribute(
        userRedeemAddress,
        RegistryAttributes.CAN_BURN.hex,
        1
      );

      expect(
        await registry.getAttributeValue(
          user.address,
          RegistryAttributes.KYC_AML_VERIFIED.hex
        )
      ).to.equal(1);
      expect(
        await registry.getAttributeValue(
          userRedeemAddress,
          RegistryAttributes.CAN_BURN.hex
        )
      ).to.equal(1);

      const tx = registry.unverifyKycDisableRedeem(user.address, {
        gasLimit: 5000000,
      });
      await expect(tx)
        .to.emit(registry, 'UserKycUnverified')
        .withArgs(user.address);

      await expect(tx)
        .to.emit(registry, 'DisableRedeemAddress')
        .withArgs(userRedeemAddress);

      const userData = await registry.getUser(user.address);

      expect(userData.KYC).to.equal(false);
      expect(userData.canBurn).to.equal(false);
    });
  });

  describe('#blockAccount - #unblockAccount', () => {
    before(async () => {
      await reverter.revert();

      await registry.registerNewUser(user.address, userId, {
        gasLimit: 5000000,
      });
    });

    it('Should not allow to block an account to non owner account', async () => {
      await expect(
        registryFromOther.blockAccount(user.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should allow to block an account to owner account', async () => {
      await expect(registry.blockAccount(user.address, { gasLimit: 5000000 }))
        .to.emit(registry, 'BlockAccount')
        .withArgs(user.address);
    });

    it('Should allow to block a non user', async () => {
      await expect(registry.blockAccount(user2.address, { gasLimit: 5000000 }))
        .to.emit(registry, 'BlockAccount')
        .withArgs(user2.address);
    });

    it('Should not allow to block an account twice', async () => {
      await expect(
        registry.blockAccount(user.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('user already blocked');
    });

    it('Should not allow to unblock an account to no owner account', async () => {
      await expect(
        registryFromOther.unblockAccount(user.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should allow to unblock an account to owner account', async () => {
      await expect(
        registry.unblockAccount(user.address, { gasLimit: 5000000 })
      )
        .to.emit(registry, 'UnblockAccount')
        .withArgs(user.address);
    });

    it('Should not allow to unblock no blocked account', async () => {
      await expect(
        registry.unblockAccount(user.address, { gasLimit: 5000000 })
      ).to.be.revertedWith('user not blocked');
    });
  });

  describe('#getUserByRedeemAddress - #getRedeemAddress', () => {
    before(async () => {
      await reverter.revert();

      await registry.registerNewUser(user.address, userId, {
        gasLimit: 5000000,
      });
    });

    it('Should get the right user address', async () => {
      expect(
        await registry.getUserByRedeemAddress(
          '0x0000000000000000000000000000000000000001'
        )
      ).to.equal(user.address);
    });

    it('Should get the right redeem address', async () => {
      expect(await registry.getRedeemAddress(user.address)).to.equal(
        '0x0000000000000000000000000000000000000001'
      );
    });
  });

  describe('#canTransfer - #canTransferFrom - #canMint - #canBurn - #canWipe - #isRedeem - #isRedeemFrom', () => {
    before(async () => {
      await reverter.revert();

      await registry.registerNewUser(user.address, userId, {
        gasLimit: 5000000,
      });
      await registry.registerNewUser(user2.address, 'other-user-id', {
        gasLimit: 5000000,
      });
      await registry.userKycVerified(user.address, { gasLimit: 5000000 });
      await registry.enableRedeemAddress(user.address, { gasLimit: 5000000 });
      await registry.blockAccount(blockedCaller.address, {
        gasLimit: 5000000,
      });
      await registry.blockAccount(blockedReceptor.address, {
        gasLimit: 5000000,
      });
      await registry.blockAccount(blockedSender.address, {
        gasLimit: 5000000,
      });
      registerUser = registry.connect(user);
    });

    it('should revert when calling canTransfer with _from address blocked', async () => {
      try {
        await registryUser.canTransfer(blockedSender.address, user2.address)
      } catch (error) {
        expect(error.message.includes('blocklisted')).to.equal(true)
      }
    });

    it('should revert when calling canTransfer with _to address blocked', async () => {
      try {
        await registryUser.canTransfer(user.address, blockedReceptor.address)
      } catch (error) {
        expect(error.message.includes('blocklisted')).to.equal(true)
      }
    });

    it('should not revert when calling canTransfer with non blocked address', async () => {
      const result = await registryUser.canTransfer(
        user.address,
        user2.address
      );
      expect(result).to.equal(true);
    });

    it('should revert when calling canTransferFrom with _spender address blocked', async () => {
      try {
        await registryUser.canTransferFrom(
          blockedCaller.address,
          user.address,
          user2.address
        )
      } catch(error) {
        expect(error.message.includes('blocklisted')).to.equal(true);
      }
    });

    it('should revert when calling canTransferFrom with _from address blocked', async () => {
      try {
        await registryUser.canTransferFrom(
          user.address,
          blockedSender.address,
          user2.address
        )
      } catch(error) {
        expect(error.message.includes('blocklisted')).to.equal(true);
      }
    });

    it('should revert when calling canTransferFrom with _to address blocked', async () => {
      try {
        await registryUser.canTransferFrom(
          user.address,
          user2.address,
          blockedReceptor.address
        )
      } catch(error) {
        expect(error.message.includes('blocklisted')).to.equal(true);
      }
    });

    it('should not revert when calling canTransferFrom with non blocked address', async () => {
      const result = await registryUser.canTransferFrom(
        user.address,
        user2.address,
        owner.address
      );
      expect(result).to.equal(true);
    });

    it('should revert when calling canMint with a non KYCed address', async () => {
      try {
        await registryUser.canMint(user2.address)
      } catch (error) {
        expect(error.message.includes('user has not KYC')).to.equal(true);
      }
    });

    it('should revert when calling canMint with a KYCed and blocked address', async () => {
      try {
        await registry.blockAccount(user.address);
        await registryUser.canMint(user.address)
      } catch(error) {
        expect(error.message.includes('blocklisted')).to.equal(true);
      }
    });

    it('should not revert when calling canMint with a KYCed and non blocked address', async () => {
      await registry.unblockAccount(user.address, { gasLimit: 5000000 });
      const result = await registryUser.canMint(user.address);
      expect(result).to.equal(true);
    });

    it('should revert when calling canBurn with amount lower than min bound', async () => {
      try {
        await registry.registerNewUser('0x0000000000000000000000000000000000000001', 'test-user-id', {
          gasLimit: 5000000,
        });
        await registry.userKycVerified('0x0000000000000000000000000000000000000001', { gasLimit: 5000000 });
        await registry.enableRedeemAddress('0x0000000000000000000000000000000000000001', { gasLimit: 5000000 });
        await registryUser.canBurn(
            '0x0000000000000000000000000000000000000001',
            `${9e18}`
          ) 
      } catch (error) {
        expect(error.message.includes('below min bound')).to.equal(true);
      }
    });

    it('should revert when calling canBurn with amount greater than max bound', async () => {
      try {
        await registryUser.canBurn(
          '0x0000000000000000000000000000000000000001',
          `${16e18}`
        )
      } catch (error) {
        expect(error.message.includes('above max bound')).to.equal(true);
      }
    });

    it('should not revert when calling canBurn with an enabled redeem address address and amount equal than min bound', async () => {
      const result = await registryUser.canBurn(
        '0x0000000000000000000000000000000000000001',
        `${10e18}`
      );
      expect(result).to.equal(true);
    });

    it('should not revert when calling canBurn with an enabled redeem address address and amount equal than max bound', async () => {
      const result = await registryUser.canBurn(
        '0x0000000000000000000000000000000000000001',
        `${15e18}`
      );
      expect(result).to.equal(true);
    });

    it('should not revert when calling canBurn with an enabled redeem address address and amount greater than min bound and lower than max bound', async () => {
      const result = await registryUser.canBurn(
        '0x0000000000000000000000000000000000000001',
        `${11e18}`
      );
      expect(result).to.equal(true);
    });

    it('should revert when calling canBurn with non enabled redeem address address', async () => {
      try {
        await registry.disableRedeemAddress('0x0000000000000000000000000000000000000001', { gasLimit: 5000000 });
      await registryUser.canBurn(
          '0x0000000000000000000000000000000000000001',
          `${1e18}`
        )
      } catch (error) {
        expect(error.message.includes('can not burn')).to.equal(true);
      }
    });

    it('should revert when calling canWipe with non blocked address', async () => {
      try {
        await registryUser.canWipe(user.address);
      } catch (error) {
        expect(error.message.includes('can not wipe')).to.equal(true);
      }
    });

    it('should not revert when calling canWipe with an blocked address', async () => {
      const result = await registryUser.canWipe(blockedSender.address);
      expect(result).to.equal(true);
    });

    it('should return false when calling isRedeem with _receptor set to a non redeem address address', async () => {
      const result = await registryUser.isRedeem(user.address, user2.address);
      expect(result).to.equal(false);
    });

    it('should return true when calling isRedeem with _receptor se to a redeem address address', async () => {
      const result = await registryUser.isRedeem(
        user.address,
        '0x0000000000000000000000000000000000000001'
      );
      expect(result).to.equal(true);
    });

    it('should return false when calling isRedeemFrom with _receptor set to a non redeem address address', async () => {
      const result = await registryUser.isRedeemFrom(
        user.address,
        user2.address,
        owner.address
      );
      expect(result).to.equal(false);
    });

    it('should return true when calling isRedeemFrom with _receptor se to a redeem address address', async () => {
      const result = await registryUser.isRedeemFrom(
        user.address,
        user2.address,
        '0x0000000000000000000000000000000000000001'
      );
      expect(result).to.equal(true);
    });
  });
});
