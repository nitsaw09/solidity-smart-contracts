// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../Claimer.sol";

contract ClaimerMock is Claimer {
    receive() external payable {}
}
