// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IUserRegistry.sol";

contract RegistryUserMock {
    IUserRegistry public userRegistry;

    constructor() {}

    function setUserRegistry(IUserRegistry _userRegistry) public {
        userRegistry = _userRegistry;
    }

    function canTransfer(address _from, address _to)
        public
        view
        returns (bool)
    {
        userRegistry.canTransfer(_from, _to);
        return true;
    }

    function canTransferFrom(
        address _spender,
        address _from,
        address _to
    ) public view returns (bool) {
        userRegistry.canTransferFrom(_spender, _from, _to);
        return true;
    }

    function canMint(address _to) public view returns (bool) {
        userRegistry.canMint(_to);
        return true;
    }

    function canBurn(address _from, uint256 _amount)
        public
        view
        returns (bool)
    {
        userRegistry.canBurn(_from, _amount);
        return true;
    }

    function canWipe(address _account) public view returns (bool) {
        userRegistry.canWipe(_account);
        return true;
    }

    function isRedeem(address _sender, address _recipient)
        external
        view
        returns (bool)
    {
        return userRegistry.isRedeem(_sender, _recipient);
    }

    function isRedeemFrom(
        address _caller,
        address _sender,
        address _recipient
    ) external view returns (bool) {
        return userRegistry.isRedeemFrom(_caller, _sender, _recipient);
    }
}
