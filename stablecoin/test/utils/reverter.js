const { ethers } = require('hardhat');

function Reverter() {
  let snapshotId;
  const { provider } = ethers;

  this.snapshot = async () => {
    try {
      const result = await provider.send('evm_snapshot', []);
      snapshotId = result;
      return snapshotId;
    } catch (error) {
      return error;
    }
  };

  this.revert = async () => {
    try {
      await provider.send('evm_revert', [snapshotId]);
      const stanpshot = await this.snapshot();
      return stanpshot;
    } catch (error) {
      return error;
    }
  };
}

module.exports = Reverter;
