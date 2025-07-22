//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721URIStorage {
    // utilitas Counters dari OpenZeppelin untuk mengelola ID unik untuk setiap NFT yang dicetak
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Wajib rewrite karena Contract ERC721Storage adalah turunan dari ERC721 
    constructor() ERC721("Real Estate", "Real") {}

    // Fungsi untuk mencetak NFT
    function mint(string memory tokenURI) public returns(uint256){
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        // Mencetak NFT
        _mint(msg.sender, newItemId);
        // Menyimpan URI/Metadata
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    // Fungsi untuk mendapatkan total NFT
    function totalSupply() public view returns(uint256){
        return _tokenIds.current();
    }
}
