import { CONNECT_WALLET, DISCONNECT_WALLET, GET_BALANCEOFREWARDS, GET_HISTORY, SPINNER_SHOW, TOAST_SHOW, GET_UNSTAKEFEEPERCENT } from '../actions/actionType';

const initialState = {
    web3: null,
    account: "",
    stakeValue: 0,
    rewardValue: 0,
    cspdValue: 0,
    apyValue: "APR -%",
    connectState: false,
    connectBtnName: "Connect Wallet",
    stakeHistory: [],
    harvestHistory: [],
    stakePool: 0,
    show: false,
    message: "",
    rewardsPerSecond: "",
    toastShow: false,
    toastType: "success",
    toastMessage: "",
    unstakingFee: "-",
    totalAmountStake: 0,
    historyTotalCnt: 0,
    curShowCnt: 0,
    moreState: false,
    filterTransactions: []
}

const simpleReducer = (state = initialState, action) => {
    switch(action.type) {
        case CONNECT_WALLET:
            return {
                ...state,
                account: action.payload.account,
                stakeValue: action.payload.stakeValue,
                rewardValue: action.payload.rewardValue,
                cspdValue: action.payload.cspdValue,
                connectState: action.payload.connectState,
                connectBtnName: action.payload.connectBtnName,                
                // stakeHistory: action.payload.stakeHistory,
                // harvestHistory: action.payload.harvestHistory,
                apyValue: action.payload.apyValue,
                stakePool: action.payload.stakePool,
                web3: action.payload.web3,
                rewardsPerSecond: action.payload.rewardsPerSecond,
                // unstakingFee: action.payload.unstakingFee,
                totalAmountStake: action.payload.totalAmountStake,
                filterTransactions: action.payload.filterTransactions
            }
        case DISCONNECT_WALLET:
            return {
                ...state,
                web3: action.payload.web3,
                account: action.payload.account,
                connectState: action.payload.connectState,
                stakeValue: action.payload.stakeValue,
                rewardValue: action.payload.rewardValue,
                cspdValue: action.payload.cspdValue,
                stakeHistory: action.payload.stakeHistory,
                harvestHistory: action.payload.harvestHistory,
                apyValue: action.payload.apyValue,
                stakePool: action.payload.stakePool,
                connectBtnName: action.payload.connectBtnName,
                rewardsPerSecond: action.payload.rewardsPerSecond,
                totalAmountStake: action.payload.totalAmountStake,
                filterTransactions: action.payload.filterTransactions
            }
        case TOAST_SHOW:
            return {
                ...state,
                toastShow: action.payload.toastShow,
                toastType: action.payload.toastType,
                toastMessage: action.payload.toastMessage,
            }
        case SPINNER_SHOW:
            return {
                ...state,
                show: action.payload.show,
                message: action.payload.message
            }
        case GET_BALANCEOFREWARDS:
            return {
                ...state,
                rewardValue: action.payload.rewardValue
            }
        case GET_HISTORY:
            return {
                ...state,
                stakeHistory: action.payload.stakeHistory,
                harvestHistory: action.payload.harvestHistory,
                // unstakingFee: action.payload.unstakingFee,
                historyTotalCnt: action.payload.historyTotalCnt,
                curShowCnt: action.payload.curShowCnt,
                moreState: action.payload.moreState,
            }
        case GET_UNSTAKEFEEPERCENT:
            return {
                ...state,
                unstakingFee: action.payload.unstakingFee
            }
        default:
            return state;
    }
}

export default simpleReducer;