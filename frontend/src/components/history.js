import StakingImg from '../assets/img/history/Staking.svg';
import ChartStaking from './chart-staking';
import ChartBalance from './chart-balance';
import { fromWEI } from '../common/constants';
import { connect, useDispatch } from "react-redux";
import { useEffect, useState } from 'react';
import { getHistory } from "../store/actions/wallet";

const ListItem = ({sort, id, date, amount, percent, dateHead}) => {
    return (
    <>
        <div className="list history-web">
            <div className='head' >{dateHead}</div>
            <div className="row list-item mt-2">
                <div className="col-md-4">
                    <div className='p-2 d-flex'>
                        <img className='hl-img' src={StakingImg} width={48} height={48} alt="stakeImg"/>
                        <div className='ms-3'>
                            <h5>{id < 10 ? "0" + id : id}</h5>
                            <h6 className='c-g-1 fs-12'>{date}</h6>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 f-i-center mb-2">
                    <div className='p-2 b-p-2 c-p-1 br-8 fs-14'>
                        <i className="bi bi-square-fill me-1"></i> {sort}
                    </div>
                </div>
                <div className="col-md-3 f-j-center">
                    <h5>{percent}</h5>
                    <h6 className='c-g-1 fs-12'>Percent (%)</h6>
                </div>
                <div className="col-md-3 f-j-center">
                    <h5>{amount}</h5>
                    <h6 className='c-g-1 fs-12'>CSPD</h6>
                </div>
            </div>
        </div>
        <div className="list history-mobile">
            <div className='head'>{dateHead}</div>
            <div className="row list-item mt-2 fw-nw">
                <div className="col-md-4 part1">
                    <div className='px-2 d-flex'>
                        <div className='pt-1'><img className='hl-img' src={StakingImg} width={20} height={20} alt="stakeImg" /></div>
                        <div className='ms-1 ps-2'>
                            <div className='fs-14'>{id < 10 ? "0" + id : id}</div>
                            <div className='c-g-1 fs-8'>{date}</div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 f-i-center part2">
                    <h5>{percent}</h5>
                    <h6 className='ms-2 c-g-1 fs-12'>%</h6>
                </div>
                <div className="col-md-4 part3">
                    <div className="f-i-center">
                        <div className='fs-14'>{amount}</div>
                        <div className='ms-2 fs-10'>CSPD</div>
                    </div>
                    <div className="f-i-center mb-2">
                        <div className='c-p-1 br-8 fs-10'>
                            <i className="bi bi-square-fill me-1"></i> <span className='c-g-1'>{sort}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
    )
}

const DetailTag = ({className, tag}) => {
    return (
        <div className={className}>
            <div className='p-1 br-8'>
                <i className="bi bi-square-fill me-1"></i> 
                <span>{tag}</span>
            </div>
        </div>
    )
}

function History(props) {
    const dispatch = useDispatch();
    const get_history = (history, sort = "stake") => {
        const array_history = Object.values(history);
        if (array_history.length === 0) {
          return (
            <div className='row list-item mt-2'>
              <div>History not available.</div>
            </div>
          );
        } else {
            array_history.sort(function(x, y){
                return x.timestamp - y.timestamp;
            })
          let date = [];
          let headDate = [];
          let length = array_history.length - 1;
          array_history.map((value, index) => {
            let d = new Date(array_history[index].timestamp * 1000);
            date.push(d.toLocaleString());
            headDate.push(d.toLocaleDateString());
          });
          
          return array_history.map((value, index, history_array) => {
            let amount = fromWEI(array_history[length - index].returnValues.amount).toFixed(2);
            // sort = (sort !== "Harvest" ? (array_history[length-index].event === 'Stake' ? "Stake" : "Unstake") : "Harvest");
            sort = array_history[length-index].event;
            let percentFee = 0;
            if(sort === "UnStake") {
                percentFee = Number(Number(array_history[length - index].returnValues.unStakeFee) * 100 / (Number(array_history[length - index].returnValues.unStakeFee) + Number(array_history[length - index].returnValues.amount))).toFixed(0);
            }
            else if(sort === "Harvest") {
                percentFee = Number(Number(array_history[length - index].returnValues.harvestFee) * 100 / (Number(array_history[length - index].returnValues.harvestFee) + Number(array_history[length - index].returnValues.amount))).toFixed(0);
            }
            // percentFee = fromWEI(percentFee).toFixed(2);
            return (
                <ListItem key={index} sort={sort} id={index+1} date={date[length-index]} amount={amount} percent={percentFee} dateHead={headDate[length-index] !== headDate[length-index+1] ? headDate[length-index] : ""} />
            );
          });
        }
    }

    const [history, setHistory] = useState(0);

    const funcHistory = (value) => {
        setHistory(value);
        for(let i = 0; i < 2; i++) {
            document.getElementsByClassName('history')[0].getElementsByClassName('m-nav')[0].getElementsByTagName('li')[i].classList.remove('active');
        }
        document.getElementsByClassName('history')[0].getElementsByClassName('m-nav')[0].getElementsByTagName('li')[value].classList.add('active');
    };
    const [loading, setLoading] = useState(false);
    const onShowMore = async () => {
        console.log("HistoryCount: ", props.historyTotalCnt);
        console.log("CurrentShowCount: ", props.curShowCnt);
        setLoading(true);
        dispatch(getHistory(props.web3, props.account, props.filterTransactions, props.stakeHistory, props.harvestHistory, props.curShowCnt));
        
    }

    useEffect(()=>{
        setLoading(false);
    }, [props.curShowCnt])

    return(
        <div className="history">
            <div className="container h-100">
                <div className="row rate-mobile fw-nw">
                    <div className='col-md-4 p-4'>
                        <div className='row p-3 b-b-2 br-8 fw-nw'>
                            <div className='col-md-4'>
                                <h1>{props.stakePool}%</h1>
                                <h6 className='c-g-1'>Staked in Pool</h6>
                            </div>
                            <div className='col-md-1'>
                                <ChartStaking width={props.stakePool}/>
                            </div>
                        </div>

                        <div className='row mt-3 p-3 b-b-2 br-8 balance'>
                            <h6 className='mt-1 c-g-1'>Aggregated balance</h6>

                            <div className='col-md-12 b-chart'>
                                <div className='row my-4'>
                                    <ChartBalance />
                                </div>
                            </div>

                            <div className='tags col-md-12'>
                                <div className='row f-i-center fw-nw'>
                                    <DetailTag className='col-md-4 c-gr-1' tag="In-wallet" />
                                    <DetailTag className='col-md-4 c-y-1' tag="Rewards" />
                                    <DetailTag className='col-md-4 c-p-1' tag="Stakes" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="row h-100">
                    <div className="col-md-8">
                        <div className="b-b-2 br-8 mb-3 h-100">
                            <div className="p-3 caption">
                                <span className="fs-6">History</span>
                                {/* <i className="bi bi-search ms-3"></i> */}
                            </div>

                            <div className="list-tabs my-2">
                                <ul className="px-3 m-nav">
                                    <li className="active"><div onClick={()=>{funcHistory(0)}}>Stakes</div></li>
                                    <li><div onClick={()=>{funcHistory(1)}}>Rewards</div></li>
                                </ul>
                            </div>

                            <div className="p-3 history-body">
                                {history===0 ? get_history(props.stakeHistory, "stake") : get_history(props.harvestHistory, "Harvest")}
                                {props.connectState && 
                                    <div className='d-flex'>
                                        {
                                            props.moreState ?
                                              
                                                loading ?
                                                    <button className="mx-auto b-g-2 c-w-1 px-3 py-2 br-8">
                                                        <i className="fa fa-spinner fa-spin"></i>
                                                    </button>
                                                : <button className="mx-auto b-g-2 c-w-1 px-3 py-2 br-8" onClick={()=>{onShowMore()}}>
                                                    More
                                                </button>
                                              
                                            : <></>
                                        }
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    <div className='col-md-4 rate'>
                        {/* <div> */}
                            <div className='row p-3 b-b-2 br-8 stake-pool'>
                                <div className='col-md-9'>
                                    <h1>{props.connectState ? props.stakePool : "-"}%</h1>
                                    <h6 className='c-g-1'>Staked in Pool</h6>
                                </div>
                                <div className='col-md-3'>
                                    <div className='row'>
                                        <ChartStaking width={props.stakePool}/>
                                    </div>
                                </div>
                            </div>

                            <div className='row mt-3 mb-2 px-3 pt-3 pb-2 b-b-2 br-8 balance'>
                                <h6 className='mt-1 c-g-1'>Aggregated balance</h6>

                                <div className='col-md-12 b-chart'>
                                    <div className='row'>
                                        <ChartBalance />
                                    </div>
                                </div>

                                <div className='tags col-md-12'>
                                    <div className='row f-i-center'>
                                        <DetailTag className='col-md-4 c-gr-1' tag="In-wallet" />
                                        <DetailTag className='col-md-4 c-y-1' tag="Rewards" />
                                        <DetailTag className='col-md-4 c-p-1' tag="Stakes" />
                                    </div>
                                </div>
                            </div>
                        {/* </div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = (state) =>{
    state = state.simple;
    return { ...state }
}

export default connect(mapStateToProps)(History);