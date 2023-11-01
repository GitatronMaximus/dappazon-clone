// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Unishop {
	address public owner;
	address public users;

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

	//list items to blockchain (like a database)
	mapping(uint256 => Item) public items;
	mapping(address => uint256) public orderCount;
	mapping(address => mapping(uint256 => Order)) public orders;

	event Buy(address buyer, uint256 orderId, uint256 itemId);
	event List(string name, uint256 cost, uint256 quantity);

	//Ensure only owner can list items
	modifier onlyOwner() {
		require(msg.sender == owner);
		require(msg.sender == owner, "Unishop: You aren't the owner");
		_;
	}
	//Ensure only approved user can list
	modifier onlyApproved() {
		require(msg.sender == users);
		require(msg.sender == users, "Unishop: You aren't authorized");
		_;
	}

	constructor(address _feeAccount, uint256 _feePercent) {
		feeAccount = _feeAccount;
		feePercent = _feePercent;
		owner = msg.sender;
	}

	function list(
		uint256 _id, 
		string memory _name, 
		string memory _category,
		string memory _image,
		uint256 _cost,
		uint256 _rating,
		uint256 _stock
	) public {

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

	function list(
		address _user,
		uint256 _id, 
		string memory _name, 
		string memory _category,
		string memory _image,
		uint256 _cost,
		uint256 _rating,
		uint256 _stock
	) internal {

		uint256 _feeAmount = (_cost * feePercent) / 100;

		items[_cost][msg.sender] = 
			items[_cost][msg.sender] - 
			(_cost + _feeAmount);
		
		items[_cost][_user] = items[_cost][_user] + _cost;

		items[_cost][feeAccount] = 
			items[_cost][feeAccount] +
			 _feeAmount;
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
		(bool success, ) = owner.call{value: address(this).balance}("");
		require(success);
	}
}
