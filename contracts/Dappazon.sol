// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Unishop {
	address public owner;
	string public name;
	address public user;

	struct Item {
		uint256 id;
		string name;
		string category;
		string image;
		uint256 cost;
		uint256 rating;
		uint256 stock;
	}

	struct Order {
		uint256 time;
		Item item;
	}
	//charge fee for listing
	address public feeAccount;
	uint256 public feePercent;
	uint256 public gasLimit;

	//list items to blockchain (like a database)
	mapping(uint256 => Item) public items;
	mapping(address => uint256) public orderCount;
	mapping(address => mapping(uint256 => Order)) public orders;
	mapping(address => bool) public isApproved;


	event Buy(address buyer, uint256 orderId, uint256 itemId);
	event List(string name, uint256 cost, uint256 quantity);

	//Ensure only owner can withdraw funds
	modifier onlyOwner() {
		require(msg.sender == owner, "Unishop: You are not the owner");
		_;
	}

	modifier onlyApproved() {
		require(msg.sender == owner || isApproved[msg.sender], "Unishop: You are not authorized to list on this platform");
		_;
	}

	constructor(address _feeAccount, uint256 _feePercent) {
		feeAccount = _feeAccount;
		feePercent = _feePercent;
		name = "Unishop";
		owner = msg.sender;
	}

	function addApprovedUser(address _user) public onlyOwner {
		isApproved[_user] = true;
	}

	function setUser(address _user) public onlyOwner {
    user = _user;
	}

	function removeApprovedUser(address _user) public onlyOwner {
		isApproved[_user] = false;
	}

	function list(
		uint256 _id, 
		string memory _name, 
		string memory _category,
		string memory _image,
		uint256 _cost,
		uint256 _rating,
		uint256 _stock
	) public payable onlyApproved {

		 // Calculate the fee
    uint256 feeAmount = (_cost * 3) / 100;



    // Ensure the sent value covers the fee
    require(msg.value >= feeAmount,  "Unishop: Insufficient fee");

    // Transfer the fee to the owner
    payable(feeAccount).transfer(feeAmount);

		//create item struct
		Item memory item = Item(
			_id, 
			_name,
			_category, 
			_image, 
			_cost, 
			_rating, 
			_stock
		);

		//Save item struct to blockchain
		items[_id] = item;

		//emit an event
		emit List(_name, _cost, _stock);
	}

	//Buy products
	function buy(uint256 _id) public payable {
		//Fetch item
		Item memory item = items[_id];

		//Require enough ether to buy item
		require(msg.value >= item.cost);

		//require item is in stock
		require(item.stock > 0);

		//Create an Order
		Order memory order = Order(block.timestamp, item);

		//Save order to chain
		orderCount[msg.sender]++;
		orders[msg.sender][orderCount[msg.sender]] = order;

		//subtract stock
		items[_id].stock = item.stock - 1;

		//Emit Event
		emit Buy(msg.sender, orderCount[msg.sender], item.id);
	}

		//Withdraw funds
	function withdraw() public onlyOwner {
    uint256 balance = address(this).balance;

    // Checks-Effects-Interactions Pattern
   // address(this).balance = 0;
    // Interact with external addresses
    (bool success, ) = owner.call{value: balance}("");
    require(success, "Withdrawal failed");
  }
}
