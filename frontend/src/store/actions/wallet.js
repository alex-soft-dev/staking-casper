import Web3 from 'web3';

import { CONNECT_WALLET, DISCONNECT_WALLET, SPINNER_SHOW, STAKE_VALUE, UNSTAKE_VALUE, TOAST_SHOW, 
    EXPORT_ALLSTAKES, GET_BALANCEOFREWARDS, GET_HISTORY, GET_UNSTAKEFEEPERCENT } from './actionType';

import cspdABI from '../../ABI/test/cspdABI.json';
import stakingABI from '../../ABI/test/stakingABIV2.json';

import { toWEI, MAIN_STAKING_ADDRESS_V2, MAIN_CSPD_ADDRESS, TEST_STAKING_ADDRESS_V2, TEST_CSPD_ADDRESS,
    BINANCE_TEST, BINANCE_BLOCKEXPLORER_TEST, CHAINID_TEST, BINANCE_MAIN, BINANCE_BLOCKEXPLORER_MAIN, CHAINID_MAIN, fromWEI, 
    moralisMainnetServerURL, moralisTestnetServerURL, moralisMainnetAppID, moralisTestnetAppID, testStartBlockNumber, mainStartBlockNumber } from '../../common/constants';
import { PRODUCTION_MODE } from '../../common/config';
import Moralis from 'moralis';

const STAKING_ADDRESS = PRODUCTION_MODE ? MAIN_STAKING_ADDRESS_V2 : TEST_STAKING_ADDRESS_V2;
const CSPD_ADDRESS = PRODUCTION_MODE ? MAIN_CSPD_ADDRESS : TEST_CSPD_ADDRESS;
const BINANCE_NET = PRODUCTION_MODE ? BINANCE_MAIN : BINANCE_TEST;
const BINANCE_EXPLORER = PRODUCTION_MODE ? BINANCE_BLOCKEXPLORER_MAIN : BINANCE_BLOCKEXPLORER_TEST;
const CHAINID = PRODUCTION_MODE ? CHAINID_MAIN : CHAINID_TEST;

const moralisChain = PRODUCTION_MODE ? "bsc" : "bsc testnet";
const serverUrl = PRODUCTION_MODE ? moralisMainnetServerURL : moralisTestnetServerURL;

const appId = PRODUCTION_MODE ? moralisMainnetAppID : moralisTestnetAppID;

const startBlockNumber = PRODUCTION_MODE ? mainStartBlockNumber : testStartBlockNumber;

export function spinnerShow(show = false, message = "") {
    return (dispatch) => {
        dispatch({
            type: SPINNER_SHOW,
            payload: {
                show: show,
                message: message,
            }
        });
    };
}

export function toastState(_toastShow = false, _toastType = "success", _toastMessage = "") {
    return (dispatch) => {
        dispatch({
            type: TOAST_SHOW,
            payload: {
                toastShow: _toastShow,
                toastType: _toastType,
                toastMessage: _toastMessage,
            }
        });
    };
}

function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }
  
  // Decimal floor
export const floor = (value, exp) => decimalAdjust('floor', value, exp);

export function connectWallet(flag) { // flag - true : connect wallet button click, otherwize refresh.
    return async (dispatch) => {
        if(window.ethereum === undefined || !window.ethereum.isMetaMask) {
            dispatch(disconnectWallet());
            dispatch(spinnerShow(true, "please install metamask..."));
            return false;
        }
        if(!flag)
            dispatch(spinnerShow(true, "updating Data..."));
        else
            dispatch(spinnerShow(true, "connecting Wallet..."));
        let web3Provider;
        if (window.ethereum) {
            web3Provider = window.ethereum;
            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
            } catch (error) {
                console.log("User denied account access");
                dispatch(spinnerShow(false));
                return false;
            }
        } else if (window.web3) {
            web3Provider = window.web3.currentProvider;
        } else {
            web3Provider = new Web3.providers.HttpProvider(BINANCE_NET);
        }
        const web3 = new Web3(web3Provider);
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: CHAINID }],
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{ chainId: CHAINID, chainName:"BSC Mainnet", nativeCurrency: {name: "BNB", symbol: "BNB", decimals: 18}, 
                                    rpcUrls: [BINANCE_NET], blockExplorerUrls: [BINANCE_EXPLORER]}],
                    });
                } catch (addError) {
                    // handle "add" error
                    dispatch(spinnerShow(false));
                }
            }
            else{
                dispatch(spinnerShow(false));
                return;
            }
            // handle other "switch" errors
        }

        let connectState = false;
        let connectBtnName = "";
        let account = "";
        let act = await web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                dispatch(spinnerShow(false));
                return null;
            }
            return accounts[0];
        });
        if (act != null) {
            connectState = true;
            account = act[0];
            connectBtnName = "Connected";
        }

        const cspdToken = new web3.eth.Contract(cspdABI, CSPD_ADDRESS);
        const stakeToken = new web3.eth.Contract(stakingABI, STAKING_ADDRESS);
        
        let userInfo = await stakeToken.methods
        .userInfo(account)
        .call({ from: account }, function (err, res) {
            if (err) {
                console.log("An error occured", err);
                dispatch(spinnerShow(false));
                return;
            }
            return res;
        });
        // console.log("userInfo: ", userInfo);
        

        // Stake in Total
        let balanceOfStakes = userInfo.amount;

        balanceOfStakes = floor(fromWEI(balanceOfStakes), -2);

        //Rewards
        let balanceOfRewards = await stakeToken.methods
        .getPending(account)
        .call({ from: account }, function (err, res) {
            if (err) {
            console.log("An error occured", err);
            dispatch(spinnerShow(false));
            return;
            }
            return res;
        });
        balanceOfRewards = floor(fromWEI(balanceOfRewards), -4);
        //Balance Wallet
        let balanceOfWallet = await cspdToken.methods
            .balanceOf(account)
            .call(function (err, res) {
                if (err) {
                    console.log("An error occured", err);
                    dispatch(spinnerShow(false));
                    return;
                }
                return res;
            });
        balanceOfWallet = fromWEI(balanceOfWallet).toFixed(2);
        
        // Get APY
        let adminAllStakes = await stakeToken.methods
            .totalStakedAmount()
            .call({ from: account }, function (err, res) {
                if (err) {
                console.log("An error occured", err);
                dispatch(spinnerShow(false));
                return;
                }
                return res;
            });
        adminAllStakes = floor(fromWEI(adminAllStakes), -2);

        let adminTotalSupply = 45 * 1000 * 1000;
        let apyValue = (adminAllStakes !== 0) ? (adminTotalSupply / adminAllStakes * 100).toFixed(2) : "-";
        apyValue = "APR " + apyValue + "%";

        let rewardsSecond = await stakeToken.methods
        .rewardPerBlock()
        .call({ from: account }, function (err, res) {
            if (err) {
            console.log("An error occured", err);
            dispatch(spinnerShow());
            return;
            }
            return res;
        });
        
        let stakePool = adminAllStakes !== 0 ? ((balanceOfStakes / adminAllStakes) * 100).toFixed(2) : 0;
        if(stakePool === "0.00") {
            stakePool = ((balanceOfStakes / adminAllStakes) * 100).toFixed(7);
        }

        let rewardsPerSecond = stakePool !== 0 ? (fromWEI(rewardsSecond) / 3.1 * Number(stakePool) / 100).toFixed(4) : 0;
        if(rewardsPerSecond === "0.0000") {
            rewardsPerSecond = fromWEI(rewardsSecond) / 3.1 * Number(stakePool) / 100;
        }
        
        // Moralis.start({ serverUrl, appId });
        // const act1 = account;
        // // const act1 = "0x84f437AE20f77d3E81fA352a5ffE546249517abD";
        // const options = { chain: moralisChain, address: act1, order: "desc", from_block: startBlockNumber};
        // const transactions = await Moralis.Web3API.account.getTransactions(options);
        
        // let lenTran = transactions.result.length;
        
        let filterTransactions = []
        // // for(let j = lenTran - 1; j >= 0; j--) {
        // for(let j = 0; j < lenTran; j++) {
        //     if(transactions.result[j].to_address === STAKING_ADDRESS.toLowerCase()) {
        //         filterTransactions.push(transactions.result[j]);
        //         console.log(transactions.result[j].block_number);
        //     }
        // }
        // console.log("transactions: ", filterTransactions);

        // await dispatch(getHistory(web3, account, filterTransactions, [], [], 0));

        await dispatch(getUnstakeFeePercent(stakeToken, account));

        dispatch(spinnerShow(false));

        dispatch({
            type: CONNECT_WALLET,
            payload: {
                web3: web3,
                account: account,
                connectState: connectState,
                connectBtnName: connectBtnName,
                stakeValue: Number(balanceOfStakes),
                rewardValue: Number(balanceOfRewards),
                cspdValue: Number(balanceOfWallet),
                apyValue: apyValue,
                stakePool: Number(stakePool),
                rewardsPerSecond: rewardsPerSecond,
                totalAmountStake: adminAllStakes,
                filterTransactions: filterTransactions
            }
        });
    };
}

export function disconnectWallet () {
    return (dispatch) => {
        dispatch({
            type: DISCONNECT_WALLET,
            payload: {
                web3: null,
                account: "",
                connectState: false,
                stakeValue: 0,
                rewardValue: 0,
                cspdValue: 0,
                apyValue: "APR -%",
                stakePool: 0,
                stakeHistory: [],
                harvestHistory: [],
                connectBtnName: "Connect Wallet",
                rewardsPerSecond: "",
                unstakingFee: "",
                totalAmountStake: 0,
                filterTransactions: []
            }
        })
    }
}

export function setStake(web3, account, amount = 0) {
    return async (dispatch) => {
        console.log("setStake: ", amount);

        const cspdToken = new web3.eth.Contract(cspdABI, CSPD_ADDRESS);

        const stakeToken = new web3.eth.Contract(stakingABI, STAKING_ADDRESS);

        let amountVal = toWEI(amount);
        dispatch(spinnerShow(true, "requesting Approval..."));
        let approve = await cspdToken.methods
        .approve(STAKING_ADDRESS, amountVal.toString(10))
        .send({ from: account }, function (err, res) {
            if (err) {
                console.log("An error occured", err);
                dispatch(spinnerShow());
                dispatch(toastState(true, "error", "Your stake request of " + amount +"CSPD was declined."));
                dispatch(toastState(false));
                return;
            }
            dispatch(spinnerShow(true, "processing Approval..."));
            return res;
        });
        console.log(approve);

        dispatch(spinnerShow(true, "requesting Stake..."));
        let stake = await stakeToken.methods
        .stake(amountVal.toString(10))
        .send({ from: account }, function (err, res) {
            if (err) {
                console.log("An error occured", err);
                dispatch(spinnerShow());
                dispatch(toastState(true, "error", "Your stake request of " + amount +"CSPD was declined."));
                dispatch(toastState(false));
                return;
            }
            
            dispatch(spinnerShow(true, "processing Transaction..."));
            return res;
        });
        
        var stakeTokenEvent = stakeToken.events.Stake();

        let event = await stakeTokenEvent.on({}, function (error, result) {
            if (!error) {
                return result;
            } 
            else {
                dispatch(spinnerShow(false));

            }
        });
        new Promise(function (resolve, reject) {
        if (event) {
            resolve("success");
        } else {
            reject("error");
        }
        }).then(
            (success) => {
                dispatch(connectWallet(false));
                dispatch(toastState(true, "success", "You have successfully staked " + amount +"CSPD."));
                dispatch(toastState(false));
            },
            (error) => {
                dispatch(spinnerShow(false));
                dispatch(toastState(true, "error", "Your stake request of " + amount +"CSPD was declined."));
                dispatch(toastState(false));
            }
        );

        console.log(stake);

        dispatch({
            type: STAKE_VALUE,
            payload: {
                
            }
        })
    };
}

export function setUnStake(web3, account, amount = 0) {
    return async (dispatch) => {
        console.log("setUnStake: ", amount);

        const stakeToken = new web3.eth.Contract(stakingABI, STAKING_ADDRESS);

        let amountVal = toWEI(amount);
        
        dispatch(spinnerShow(true, "requesting UnStake..."));
        
        await stakeToken.methods
        .unStake(amountVal.toString(10))
        .send({ from: account }, function (err, res) {
            if (err) {
                console.log("An error occured", err);
                dispatch(spinnerShow());
                dispatch(toastState(true, "error", "Your unstake request of " + amount +"CSPD was declined."));
                dispatch(toastState(false));
                return;
            }
            dispatch(spinnerShow(true, "processing Transaction..."));
            return res;
        });
        
        var stakeTokenEvent = stakeToken.events.UnStake();

        let event = await stakeTokenEvent.on({}, function (error, result) {
            if (!error) {
                return result;
            } 
            else {
                dispatch(spinnerShow(false));
            }
        });
        new Promise(function (resolve, reject) {
        if (event) {
            resolve("success");
        } else {
            reject("error");
        }
        }).then(
            (success) => {
                dispatch(connectWallet(false));
                dispatch(toastState(true, "success", "You have successfully unstaked " + amount +"CSPD."));
                dispatch(toastState(false));
            },
            (error) => {
                dispatch(spinnerShow(false));
                dispatch(toastState(true, "error", "Your unstake request of " + amount +"CSPD was declined."));
                dispatch(toastState(false));
            }
        );

        dispatch({
            type: UNSTAKE_VALUE,
            payload: {
                
            }
        })
    };
}

export function harvestRewards(web3, account, reStake=false) {
    return async (dispatch) => {
      console.log(reStake);
      const stakeToken = new web3.eth.Contract(stakingABI, STAKING_ADDRESS);
  
    //   let amountVal = toWEI(amount);
      dispatch(spinnerShow(true, "requesting Harvest..."));
  
      let harvest = await stakeToken.methods
        .harvest(reStake)
        .send({ from: account }, function (err, res) {
          if (err) {
            console.log("An error occured", err);
            dispatch(spinnerShow());
            dispatch(toastState(true, "error", "Your harvest request of CSPD was declined."));
            dispatch(toastState(false));
            return;
          }
          dispatch(spinnerShow(true, "processing Transaction..."));
          return res;
        })
        .then(() => {
          
        });
      console.log(harvest, stakeToken.events.Harvest);
  
      var stakeTokenEvent = stakeToken.events.Harvest();
  
      let event = await stakeTokenEvent.on({}, function (error, result) {
        if (!error) {
          return result;
        } else {
          dispatch(spinnerShow(false));
        }
      });
      new Promise(function (resolve, reject) {
        if (event) {
          resolve("success");
        } else {
          reject("error");
        }
      })
      .then(
        (success) => {
          dispatch(connectWallet(false));
          dispatch(toastState(true, "success", "You have successfully harvested CSPD."));
          dispatch(toastState(false));
        },
        (error) => {
            dispatch(toastState(true, "error", "Your harvest request of CSPD was declined."));
            dispatch(toastState(false));
        }
      );
    };
}

export function exportAllStakes() {
    return async (dispatch) => {
        let web3Provider;
        web3Provider = window.web3.currentProvider;
        const web3 = new Web3(web3Provider);
        let account;
        [account] = await web3.eth.getAccounts(function (error, accounts) {
            if (error) {
            dispatch(spinnerShow(false));
            return false;
            }
            return accounts[0];
        });
        const stakeToken = new web3.eth.Contract(stakingABI, STAKING_ADDRESS);

        let stakerLength = await stakeToken.methods
        .stakerLength()
        .call({ from: account }, function (err, res) {
            if (err) {
            console.log("An error occured", err);
            dispatch(spinnerShow(false));
            return;
            }
            return res;
        });
        stakerLength = Number(stakerLength);

        let allStakesInfo = [];
        let count = parseInt(stakerLength / 100 + 1);
        for(let i = 0; i < count; i++) {
            let size = stakerLength >= 100 ? 100 : stakerLength;
            let pieceStakesInfo = await stakeToken.methods
                .exportStakingInfos(100 * i, size)
                .call({ from: account }, function (err, res) {
                    if (err) {
                        console.log("An error occured", err);
                        return;
                    }
                    return res;
                });
            allStakesInfo = allStakesInfo.concat(pieceStakesInfo);
            stakerLength = stakerLength >= 100 ? stakerLength - 100 : stakerLength;
        }
        console.log("================AllStakesInfo================", allStakesInfo);
        // allStakesInfo = allStakesInfo[0];
        const cnt = allStakesInfo.length;
        let content = []
        for(let i = 0; i < cnt; i++) {
            for(let j = 0; j < allStakesInfo[i][0].length; j++)
            {
                var obj = {address: "", amount: 0};
                obj.address = allStakesInfo[i][0][j];
                obj.amount = allStakesInfo[i][1][j];
                content.push(obj)
            }
        }
        
        exportData(content);

        dispatch({
            type: EXPORT_ALLSTAKES,
            payload: {
            }
        })
    }
}

const exportData = (data) => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(data)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "allStakes.json";

    link.click();
    window.location.href = "/";
};

export const getBalanceOfRewards = (web3, account) => {
    return async (dispatch) => {
        const stakeToken = new web3.eth.Contract(stakingABI, STAKING_ADDRESS);
        let balanceOfRewards = await stakeToken.methods
            .getPending(account)
            .call({ from: account }, function (err, res) {
                if (err) {
                    console.log("An error occured", err);
                    dispatch(spinnerShow(false));
                    return;
                }
                return res;
            });
        
        balanceOfRewards = floor(fromWEI(balanceOfRewards), -4);

        dispatch({
            type: GET_BALANCEOFREWARDS,
            payload: {
                rewardValue: balanceOfRewards
            }
        })
    };
}

export const getHistory = (web3, account, filterTransactions, stakeHistory, harvestHistory, curCnt) => {
    return async (dispatch) => {
        console.log(account);
        const totalCnt = filterTransactions.length;
        if(totalCnt <= curCnt) {
            return;
        }
        const stakeToken = new web3.eth.Contract(stakingABI, STAKING_ADDRESS);
        let eventAry = [];
        for(let i = curCnt; i < (curCnt + 3 >= totalCnt ? totalCnt : curCnt + 3); i ++) {
            console.log("block num: ", filterTransactions[i].block_number);
            await stakeToken.getPastEvents('allEvents', {
                filter: {
                    user: account
                },
                fromBlock: filterTransactions[i].block_number,
                toBlock: filterTransactions[i].block_number,
            }, function (error, events) {
                console.log("error: ", error);
            }).then(function(events){
                console.log(events);
                if(events.length > 0) {
                    for(let j = 0; j < events.length; j ++){
                        if(events[j].returnValues.user === account){
                            let k = 0;
                            for(k = 0; k < eventAry.length; k ++){
                                if(eventAry[k].blockHash === events[j].blockHash){
                                    break;
                                }
                            }
                            if(k === eventAry.length){
                                eventAry.push(events[j]);
                            }
                        }
                    }
                }
            })
        }
        console.log("All Events: ", eventAry);
        
        for(let i = 0; i < eventAry.length; i++) {
            let el = eventAry[i];
            console.log("Current Index: ", curCnt + i);
            if(el.event === 'Stake' || el.event === 'UnStake') {
                let timestamp = new Date(filterTransactions[curCnt+i].block_timestamp) / 1000;
                el.timestamp = timestamp;
                stakeHistory = stakeHistory.concat(el);
            }
            else if(el.event === 'Harvest' || el.event === 'ReStake') {
                let timestamp = new Date(filterTransactions[curCnt+i].block_timestamp) / 1000;
                el.timestamp = timestamp;
                // el.percent = 0;
                harvestHistory = harvestHistory.concat(el);
            }
        }
        
        const curShowCnt = curCnt + 3;
        const moreState =  totalCnt > curShowCnt ? true : false;

        dispatch({
            type: GET_HISTORY,
            payload: {
                stakeHistory: stakeHistory,
                harvestHistory:  harvestHistory,
                // unstakingFee: unstakeFee,
                historyTotalCnt: totalCnt,
                curShowCnt: curShowCnt,
                moreState: moreState
            }
        })
    }
}

export const getUnstakeFeePercent = (stakeToken, account) => {
    return async(dispatch) =>{
        let feePercent = await stakeToken.methods
        .getUnStakeFeePercent(account)
        .call({ from: account }, function (err, res) {
          if (err) {
            console.log("An error occured", err);
            return;
          }
          return res;
        });
        feePercent = Number(feePercent);
        dispatch({
            type: GET_UNSTAKEFEEPERCENT,
            payload: {
                unstakingFee: feePercent
            }
        })
    }
}