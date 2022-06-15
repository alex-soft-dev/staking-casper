// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBEP20 } from "./IBEP20.sol";

/**
 * @title CSPD Staking
 * Distribute CSPD rewards over discrete-time schedules for the staking of CSPD on BSC network.
 * This contract is designed on a self-service model, where users will stake CSPD, unstake CSPD and claim rewards through their own transactions only.
 */
contract CSPDStaking is Ownable {

    /* ------------------------------ States --------------------------------- */

    using SafeMath for uint256;

    IBEP20 public immutable tokenAddress;               // contract address of bep20 token

    uint256 public allStakes;                           // total amount of staked token

    // address[] stakers;                                  // all stakers

    mapping(uint256 => address) stakers;                // all stakers

    uint256 public stakerLength;                               // count of stakers

    address public feeAddress;                          // address for fee

    uint256 public harvestFee;                          // harvest fee

    uint256 public unstakeFee5;                         // unstake fee for <= 7 days

    uint256 public unstakeFee4;                         // unstake fee for <= 14 days

    uint256 public unstakeFee3;                         // unstake fee for <= 21 days

    uint256 public unstakeFee2;                         // unstake fee for <= 30 days
    
    uint256 public unstakeFee1;                         // unstake fee for > 30 days

    mapping(address => UserInfo) stakerInfos;           // user infos

    struct UserInfo{                                    
        uint256 stake;                                  // amount of stakes
        uint256 reward;                                 // amount of rewards
        uint256 lastUpdatedTime;                        // last updated time of rewards
        uint256 lastStakedTime;                         // last staked time
    }

    bool public isRunning;                              // is running or not

    uint256 public decimal;                             // decimal of reward token

    uint256 public totalSupply;                         // total Supply of rewarding - min: 10K

    uint256 public totalStakingPeriodDays;              // total staking period by days - min: 1 Month

    uint256 private _totalRewards;                      // total Rewardings

    uint256 private _totalHarvest;                      // total amount of harvested             

    uint256 private _totalFee;                          // total amount of fee

    uint256 private _rewardCapacity;                    // total amount of token in contract for rewarding

    uint256 private _rewardAmountPerSecond;             // total rewarding per second
    
    /* ------------------------------ Events --------------------------------- */
    event Staked(address indexed staker, uint256 amount, uint256 fee);
    
    event UnStaked(address indexed staker, uint256 amount, uint256 fee);

    event Harvest(address indexed staker, uint256 amount, uint256 fee);

    event AdminDeposit(address admin, uint256 amount);

    event AdminWithdraw(address admin, uint256 amount);

    event AdminUpdatedAPY(uint256 totalSupply_, uint256 totalPeriods_);
    
    event AdminUpdatedAPYNoRewards(uint256 totalSupply_, uint256 totalPeriods_);

    event AdminUpdatedRunning(bool status);
    
    event AdminUpdatedRunningNoRewards(bool status);

    event AdminUpdatedRewards(uint256 offSet, uint256 size);

    event AdminUpdatedHarvestFee(uint fee);

    event AdminUpdatedUnstakeFee1(uint fee);

    event AdminUpdatedUnstakeFee2(uint fee);
    
    event AdminUpdatedUnstakeFee3(uint fee);
    
    event AdminUpdatedUnstakeFee4(uint fee);
    
    event AdminUpdatedUnstakeFee5(uint fee);

    event AdminUpdatedFeeAddress(address feeAddress_);

    /* ------------------------------ Modifiers --------------------------------- */


    /* ------------------------------ User Functions --------------------------------- */

    /* 
        Contructor of contract
    params:
        - tokenAddress: Contract Address of BEP20 token
        - totalSupply: total amount of rewarding tokens
        - totalStakingPeriodDays: total time of staking for tokens by days
    */
    constructor(
        IBEP20 tokenAddress_,
        uint256 totalSupply_,
        uint256 totalStakingPeriodDays_,
        address feeAddress_,
        uint256 harvestFee_,
        uint256 unstakeFee1_,
        uint256 unstakeFee2_,
        uint256 unstakeFee3_,
        uint256 unstakeFee4_,
        uint256 unstakeFee5_
    ) {
        require(totalSupply_ >= 1e4 * (10 ** 18), "Contract Constructor: Not Enough Supply Amount, bigger than 10K");
        require(totalStakingPeriodDays_ > 0, "Contract Constructor: Not Enough Staking Period, bigger than 1 days");
        require(feeAddress_ != address(0), "Contract Constructor: Invalid fee address");
        
        tokenAddress = tokenAddress_;
        
        decimal = 18;
        totalSupply = totalSupply_;
        totalStakingPeriodDays = totalStakingPeriodDays_;

        isRunning = true;

        feeAddress = feeAddress_;
        harvestFee = harvestFee_;
        unstakeFee1 = unstakeFee1_;
        unstakeFee2 = unstakeFee2_;
        unstakeFee3 = unstakeFee3_;
        unstakeFee4 = unstakeFee4_;
        unstakeFee5 = unstakeFee5_;
        
        _updateRewardAmountPerSecond();
    }

    /*
        Cal rewards per seconds from APY
    */
    function _updateRewardAmountPerSecond() private{
        _rewardAmountPerSecond = totalSupply / (totalStakingPeriodDays * 24 * 3600);
    }

    /*
        Update Rewardings(amount and time)
        notice: rewarding amount increases only isRunning
    */
    function _updateRewards(address staker) private {
        uint256 total = allStakes;
        uint256 count = stakerInfos[staker].stake;
        
        if(stakerInfos[staker].lastUpdatedTime == 0 || total == 0 || count == 0) return;

        uint256 current = block.timestamp;

        if(isRunning){
            uint256 rewarding = _calculateAddingRewards(staker);
            stakerInfos[staker].reward = stakerInfos[staker].reward + rewarding;
            _totalRewards = _totalRewards + rewarding;
        }

        stakerInfos[staker].lastUpdatedTime = current;
    }

    /*
        Get Adding rewardings not stored in storage
    */
    function _calculateAddingRewards(address staker) private view returns(uint256){
        uint256 total = allStakes;
        uint256 count = stakerInfos[staker].stake;
        
        if(!isRunning || stakerInfos[staker].lastUpdatedTime == 0 || total == 0 || count == 0)
            return 0;
        
        uint256 current = block.timestamp;
        uint256 rewarding = (current - stakerInfos[staker].lastUpdatedTime) * _rewardAmountPerSecond * count / total;

        return rewarding;
    }

    /*
        Get total Adding rewardings not stored in storage
    */
    function _calculateTotalAddingRewards() private view returns(uint256){
        uint256 totalAdding;
        for(uint256 i = 0; i < stakerLength; i++){
            totalAdding = totalAdding + _calculateAddingRewards(stakers[i]);
        }
        return totalAdding;
    }

    /*
        Update Rewardings for all stakers
    */
    function _updateAllRewards() private {
        for(uint256 i = 0; i < stakerLength; i++){
            _updateRewards(stakers[i]);
        }
    }

    /*
        Get Rewards amount per second by user
    */
    function rewardsPerSecond() external view returns(uint256){
        uint256 total = allStakes;
        uint256 count = stakerInfos[msg.sender].stake;
        if(total == 0 || count == 0) return 0;
        uint256 rewarding = _rewardAmountPerSecond * count / total;
        return rewarding;
    }

    /*
        Stake token
        note - user should call the token address and approve for the amount for this contract
    */
    function stake(uint256 amount) external {
        _updateRewards(msg.sender);

        allStakes = allStakes + amount;
        stakerInfos[msg.sender].stake = stakerInfos[msg.sender].stake + amount;
        _addStakerToArray(msg.sender);
        
        stakerInfos[msg.sender].lastUpdatedTime = block.timestamp;
        stakerInfos[msg.sender].lastStakedTime = block.timestamp;

        tokenAddress.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount, 0);
    }

    /*
        Add staker to array, if not exists
    */
    function _addStakerToArray(address staker) private {
        for(uint256 i = 0; i < stakerLength; i ++){
            if(stakers[i] == staker){
                return;
            }
        }
        stakers[stakerLength] = staker;
        stakerLength ++;
    }

    /*
        Unstake token
    */
    function unstake(uint256 amount) external {

        require(stakerInfos[msg.sender].stake >= amount, "CSPD UnStaking: not enough staked token amount.");
        _updateRewards(msg.sender);

        allStakes = allStakes - amount;
        stakerInfos[msg.sender].stake = stakerInfos[msg.sender].stake - amount;

        uint256 stakingTime = block.timestamp - stakerInfos[msg.sender].lastStakedTime;
        uint256 unstakeFee = 0;
        if(stakingTime > 30 days){
            unstakeFee = unstakeFee1;
        }
        else if(stakingTime > 21 days){
            unstakeFee = unstakeFee2;
        }
        else if(stakingTime > 14 days){
            unstakeFee = unstakeFee3;
        }
        else if(stakingTime > 7 days){
            unstakeFee = unstakeFee4;
        }
        else{
            unstakeFee = unstakeFee5;
        }
        
        uint256 fee = amount * unstakeFee / 100;
        _totalFee = _totalFee + fee;

        tokenAddress.transfer(msg.sender, amount - fee);
        tokenAddress.transfer(feeAddress, fee);

        emit UnStaked(msg.sender, amount, unstakeFee);
    }

    /*
        Harvest rewardings
    */
    function harvest(uint256 amount) external {
        _updateRewards(msg.sender);
        require(_rewardCapacity >= amount, "Harvest Rewarding: not enough reward capacity.");
        require(amount > 0 && stakerInfos[msg.sender].reward >= amount, "Harvest Rewarding: not enough rewards");

        stakerInfos[msg.sender].reward = stakerInfos[msg.sender].reward - amount;
        
        _totalHarvest = _totalHarvest + amount;
        _rewardCapacity = _rewardCapacity - amount;
        
        uint256 fee = amount * harvestFee / 100;

        _totalFee = _totalFee + fee;
        
        tokenAddress.transfer(msg.sender, amount - fee);
        tokenAddress.transfer(feeAddress, fee);

        emit Harvest(msg.sender, amount, harvestFee);
    }

    /*
        Get amount of staked token per user
    */
    function balanceOfStakes() external view returns (uint256){
        return stakerInfos[msg.sender].stake;
    }
    
    /*
        Get all amount of staked token per user
    */
    function balanceOfStakes(address user) external view returns (uint256){
        return stakerInfos[user].stake;
    }

    /*
        Get amount of staked token per user
        set offset and size because of limit of return value
    */
    function exportStakingInfos(uint256 offSet, uint256 size) external view returns (address[] memory, uint256[] memory){
        require(offSet < stakerLength, "Export Staking Infos: invalid offset.");
        require(size > 0 && offSet + size <= stakerLength, "Export Staking Infos: invalid size.");
        address[] memory users = new address[](size);
        uint256[] memory amounts = new uint256[](size);

        uint256 index = 0;
        for(uint256 i = offSet; i < offSet + size; i ++){
            users[index] = stakers[i];
            amounts[index] = stakerInfos[stakers[i]].stake;
            index ++;
        }
        return (users, amounts);
    }

    /*
        Get reward amounts
    */
    function balanceOfRewards() external view returns(uint256){
        return _balanceOfRewards(msg.sender);
    }

    function _balanceOfRewards(address staker) private view returns(uint256){
        return stakerInfos[msg.sender].reward + _calculateAddingRewards(staker);
    }

    /* ------------------------------ Admin Functions --------------------------------- */
    /*
        Deposit token for rewarding by admin
        note - user should call the token address and approve for the amount for this contract
    */
    function adminDepositReward(uint256 amount) external onlyOwner {
        _rewardCapacity = _rewardCapacity + amount;
        
        tokenAddress.transferFrom(msg.sender, address(this), amount);
        emit AdminDeposit(msg.sender, amount);
    }

    /*
        Withdraw rewarding token by admin
    */
    function adminWithdrawReward(uint256 amount) external onlyOwner {
        uint256 pendingRewards = _totalRewards + _calculateTotalAddingRewards() - _totalHarvest;
        require(_rewardCapacity - pendingRewards >= amount, "Admin Witdraw Rewards: not enough rewards capacity to withdraw");
        _rewardCapacity = _rewardCapacity - amount;

        tokenAddress.transfer(msg.sender, amount);
        emit AdminWithdraw(msg.sender, amount);
    }

    /*
        Get rewards of staker
    */
    function adminRewards(address staker) public view onlyOwner returns(uint256){
        return _balanceOfRewards(staker);
    }

    /*
        Start or stop staking logic by admin
    */
    function adminSetRunning(bool running_) public onlyOwner{
        if(running_ == isRunning) return;
        _updateAllRewards();
        isRunning = running_;
        emit AdminUpdatedRunning(isRunning);
    }

    /*
        Start or stop staking logic by admin
        no update rewards
    */
    function adminSetRunningNoRewards(bool running_) public onlyOwner{
        if(running_ == isRunning) return;
        // _updateAllRewards();
        isRunning = running_;
        emit AdminUpdatedRunningNoRewards(isRunning);
    }

    /*
        Update Rewardings for split stakers
    */
    function adminUpdateRewards(uint256 offSet, uint256 size) external onlyOwner {
        require(offSet < stakerLength, "Update All Rewards: invalid offset.");
        require(size > 0 && offSet + size <= stakerLength, "Update All Rewards: invalid size.");
        for(uint256 i = offSet; i < offSet + size; i++){
            _updateRewards(stakers[i]);
        }
        emit AdminUpdatedRewards(offSet, size);
    }


    /*
        Get Total Rewards, Harvest, Completed Harvest
    */
    function adminTotalRewardAndHarvest() public view onlyOwner returns(uint256, uint256, uint256, uint256){
        uint256 totalAdding = _calculateTotalAddingRewards();
        return (_rewardCapacity, _totalRewards + totalAdding, _totalHarvest, _totalFee);
    }

    /* 
        Update APY
    params:
        - totalSupply: total amount of rewarding tokens
        - totalStakingPeriodDays: total time of staking for tokens by months
    */
    function adminUpdateAPY(uint256 totalSupply_, uint256 totalPeriods_) public onlyOwner{
        require(totalSupply_ >= 1e4 * (10 ** decimal), "Admin Update APY: Not Enough Supply Amount, bigger than 10K");
        require(totalPeriods_ > 0, "Contract Constructor: Not Enough Staking Period, bigger than 1 (months)");

        _updateAllRewards();
        totalSupply = totalSupply_;
        totalStakingPeriodDays = totalPeriods_;
        _updateRewardAmountPerSecond();

        emit AdminUpdatedAPY(totalSupply, totalStakingPeriodDays);
    }

    /* 
        Update APY
    params:
        - totalSupply: total amount of rewarding tokens
        - totalStakingPeriodDays: total time of staking for tokens by months
        no update rewards
    */
    function adminUpdateAPYNoRewards(uint256 totalSupply_, uint256 totalPeriods_) public onlyOwner{
        require(totalSupply_ >= 1e4 * (10 ** decimal), "Admin Update APY: Not Enough Supply Amount, bigger than 10K");
        require(totalPeriods_ > 0, "Contract Constructor: Not Enough Staking Period, bigger than 1 (months)");

        // _updateAllRewards();
        totalSupply = totalSupply_;
        totalStakingPeriodDays = totalPeriods_;
        _updateRewardAmountPerSecond();

        emit AdminUpdatedAPYNoRewards(totalSupply, totalStakingPeriodDays);
    }

    function adminUpdateHarvestFee(uint fee) public onlyOwner{
        harvestFee = fee;

        emit AdminUpdatedHarvestFee(fee);
    }

    function adminUpdateUnstakeFee1(uint fee) public onlyOwner{
        unstakeFee1 = fee;

        emit AdminUpdatedUnstakeFee1(fee);
    }

    function adminUpdateUnstakeFee2(uint fee) public onlyOwner{
        unstakeFee2 = fee;

        emit AdminUpdatedUnstakeFee2(fee);
    }

    function adminUpdateUnstakeFee3(uint fee) public onlyOwner{
        unstakeFee3 = fee;

        emit AdminUpdatedUnstakeFee3(fee);
    }

    function adminUpdateUnstakeFee4(uint fee) public onlyOwner{
        unstakeFee4 = fee;

        emit AdminUpdatedUnstakeFee4(fee);
    }

    function adminUpdateUnstakeFee5(uint fee) public onlyOwner{
        unstakeFee5 = fee;

        emit AdminUpdatedUnstakeFee5(fee);
    }

    function adminUpdateFeeAddress(address address_) public onlyOwner{
        require(address_ != address(0), "Admin Update Fee Address: Invalid address");

        feeAddress = address_;

        emit AdminUpdatedFeeAddress(address_);
    }
}