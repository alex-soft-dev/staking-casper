import { PacmanLoader } from 'react-spinners';
import '../assets/css/spinner.css';

const Spinner = ({spinnerShow, message}) => {
    return (
        <div className="spinner-container" style={{display: spinnerShow? "block" : "none"}}>
        <PacmanLoader size={25} margin={2} color="white"></PacmanLoader>
        <span className="spinner-text c-w-1">{message}</span>
        </div>
    );
};

export default Spinner;