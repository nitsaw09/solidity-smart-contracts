// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract BatchTransfer {
    address public tokenAddress;
    
    // Event emitted when a batch transfer is executed
    event BatchTransferExecuted(address indexed sender, address[] receivers, uint256[] amounts);

    // Reentrancy guard
    bool private locked;

    modifier noReentrancy() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    // Constructor to set the ERC-20 token address
    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
    }

    /**
     * @notice Function to perform multiple transfers in a single transaction
     * @param _to: Array of destination addresses
     * @param _amounts: Array of token amounts to transfer to corresponding addresses
     */
    function transferBatch(address[] calldata _to, uint256[] calldata _amounts) external noReentrancy {
        // verifying the arrays has non-zero length and the same length
        require(_to.length > 0 && _to.length == _amounts.length, "Invalid arrays length");

        // Get the ERC-20 token contract
        IERC20 token = IERC20(tokenAddress);

        // Perform batch transfers
        uint256 toCount = _to.length;
        for (uint256 i = 0; i < toCount; i++) {
            require(token.transfer(_to[i], _amounts[i]), "Transfer failed");
        }

        // Emit the BatchTransferExecuted event
        emit BatchTransferExecuted(msg.sender, _to, _amounts);
    }
}
