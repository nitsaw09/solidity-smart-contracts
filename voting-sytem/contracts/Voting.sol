// SPDX-License-Identifier: MIT
// This is a smart contract for a voting system.
// It allows users to propose items, vote for them, and determine the winner based on votes.

pragma solidity ^0.8.0;

contract Voting {
    // Address of the contract owner
    address public owner;
    
    // Struct to represent a proposed item
    struct Item {
        string name;
        uint256 voteCount;
    }
    
    // Array to store the proposed items
    Item[] public items;
    
    // Mapping to keep track of whether an address has voted
    mapping(address => bool) public hasVoted;
    
    // Event emitted when a new item is proposed
    event ItemProposed(uint256 itemId, string itemName);
    
    // Event emitted when a user votes for an item
    event Voted(address voter, uint256 itemId);

    // Modifier to restrict certain functions to be called only by the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
    
    // Modifier to ensure a user can vote only once
    modifier hasNotVoted() {
        require(!hasVoted[msg.sender], "You have already voted");
        _;
    }

    // Constructor to set the owner of the contract
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Function to propose a new item for voting, callable only by the owner
     * @param _itemName: Name of the proposed item
     */
    function proposeItem(string memory _itemName) external onlyOwner {
        uint256 itemId = items.length + 1;
        items.push(Item(_itemName, 0));
        emit ItemProposed(itemId, _itemName);
    }
    
    /**
     * @notice Function to vote for a specific item by ID, callable by any user who has not voted yet
     * @param _itemId: ID of the item to vote for
     */
    function voteForItem(uint256 _itemId) external hasNotVoted {
        require(_itemId > 0 && _itemId <= items.length, "Invalid item ID");
        items[_itemId - 1].voteCount++;
        hasVoted[msg.sender] = true;
        emit Voted(msg.sender, _itemId);
    }
    
    /**
     * @notice Function to get the ID and name of the item with the most votes
     * return winningItemId: ID of the winning item
     * return winningItemName: Name of the winning item
     */
    function getWinner() 
        external 
        view 
        returns (
            uint256 winningItemId, 
            string memory winningItemName
        ) {
        require(items.length > 0, "No items proposed yet");
        
        uint256 maxVotes = 0;
        
        // Iterate through all items to find the winner
        for (uint256 i = 0; i < items.length; i++) {
            if (items[i].voteCount > maxVotes) {
                maxVotes = items[i].voteCount;
                winningItemId = i + 1;
                winningItemName = items[i].name;
            }
        }
    }
}
