import Logo from '../assets/img/header/logo.svg';
import { useEffect, useState } from 'react';
import { connect, useDispatch } from "react-redux";
import { connectWallet, disconnectWallet, setUnStake, spinnerShow, toastState, floor } from "../store/actions/wallet";
import Web3 from 'web3';

import testStakingABIV0 from '../ABI/test/stakingABIV0.json';
import mainStakingABIV0 from '../ABI/main/stakingABIV0.json';
import stakingV1ABI from '../ABI/test/stakingABIV1.json';
import stakingV2ABI from '../ABI/test/stakingABIV2.json';
import cspdABI from '../ABI/test/cspdABI.json';

import { TEST_STAKING_ADDRESS_V0, MAIN_STAKING_ADDRESS_V0, MAIN_STAKING_ADDRESS_V1, TEST_STAKING_ADDRESS_V1, MAIN_STAKING_ADDRESS_V2, TEST_STAKING_ADDRESS_V2,
        MAIN_CSPD_ADDRESS, TEST_CSPD_ADDRESS, fromWEI, toWEI } from '../common/constants';
import { PRODUCTION_MODE } from '../common/config';

const stakingV0ABI = PRODUCTION_MODE ? mainStakingABIV0 : testStakingABIV0;

const STAKING_ADDRESS_V0 = PRODUCTION_MODE ? MAIN_STAKING_ADDRESS_V0 : TEST_STAKING_ADDRESS_V0;

const STAKING_ADDRESS_V1 = PRODUCTION_MODE ? MAIN_STAKING_ADDRESS_V1 : TEST_STAKING_ADDRESS_V1;

const STAKING_ADDRESS_V2 = PRODUCTION_MODE ? MAIN_STAKING_ADDRESS_V2 : TEST_STAKING_ADDRESS_V2;

const CSPD_ADDRESS = PRODUCTION_MODE ? MAIN_CSPD_ADDRESS : TEST_CSPD_ADDRESS;


function Header (props) {

    const dispatch = useDispatch();
    const [balStakesV0, setBalStakesV0] = useState("")
    const [balRewardsV0, setBalRewardsV0] = useState("");

    const [balStakesV1, setBalStakesV1] = useState("")
    const [balRewardsV1, setBalRewardsV1] = useState("");
    
    const getPrevContractInfo = async () => {
        let web3Provider;
        web3Provider = window.ethereum;
        const web3 = new Web3(web3Provider);
        let account;
        [account] = await web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                return false;
            }
            return accounts[0];
        });
        const stakeTokenV0 = new web3.eth.Contract(stakingV0ABI, STAKING_ADDRESS_V0);

        let balanceOfStakes = await stakeTokenV0.methods
        .balanceOfStakes()
        .call({ from: account }, function (err, res) {
            if (err) {
                console.log("An error occured", err);
                dispatch(spinnerShow(false));
                return;
            }
            return res;
        });
        setBalStakesV0(fromWEI(balanceOfStakes));

        //Rewards
        // let balanceOfRewards = await stakeTokenV0.methods
        // .balanceOfRewards()
        // .call({ from: account }, function (err, res) {
        //     if (err) {
        //         console.log("An error occured", err);
        //         return;
        //     }
        //     return res;
        // });
        // setBalRewardsV0(floor(fromWEI(balanceOfRewards), -4));
        setBalRewardsV0(0);

        // V1
        const stakeTokenV1 = new web3.eth.Contract(stakingV1ABI, STAKING_ADDRESS_V1);

        balanceOfStakes = await stakeTokenV1.methods
        .balanceOfStakes()
        .call({ from: account }, function (err, res) {
            if (err) {
                console.log("An error occured", err);
                dispatch(spinnerShow(false));
                return;
            }
            return res;
        });
        setBalStakesV1(fromWEI(balanceOfStakes));

        //Rewards
        let balanceOfRewards = await stakeTokenV1.methods
        .balanceOfRewards()
        .call({ from: account }, function (err, res) {
            if (err) {
                console.log("An error occured", err);
                return;
            }
            return res;
        });
        setBalRewardsV1(floor(fromWEI(balanceOfRewards), -4));
        // setBalRewardsV1(0);
    }

    const onClickMigrate = async () => {
        //Unstake
        console.log("setUnStake: ", balStakesV0);

        const stakeTokenV0 = new props.web3.eth.Contract(stakingV0ABI, STAKING_ADDRESS_V0);

        let amountVal = toWEI(balStakesV0);
        // amountVal = toWEI("10");
        if(amountVal > 0) {
            dispatch(spinnerShow(true, "requesting UnStake to Previous Contract..."));
            
            await stakeTokenV0.methods
            .unstake(amountVal.toString(10))
            .send({ from: props.account }, function (err, res) {
                if (err) {
                    console.log("An error occured", err);
                    dispatch(spinnerShow());
                    dispatch(toastState(true, "error", "Your unstake request of " + fromWEI(amountVal) +"CSPD was declined from Previous Contract."));
                    dispatch(toastState(false));
                    return;
                }
                dispatch(spinnerShow(true, "processing Transaction from Previous Contract..."));
                return res;
            });
                
            var stakeTokenV0Event = stakeTokenV0.events.UnStaked();

            let event = await stakeTokenV0Event.on({}, function (error, result) {
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
                    dispatch(spinnerShow(true, "Finish UnStake from Previous Contract..."));
                    dispatch(toastState(true, "success", "You have successfully unstaked " + fromWEI(amountVal) +"CSPD from Previous Contract."));
                    dispatch(toastState(false));
                },
                (error) => {
                    dispatch(spinnerShow(false));
                    dispatch(toastState(true, "error", "Your unstake request of " + fromWEI(amountVal) +"CSPD was declined from Previous Contract."));
                    dispatch(toastState(false));
                    return;
                }
            );
        }

        //harvest
        amountVal = toWEI(balRewardsV0);
        // amountVal = toWEI("10");
        if(amountVal > 0) {
            dispatch(spinnerShow(true, "requesting Harvest to Previous Contract..."));
        
            let harvest = await stakeTokenV0.methods
                .harvest(amountVal.toString(10))
                .send({ from: props.account }, function (err, res) {
                if (err) {
                    console.log("An error occured", err);
                    dispatch(spinnerShow());
                    dispatch(toastState(true, "error", "Your harvest request of " + fromWEI(amountVal) +"CSPD was declined from Previous Contract."));
                    dispatch(toastState(false));
                    return;
                }
                dispatch(spinnerShow(true, "processing Transaction from Previous Contract..."));
                return res;
                })
                .then(() => {
                
                });
            console.log(harvest, stakeTokenV0.events.Harvest);
        
            stakeTokenV0Event = stakeTokenV0.events.Harvest();
        
            let event = await stakeTokenV0Event.on({}, function (error, result) {
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
            }).then(
                (success) => {
                    dispatch(spinnerShow(true, "Finish Harvest from Previous Contract..."));
                    dispatch(toastState(true, "success", "You have successfully harvested " + fromWEI(amountVal) +"CSPD from Previous Contract."));
                    dispatch(toastState(false));
                },
                (error) => {
                    dispatch(toastState(true, "error", "Your harvest request of " + fromWEI(amountVal) +"CSPD was declined from Previous Contract."));
                    dispatch(toastState(false));
                    return;
                }
            );
        }

        //V1
        const stakeTokenV1 = new props.web3.eth.Contract(stakingV1ABI, STAKING_ADDRESS_V1);
        amountVal = toWEI(balStakesV1);
        // amountVal = toWEI("10");
        if(amountVal > 0) {
            dispatch(spinnerShow(true, "requesting UnStake to Previous Contract..."));
            
            await stakeTokenV1.methods
            .unstake(amountVal.toString(10))
            .send({ from: props.account }, function (err, res) {
                if (err) {
                    console.log("An error occured", err);
                    dispatch(spinnerShow());
                    dispatch(toastState(true, "error", "Your unstake request of " + fromWEI(amountVal) +"CSPD was declined from Previous Contract."));
                    dispatch(toastState(false));
                    return;
                }
                dispatch(spinnerShow(true, "processing Transaction from Previous Contract..."));
                return res;
            });
                
            var stakeTokenV1Event = stakeTokenV1.events.UnStaked();

            let event = await stakeTokenV1Event.on({}, function (error, result) {
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
                    dispatch(spinnerShow(true, "Finish UnStake from Previous Contract..."));
                    dispatch(toastState(true, "success", "You have successfully unstaked " + fromWEI(amountVal) +"CSPD from Previous Contract."));
                    dispatch(toastState(false));
                },
                (error) => {
                    dispatch(spinnerShow(false));
                    dispatch(toastState(true, "error", "Your unstake request of " + fromWEI(amountVal) +"CSPD was declined from Previous Contract."));
                    dispatch(toastState(false));
                    return;
                }
            );
        }

        //harvest
        amountVal = toWEI(balRewardsV1);
        // amountVal = toWEI("10");
        if(amountVal > 0) {
            dispatch(spinnerShow(true, "requesting Harvest to Previous Contract..."));
        
            let harvest = await stakeTokenV1.methods
                .harvest(amountVal.toString(10))
                .send({ from: props.account }, function (err, res) {
                if (err) {
                    console.log("An error occured", err);
                    dispatch(spinnerShow());
                    dispatch(toastState(true, "error", "Your harvest request of " + fromWEI(amountVal) +"CSPD was declined from Previous Contract."));
                    dispatch(toastState(false));
                    return;
                }
                dispatch(spinnerShow(true, "processing Transaction from Previous Contract..."));
                return res;
                })
                .then(() => {
                
                });
            console.log(harvest, stakeTokenV1.events.Harvest);
        
            stakeTokenV1Event = stakeTokenV1.events.Harvest();
        
            let event = await stakeTokenV1Event.on({}, function (error, result) {
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
            }).then(
                (success) => {
                    dispatch(spinnerShow(true, "Finish Harvest from Previous Contract..."));
                    dispatch(toastState(true, "success", "You have successfully harvested " + fromWEI(amountVal) +"CSPD from Previous Contract."));
                    dispatch(toastState(false));
                },
                (error) => {
                    dispatch(toastState(true, "error", "Your harvest request of " + fromWEI(amountVal) +"CSPD was declined from Previous Contract."));
                    dispatch(toastState(false));
                    return;
                }
            );
        }
        //stake
        const cspdToken = new props.web3.eth.Contract(cspdABI, CSPD_ADDRESS);

        const stakeTokenV2 = new props.web3.eth.Contract(stakingV2ABI, STAKING_ADDRESS_V2);

        amountVal = Number(balStakesV0) + Number(balStakesV1)/* + Number(balRewards)*/;
        // amountVal = 20;
        if(amountVal > 0) {
            amountVal = toWEI(amountVal + "");
            // amountVal = "2"

            dispatch(spinnerShow(true, "requesting Approval..."));
            let approve = await cspdToken.methods
            .approve(STAKING_ADDRESS_V2, amountVal.toString(10))
            .send({ from: props.account }, function (err, res) {
                if (err) {
                    console.log("An error occured", err);
                    dispatch(spinnerShow());
                    dispatch(toastState(true, "error", "Your stake request of " + fromWEI(amountVal) +"CSPD was declined."));
                    dispatch(toastState(false));
                    return;
                }
                dispatch(spinnerShow(true, "processing Approval..."));
                return res;
            });
            console.log(approve);

            dispatch(spinnerShow(true, "requesting Stake..."));
            await stakeTokenV2.methods
            .stake(amountVal.toString(10))
            .send({ from: props.account }, function (err, res) {
                if (err) {
                    console.log("An error occured", err);
                    dispatch(spinnerShow());
                    dispatch(toastState(true, "error", "Your stake request of " + fromWEI(amountVal) +"CSPD was declined."));
                    dispatch(toastState(false));
                    return;
                }
                
                dispatch(spinnerShow(true, "processing Transaction..."));
                return res;
            });
        }
        let stakeTokenEvent = stakeTokenV2.events.Stake();

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
                if(amountVal > 0) {
                    getPrevContractInfo();
                    dispatch(connectWallet(false));
                    dispatch(toastState(true, "success", "You have successfully staked " + fromWEI(amountVal) +"CSPD."));
                    dispatch(toastState(false));
                }
                else {
                    dispatch(toastState(true, "error", "You have no stakes in previous pools."));
                    dispatch(toastState(false));
                    return;
                }
            },
            (error) => {
                dispatch(spinnerShow(false));
                dispatch(toastState(true, "error", "Your stake request of " + fromWEI(amountVal) +"CSPD was declined."));
                dispatch(toastState(false));
                return;
            }
        );
    }

    useEffect(()=>{
        if(props.connectState) {
            getPrevContractInfo();
        }
    })
    return(
        <div className='header my-4'>
            {props.data?
                <div className="container">
                    <div className="row fw-nw">
                        <div className="col-md-2 col-sm-2 logo f-i-center">
                            <a target="_blank" href="https://casper-pad.io" className='header-logo' rel="noreferrer">
                                <img className='logo-image' src={Logo} alt='' />
                                <span className="ms-2 fw-bold logo-text">{props.data.logo.title}</span>
                            </a>
                        </div>
                        {/* <div className='col-md-3 col-sm-3 f-i-center st-form'>
                            <form action="#" className='d-flex h-1'>
                                <input type="text" className="input c-w-1 brl-25 b-b-3 st-amount" placeholder="Add stake amount" />
                                <button type="submit" className='b-p-1 c-w-1 br-half st-add'><i className="bi bi-plus-circle"></i></button>
                            </form>
                        </div> */}
                        
                        {props.connectState &&
                         <div className='col-md-7 col-sm-3 prev-info'>
                            {/* <table className="table table-dark" style={{textAlign: "center"}}>
                                <thead>
                                    <tr>
                                        <th scope="col">Pool Info</th>
                                        <th scope="col">Stake($CSPD)</th>
                                        <th scope="col">Rewards($CSPD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td scope="row">V0</td>
                                        <td>{balStakesV0}</td>
                                        <td>{balRewardsV0}</td>
                                    </tr>
                                    <tr>
                                        <td scope="row">V1</td>
                                        <td>{balStakesV1}</td>
                                        <td>{balRewardsV1}</td>
                                    </tr>
                                </tbody>
                            </table> */}
                            <div className='info-inner p-1'>
                                <div className='mx-1 alg-m'>
                                    <div className='c-gr-1'>Previous Pools Info</div>
                                </div>
                                <div className='mx-2'>
                                    <div className='item'>&nbsp;&nbsp;&nbsp;&nbsp;Stakes: <span className='mx-2 c-gr-1'>{balStakesV0+balStakesV1}</span>$CSPD</div>
                                    <div className='item'>Rewards: <span className='mx-2 c-gr-1'>{balRewardsV1}</span>$CSPD</div>
                                </div>
                                <div className='mx-1 alg-m'>
                                    <button className='migrate p-2 c-w-1' onClick={() => {onClickMigrate();}} type="button">Migrate</button>
                                </div>
                            </div>
                            {/* <div className='info-inner p-1'>
                                <div className='mx-1 alg-m'>
                                    <div className='c-gr-1'>&nbsp;V1 Pool Info</div>
                                </div>
                                <div className='mx-2'>
                                    <div className='item'>&nbsp;&nbsp;&nbsp;&nbsp;Stakes: <span className='mx-2 c-gr-1'>{balStakesV1}</span>$CSPD</div>
                                    <div className='item'>Rewards: <span className='mx-2 c-gr-1'>{balRewardsV1}</span>$CSPD</div>
                                </div>
                                <div className='mx-1 alg-m'>
                                    <button className='migrate p-2 c-w-1' onClick={() => {onClickMigrate();}} type="button">Migrate</button>
                                </div>
                            </div> */}
                        </div>}

                        <div className='col-md-3 col-sm-3 ms-auto f-i-center st-actions'>
                            {/* <button className="btn">
                                <i className="bi bi-bell-fill"></i>
                            </button> */}

                            <button className="ms-2 connect-btn c-w-1 show-connect" 
                                onClick={ () => { 
                                    props.connectState ? dispatch(disconnectWallet()) : dispatch(connectWallet(true))
                                }}>
                                {props.connectState ? <i className="c-gr-1 bi bi-circle-fill me-1 br-half"></i> : <></>}{props.connectBtnName}
                            </button>
                            {/* <button className="ms-2 btn c-w-1 show-connect" onClick={ () => { setShowConnect(!showConnect); }}>
                                <i className="bi bi-wallet-fill"></i>
                                <span className='mx-2'>Connected</span>
                                <i className="bi bi-chevron-down"></i>
                                {showConnect ?
                                    <div className='connect-state px-3 br-8 fs-17'>
                                        <div className='fs-10 my-1 alert-circle'>
                                            <i className="c-gr-1 bi bi-circle-fill me-1 br-half"></i> 
                                            Connected
                                        </div>
                                        <div className='b-b-3 p-2 br-8 c-pp-1 my-2'>
                                            Logout
                                            <i className="ms-3 bi bi-door-closed me-1 br-half"></i> 
                                        </div>
                                    </div>
                                : ''}
                            </button> */}
                        </div>                  
                        
                    </div>
                    {props.connectState && 
                    <div className='col-md-7 col-sm-3 prev-info-mobile py-2'>
                        {/* <table className="table table-dark" style={{textAlign: "center"}}>
                            <thead>
                                <tr>
                                    <th scope="col">Pool Info</th>
                                    <th scope="col">Stake($CSPD)</th>
                                    <th scope="col">Rewards($CSPD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td scope="row">V0</td>
                                    <td>{balStakesV0}</td>
                                    <td>{balRewardsV0}</td>
                                </tr>
                                <tr>
                                    <td scope="row">V1</td>
                                    <td>{balStakesV1}</td>
                                    <td>{balRewardsV1}</td>
                                </tr>
                            </tbody>
                        </table> */}
                        <div className='info-inner pt-2 pb-3 px-2'>
                            <div className='mx-1 alg-m'>
                                <div className='c-gr-1'>Previous Pools Info</div>
                            </div>
                            <div className='show-value'>
                                <div className='inner-show'>
                                    <div className='mx-2'>
                                        <div className='item'>&nbsp;&nbsp;&nbsp;&nbsp;Stakes: <span className='mx-2 c-gr-1'>{balStakesV0+balStakesV1}</span>$CSPD</div>
                                        <div className='item'>Rewards: <span className='mx-2 c-gr-1'>{balRewardsV1}</span>$CSPD</div>
                                    </div>
                                    <div className='mx-1 alg-m'>
                                        <button className='migrate p-2 c-w-1' onClick={() => {onClickMigrate();}} type="button">Migrate</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}
                    {/* <div className='st-form-mobile'>
                        <form action="#" className='d-flex h-1 row fw-nw'>
                            <input type="text" className="input c-w-1 brl-25 b-b-3 st-amount" placeholder="Add stake amount" />
                            <button type="submit" className='b-p-1 c-w-1 br-half st-add'><i className="bi bi-plus-circle"></i></button>
                        </form>
                    </div> */}
                </div>
            : 'Loading ... ' }
        </div>
    )
}

const mapStateToProps = (state) =>{
    state = state.simple;
    return { ...state }
}
  
const mapDispatchToProps = () => {
    return {
      connectWallet: connectWallet,
      disconnectWallet: disconnectWallet,
      spinnerShow: spinnerShow,
      setUnStake: setUnStake,
      toastState: toastState
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);