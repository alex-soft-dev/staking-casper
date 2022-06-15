// import '../assets/css/chart-staking.css';
import StakingImg from '../assets/img/history/Staking.svg';
import { PieChart } from 'react-minimal-pie-chart';

const ChartStaking = ({width}) => {
    return (
        <div className="svg-item pool">
            <img src={StakingImg} alt="stakingImg" />
            <PieChart
                data={[
                    { title: 'In Wallet', value: width, color: "#6239F2"},
                    { title: 'Rewards', value: 100-width, color: "grey"},
                ]}
                lineWidth={'15'}
                startAngle={-90}
            />
        </div>
    )
}

export default ChartStaking;