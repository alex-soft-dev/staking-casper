// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CSPDStaking is Ownable {
    using SafeMath for uint256;

    // Info of each user.
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingAmount;
        uint256 lastStakedTime;
    }

    struct UnStakeFee {
        uint256 minDays;
        uint256 feePercent;
    }

    UnStakeFee[] public unStakeFees;

    IERC20 public immutable cspdToken;
    uint256 public lastRewardBlock;
    uint256 public accCSPDPerShare;
    uint256 public rewardPerBlock;
    address public feeWallet;
    uint256 public harvestFee;

    uint256 public totalStakedAmount;

    uint256 private _rewardBalance;


    // Info of each user that stakes LP tokens.
    mapping (address => UserInfo) public userInfo;

    event Stake(address indexed user, uint256 amount);
    event ReStake(address indexed user, uint256 amount);
    event DepositReward(address indexed user, uint256 amount);
    event UnStake(address indexed user, uint256 amount, uint256 unStakeFee);
    event Harvest(address indexed user, uint256 amount, uint256 harvestFee);
    event SetFeeWallet(address indexed _feeWallet);
    event SetUnStakeFee(uint256 _index, uint256 _minDays, uint256 _feePercent);
    event AddUnStakeFee(uint256 _index, uint256 _minDays, uint256 _feePercent);
    event RemoveUnStakeFee(uint256 _index, uint256 _minDays, uint256 _feePercent);
    event SetHarvestFee(uint256 _harvestFee);

    constructor(
        IERC20 _cspdToken,
        uint256 _rewardPerBlock,
        address _feeWallet
    ) {
        cspdToken = _cspdToken;
        rewardPerBlock = _rewardPerBlock;
        feeWallet = _feeWallet;
        init();
    }

    function init() private {
        UnStakeFee memory unStakeFee1 = UnStakeFee({
            minDays: 7,
            feePercent: 40
        });
        unStakeFees.push(unStakeFee1);

        UnStakeFee memory unStakeFee2 = UnStakeFee({
            minDays: 14,
            feePercent: 30
        });
        unStakeFees.push(unStakeFee2);

        UnStakeFee memory unStakeFee3 = UnStakeFee({
            minDays: 21,
            feePercent: 20
        });
        unStakeFees.push(unStakeFee3);

        UnStakeFee memory unStakeFee4 = UnStakeFee({
            minDays: 30,
            feePercent: 10
        });
        unStakeFees.push(unStakeFee4);
    }

    function setFeeWallet(address _feeWallet) external onlyOwner {
        feeWallet = _feeWallet;
        emit SetFeeWallet(feeWallet);
    }

    function setUnStakeFee(uint256 _index, uint256 _minDays, uint256 _feePercent) external onlyOwner {
        require(_index < unStakeFees.length, "setUnStakeFee: range out");
        require(_minDays > 0, "setUnStakeFee: minDays is 0");
        require(_feePercent <= 40, "setUnStakeFee: feePercent > 40");
        if (_index == 0) {
            require(_minDays < unStakeFees[1].minDays, "setUnStakeFee: minDays is error");
            require(_feePercent > unStakeFees[1].feePercent, "setUnStakeFee: feePercent is error");
        } else if (_index == unStakeFees.length - 1) {
            require(_minDays > unStakeFees[_index - 1].minDays, "setUnStakeFee: minDays is error");
            require(_feePercent < unStakeFees[_index - 1].feePercent, "setUnStakeFee: feePercent is error");
        } else {
            require(_minDays > unStakeFees[_index - 1].minDays && _minDays < unStakeFees[_index + 1].minDays, "setUnStakeFee: minDays is error");
            require(_feePercent < unStakeFees[_index - 1].feePercent && _feePercent > unStakeFees[_index + 1].feePercent, "setUnStakeFee: feePercent is error");
        }
        unStakeFees[_index].feePercent = _feePercent;
        unStakeFees[_index].minDays = _minDays;
        emit SetUnStakeFee(_index, _minDays, _feePercent);
    }

    function addUnStakeFee(uint256 _minDays, uint256 _feePercent) external onlyOwner {
        require(_minDays > 0, "addUnStakeFee: minDays is 0");
        require(_feePercent <= 40, "addUnStakeFee: feePercent > 40");
        if(unStakeFees.length > 0){
            require(_minDays > unStakeFees[unStakeFees.length - 1].minDays, "addUnStakeFee: minDays is error");
            require(_feePercent < unStakeFees[unStakeFees.length - 1].feePercent, "addUnStakeFee: feePercent is error");
        }
        UnStakeFee memory unStakeFee = UnStakeFee({
            minDays: _minDays,
            feePercent: _feePercent
        });
        unStakeFees.push(unStakeFee);
        emit AddUnStakeFee(unStakeFees.length, _minDays, _feePercent);
    }

    function removeUnStakeFee(uint256 _index) external onlyOwner {
        require(_index < unStakeFees.length, "removeUnStakeFee: range out");
        uint256 _minDays = unStakeFees[_index].minDays;
        uint256 _feePercent = unStakeFees[_index].feePercent;
        for (uint256 i = _index; i < unStakeFees.length - 1; i++) {
            unStakeFees[i] = unStakeFees[i+1];
        }
        unStakeFees.pop();
        emit RemoveUnStakeFee(_index, _minDays, _feePercent);
    }

    function setHarvestFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 40, "setHarvestFee: feePercent > 40");
        harvestFee = _feePercent;
        emit SetHarvestFee(_feePercent);
    }

    function getMultiplier(uint256 _from, uint256 _to) public pure returns (uint256) {
        return _to.sub(_from);
    }

    function getPending(address _user) public view returns (uint256) {
        uint256 pending = _getPending(_user);
        uint256 _harvestFee = pending.mul(harvestFee).div(100);
        return pending - _harvestFee;
    }

    function _getPending(address _user) private view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 acc = accCSPDPerShare;
        if (block.number > lastRewardBlock && totalStakedAmount != 0) {
            uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
            uint256 reward = multiplier.mul(rewardPerBlock);
            acc = acc.add(reward.mul(1e12).div(totalStakedAmount));
        }
        return user.amount.mul(acc).div(1e12).sub(user.rewardDebt).add(user.pendingAmount);
    }

    function getRewardBalance() external view returns (uint256) {
        if (block.number > lastRewardBlock && totalStakedAmount != 0) {
            uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
            uint256 reward = multiplier.mul(rewardPerBlock);
            return _rewardBalance.sub(reward);
        }
        else {
            return _rewardBalance;
        }
    }

    function depositReward(uint256 _amount) external onlyOwner {
        cspdToken.transferFrom(msg.sender, address(this), _amount);
        emit DepositReward(msg.sender, _amount);
        _rewardBalance = _rewardBalance.add(_amount);
    }

    function updateStatus() private {
        if (block.number <= lastRewardBlock) {
            return;
        }
        if (totalStakedAmount == 0) {
            lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(lastRewardBlock, block.number);
        uint256 reward = multiplier.mul(rewardPerBlock);
        if (_rewardBalance == 0) {
            lastRewardBlock = block.number;
            return;
        }
        if (_rewardBalance < reward) {
            accCSPDPerShare = accCSPDPerShare.add(_rewardBalance.mul(1e12).div(totalStakedAmount));
            _rewardBalance = 0;
        } else {
            _rewardBalance = _rewardBalance.sub(reward);
            accCSPDPerShare = accCSPDPerShare.add(reward.mul(1e12).div(totalStakedAmount));
        }
        lastRewardBlock = block.number;
    }

    function stake(uint256 _amount) public {
        require(_rewardBalance > 0, "rewardBalance is 0");
        UserInfo storage user = userInfo[msg.sender];
        updateStatus();
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(accCSPDPerShare).div(1e12).sub(user.rewardDebt);
            user.pendingAmount = user.pendingAmount.add(pending);
        }
        cspdToken.transferFrom(msg.sender, address(this), _amount);
        totalStakedAmount = totalStakedAmount.add(_amount);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(accCSPDPerShare).div(1e12);
        user.lastStakedTime = block.timestamp;
        emit Stake(msg.sender, _amount);
    }

    function unStake(uint256 _amount) public {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "unStake: not good");
        updateStatus();
        uint256 pending = user.amount.mul(accCSPDPerShare).div(1e12).sub(user.rewardDebt);
        if (cspdToken.balanceOf(address(this)) < pending) {
            pending = cspdToken.balanceOf(address(this));
        }
        user.pendingAmount = user.pendingAmount.add(pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(accCSPDPerShare).div(1e12);
        uint256 feePercent = getUnStakeFeePercent(msg.sender);
        uint256 unStakeFee = _amount.mul(feePercent).div(100);
        uint256 amount = _amount.sub(unStakeFee);
        cspdToken.transfer(msg.sender, amount);
        cspdToken.transfer(feeWallet, unStakeFee);
        totalStakedAmount = totalStakedAmount.sub(_amount);
        emit UnStake(msg.sender, amount, unStakeFee);
    }

    function getUnStakeFeePercent(address _user) public view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        for (uint256 i = 0; i < unStakeFees.length; i++) {
            if (unStakeFees[i].minDays.mul(3600 * 24) >= (block.timestamp - user.lastStakedTime)) {
                return unStakeFees[i].feePercent;
            }
        }
        return 0;
    }

    function harvest(bool reStake) public {
        uint256 rewardAmount = _getPending(msg.sender);
        
        if (reStake) {
            require(_rewardBalance > 0, "rewardBalance is 0");
            UserInfo storage user = userInfo[msg.sender];
            totalStakedAmount = totalStakedAmount.sub(user.amount);
            updateStatus();
            user.pendingAmount = 0;
            user.amount = user.amount.add(rewardAmount);
            totalStakedAmount = totalStakedAmount.add(user.amount);
            user.rewardDebt = user.amount.mul(accCSPDPerShare).div(1e12);
            emit ReStake(msg.sender, rewardAmount);
        } else {
            UserInfo storage user = userInfo[msg.sender];
            uint256 _harvestFee = rewardAmount.mul(harvestFee).div(100);
            uint256 amount = rewardAmount - _harvestFee;
            if (cspdToken.balanceOf(address(this)) < amount) {
                amount = cspdToken.balanceOf(address(this));
            }
            cspdToken.transfer(msg.sender, amount);

            if (cspdToken.balanceOf(address(this)) < _harvestFee) {
                _harvestFee = cspdToken.balanceOf(address(this));
            }
            cspdToken.transfer(feeWallet, _harvestFee);
            
            emit Harvest(msg.sender, amount, _harvestFee);

            updateStatus();
            user.pendingAmount = 0;
            user.rewardDebt = user.amount.mul(accCSPDPerShare).div(1e12);
        }
    }
}