import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { exportAllStakes } from "../store/actions/wallet";

export default function Export () {

    const dispatch = useDispatch();
    useEffect(()=>{
        dispatch(exportAllStakes());
    });
}
