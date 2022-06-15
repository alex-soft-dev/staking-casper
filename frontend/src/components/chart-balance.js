import '../assets/css/chart-balance.css';
import { connect } from 'react-redux';
import { PieChart } from 'react-minimal-pie-chart';

const ChartBalance = (props) => {
    const total = (props.cspdValue + props.stakeValue + props.rewardValue).toFixed(2);
    return (
        total > 0 ? 
            <div className="balance-item svg-item">
                <div className='balance-sum'>
                    <div className="text">{total}</div>
                    <div className="unit-text">$CSPD</div>
                </div>

                <PieChart
                data={[
                    { title: 'In Wallet', value: props.cspdValue, color: "#03DAC6"},
                    { title: 'Rewards', value: props.rewardValue, color: "#CAF239"},
                    { title: 'Stakes', value: props.stakeValue, color: "#6239F2"},
                ]}
                lineWidth={'10'}
                paddingAngle={10}
                rounded={true}
                animate={true}
                />
            </div>
        : <></>        
    )
}

const mapStateToProps = (state) =>{
    state = state.simple;
    return { ...state }
}

export default connect(mapStateToProps)(ChartBalance);