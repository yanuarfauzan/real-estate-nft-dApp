//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    // state variables
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    modifier onlySeller(){
        require(msg.sender == seller, "You are not the seller");
        _;
    }

    modifier onlyInspector(){
        require(msg.sender == inspector, "You are not the inspector");
        _;
    }

    modifier onlyBuyer(uint256 _nftID){
        require(msg.sender == buyer[_nftID], "You are not the buyer");
        _;
    }

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    constructor(address _nftAddress, address payable _seller, address _inspector, address _lender){
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    function list(uint256 _nftID, address _buyer, uint256 _purchasePrice, uint256 _escrowAmount) public payable onlySeller {
        // Transfer dari pemilik ke pihak ketiga
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
        // Atur status listing
        isListed[_nftID] = true;
        // Atur harga 
        purchasePrice[_nftID] = _purchasePrice;
        // Atur harga pihak ketiga
        escrowAmount[_nftID] = _escrowAmount;
        // Atur pembeli
        buyer[_nftID] = _buyer;
    }

    // Fungsi untuk menyetor uang jaminan (earnest deposit) oleh pembeli
    function depositeEarnest(uint256 _nftID) public payable onlyBuyer(_nftID){
        require(msg.value >= escrowAmount[_nftID]);
    }

    // Fungsi spesial agar kontrak bisa menerima ETH secara langsung
    receive() external payable {}

    // Fungsi untuk melihat saldo ETH yang ada di kontrak saat ini
    function getBalance() public view returns(uint256){
        return address(this).balance;
    }

    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector {
        inspectionPassed[_nftID] = _passed;
    }

    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }

    // Finalize Sale
    // Require inspection status (add more items here, like oopraisal)
    // Require sale to be authorized
    // Require funds to be correct amount
    // Transfer NFT to buyer
    // Transfer Funds to seller

    function finalizeSale(uint256 _nftID) public {
        require(inspectionPassed[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance >= purchasePrice[_nftID]);

        isListed[_nftID] = false;

        (bool success, ) = payable(seller).call{value: address(this).balance}("");
         require(success);  

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    function cancelSale(uint256 _nftID) public {
        if(inspectionPassed[_nftID] == false){
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

}
