import { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import StakingImg from '../assets/img/modal/Staking.svg';
import { harvestRewards } from "../store/actions/wallet";

const data = {
    harvest: {
        title: "Harvest",
        text: "There are some fees when harvesting 10%",
        buttonText: "Harvest",
    },
    restake: {
        title: "Restake",
        text: "Stake the rewards you earned for 0% fees",
        buttonText: "Restake",
    }
}

const StackCard = (props) => {

    let con = props.content;
    const dispatch = useDispatch();

    return (
        <>
            <div className="mx-auto my-4">
                <img src={StakingImg} alt="stakeImg" />
            </div>
            <div className='mt-4'>
                <h4 className='title'>{con.title}</h4>
                <p className='text'>
                   {con.text}
                   {/* {con.buttonText === 'Harvest' ? <></> : ': ' + '0%'} */}
                </p>
            </div>
            <div className='mt-1'>
                {/* <p className='d-flex'>
                    <span>{con.buttonText} amount</span> 
                    <span className='ms-auto c-p-1 cur-ptr' onClick={()=>{
                        document.getElementById('stake-num').value = (con.buttonText === 'Stake' ? parseInt(props.cspdValue) : props.stakeValue);
                    }}>MAX</span>
                </p>
                <input type="number" className="m-input c-w-1 br-8 b-b-2" id="stake-num" placeholder="" /> */}
                <button className="btn b-p-1 br-8 mt-2 m-s-btn" onClick={()=>{
                    con.buttonText === 'Harvest' ? dispatch(harvestRewards(props.web3, props.account, false)) : dispatch(harvestRewards(props.web3, props.account, true))
                    props.setShowModal(false);
                }}>
                    {con.buttonText}
                </button>
            </div>
        </>
    )
}

const ModalHav = ({tab, ...props}) => {
    const [atab, setATab] = useState("");
    const [content, setContent] = useState({});

    useEffect(() => {
        props.setTab(atab);
        let c = (atab === "harvest")? data.harvest : data.restake;
        setContent(c);
    }, [atab]);
    
    useEffect(()=>{
        if (props.showModal)
            setATab(tab);
    }, [props.showModal])

    return (
        <>
            { !props.showModal? null :

            <div className={`overlay ${props.showModal? "show" : "hide"}`} onClick={() => props.setShowModal(false)}>
                <div className={"br-8 m-modal " + props.className} onClick={ e => e.stopPropagation() }>
                    <div className='m-header px-3 pt-4 pb-2'>
                        <ul className="m-nav">
                            <li onClick={() => {setATab("restake"); }} className={atab === "restake"? "active":""}><div href="#">Restake</div></li>
                            <li onClick={() => {setATab("harvest"); }} className={atab === "harvest"? "active":""}><div href="#">Harvest</div></li>
                        </ul>
                    </div>
                    <div className='m-body p-3 d-flex flex-column'>
                        <StackCard content={content} {...props}/>
                    </div>
                </div>
            </div>
            }
        </>
    );
}

const mapStateToProps = (state) =>{
    state = state.simple;
    return { ...state }
}

const mapDispatchToProps = () => {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ModalHav);
