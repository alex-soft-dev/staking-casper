
import { useState, useEffect } from "react";
import toast, { Toaster } from 'react-hot-toast';
import Modal from "./modal";
import ModalHav from "./modal-harvest";
import { connect, useDispatch } from "react-redux";
import { getBalanceOfRewards, harvestRewards } from "../store/actions/wallet";

function Intro(props) {

    const [showModal, setShowModal] = useState(false);
    const [tab, setTab] = useState("");

    const [showHavModal, setShowHavModal] = useState(false);
    const [tabHav, setTabHav] = useState("");

    useEffect(() => {
        if(props.toastShow) {
            if(props.toastType === "success") {
                toast.success(props.toastMessage);
            }
            else {
                toast.error(props.toastMessage);
            }
        }
        const interval = setInterval(() => {
            if(props.web3 != null ) {
                dispatch(getBalanceOfRewards(props.web3, props.account));
            }
        }, 5000);
        return () => clearInterval(interval);
    })

    const shortAddress = (address) => {
        const startStr = address.slice(0, 10);
        const lastStr = address.slice(address.length - 8, address.length);
        return (startStr + "..." + lastStr);
    }
    
    const dispatch = useDispatch();
    return (
        <>
            <div><Toaster toastOptions={{className : 'm-toaster', duration : 3000, style : { fontSize: '12px' }}}/></div>

            <Modal className='stake-modal' showModal={showModal} setShowModal={setShowModal} tab={tab} setTab={setTab}/>

            <ModalHav className='harvest-modal' showModal={showHavModal} setShowModal={setShowHavModal} tab={tabHav} setTab={setTabHav}/>

            <div className="intro my-4">
                <div className="container">
                    <div className="row h-100">
                        <div className="col-md-8 welcome">
                            <div className="p-4 b-b-2 br-8 welcome-inner">
                                <div className="row top my-2">
                                    <div className="col-md-4">
                                        <h5 className="title">Hello, Welcome to CasperPad!</h5>
                                        <span className="desc">New to the staking platform? <a className="text-primary" href="https://casperpad.gitbook.io/staking-guide/" target="_blank" rel="noreferrer">Check Guide</a></span>
                                    </div>
                                    <div className="col-md-4 d-flex my-3">
                                        <div>Total Staked:<span className="mx-2 c-gr-1">{props.connectState ? props.totalAmountStake : "-"}</span>$CSPD</div>
                                    </div>
                                    <div className="col-md-4 d-flex flex-column">
                                        <button className="btn b-b-3 br-8 mt-3 align-self-end apy-web">
                                            <i className="bi bi-question-circle"></i><span className='mx-2'>{props.apyValue}</span>
                                        </button>
                                        <button className="btn b-b-3 br-8 align-self-start apy-mobile">
                                            <i className="bi bi-question-circle"></i><span className='mx-2'>{props.apyValue}</span>
                                        </button>
                                    </div>
                                </div>


                                <div className="row down">
                                    <div className="col-md-6 first">
                                        <div className="p-4 b-b-3 br-8 d-flex flex-column panel">
                                            <h5 className="title">Stakes in total <i className="bi bi-question-circle"></i></h5>
                                            <div className="mt-2">
                                                <p className="f-i-center">
                                                    <span className="price me-2 fw-bold">{props.connectState ? props.stakeValue : "-"}</span> <span className="unit c-g-1">$CSPD</span>
                                                </p>
                                            </div>
                                            
                                            <div className="actions d-flex mt-auto">
                                                <button onClick={() => {
                                                    if(!props.connectState) {
                                                        toast.success("Please connect Wallet first!");
                                                        return;
                                                    }
                                                    setTab("stake"); setShowModal(true); }} className="btn b-p-1 br-8 flex-fill btn-st">Stake</button>
                                                <button onClick={() => {
                                                    if(!props.connectState) {
                                                        toast.success("Please connect Wallet first!");
                                                        return;
                                                    }
                                                    setTab("unstake"); setShowModal(true);}} className="btn b-t-1 c-p-1 btn-unst">Unstake</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="p-4 b-b-3 br-8 d-flex flex-column panel">
                                            <h5 className="title">Rewards <i className="bi bi-question-circle"></i></h5>
                                            <div className="mt-2">
                                                <p className="f-i-center">
                                                    <span className="price me-2 fw-bold">{props.connectState ? props.rewardValue : "-"}</span> <span className="unit c-g-1">$CSPD</span>
                                                </p>
                                                {
                                                props.connectState ? 
                                                    <h6 className="per">(+{props.rewardsPerSecond} CSPD/sec)</h6>                                       
                                                    :
                                                    <></>
                                                }
                                            </div>
                                            
                                            <div className="actions d-flex mt-auto">
                                                <button className="btn b-y-1 br-8 flex-fill"
                                                    onClick={() => {
                                                        if(!props.connectState) {
                                                            toast.success("Please connect Wallet first!");
                                                            return;
                                                        }
                                                        setTabHav("restake"); setShowHavModal(true);
                                                        // dispatch(harvestRewards(props.web3, props.account, props.rewardValue));
                                                    }}
                                                >
                                                    <span className="c-y-1"> Harvest Reward <i className="bi bi-arrow-up-right ms-2"></i></span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4  buy-panel d-flex flex-column">
                            <div className="br-8 px-3 d-flex panel-inner h-100">
                                <div className="row p-2 b-b-2 panel-up">
                                    <h5 className="title mt-3">Wallet Balance <i className="bi bi-question-circle c-g-1 fw-bold"></i></h5>
                                    <div className="mt-3">
                                        <h1 className="price fw-bold">{props.connectState ? props.cspdValue : "-"}</h1> 
                                        <h6 className="unit c-g-1">$CSPD</h6>
                                    </div>
                                </div>

                                <div className="row b-b-4">
                                    <div className="p-3 pe-5">
                                        <h5 className="fs-6 c-g-1">Your wallet address</h5>
                                        <div className="b-t-1 bd-g-1 br-8 c-w-1 d-flex">
                                            <button className="btn b-b-3 br-8 w-btn">
                                                <i className="bi bi-wallet2"></i>
                                                {/* <img src={walletIcon} alt="walletIcon" /> */}
                                            </button>
                                            <input className="input b-t-1 c-g-1 w-addr" placeholder="0x27h236D...1tyujkk937" value={shortAddress(props.account)} readOnly/>
                                        </div>
                                    </div>
                                </div>

                                <div className="row flex-fill">
                                    <a className="brb-8 b-g-1 c-w-1 py-3 buy-btn" target="_blank" rel="noreferrer"
                                        href="https://pancakeswap.finance/swap?outputCurrency=0xef9481115ff33e94d3e28a52d3a8f642bf3521e5">
                                            <span>Buy $CSPD</span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

const mapStateToProps = (state) =>{
    state = state.simple;
    return { ...state }
}

const mapDispatchToProps = () => {
    return {
      harvestRewards: harvestRewards,
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Intro);