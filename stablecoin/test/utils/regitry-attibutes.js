const { ethers } = require('hardhat');

const attribute = (name) => ({
  name,
  hex: ethers.utils.formatBytes32String(name),
});

module.exports = {
  IS_BLOCKLISTED: attribute('IS_BLOCKLISTED'),
  KYC_AML_VERIFIED: attribute('KYC_AML_VERIFIED'),
  CAN_BURN: attribute('CAN_BURN'),
  USER_REDEEM_ADDRESS: attribute('USER_REDEEM_ADDRESS'),
  REDEEM_ADDRESS_USER: attribute('REDEEM_ADDRESS_USER'),
};
