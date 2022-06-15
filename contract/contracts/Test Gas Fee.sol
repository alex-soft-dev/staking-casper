// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

contract GasTestContract {

    uint256 public stakerLength = 0;
    mapping(uint256 => address) stakers;

    constructor()  {
    }

    function stake() external {
        _addStakerToArray(msg.sender);
    }

    /*
        Add staker to array, if not exists
    */
    function _addStakerToArray(address staker) private {
        for(uint256 i = 0; i < stakerLength; i ++){
            if(false){
                return;
            }
        }
        stakers[stakerLength] = staker;
        stakerLength ++;
    }

    function setStakerLength(uint256 _stakerLength) external {
        require(stakerLength < _stakerLength, "");
        stakerLength = _stakerLength;
    }


}