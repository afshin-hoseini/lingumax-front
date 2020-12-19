import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ConnectionStatus } from "@types";
import { socketConfigs, socketHost } from "../configs";

// TODO: Implement reconnection status recognizer.
export const useMessagingConnection = ()=> {

    const socketRef = useRef<Socket>();
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.None);

    useEffect(()=>{

        setConnectionStatus(ConnectionStatus.Connecting);

        const socket = io(socketHost, socketConfigs);
        socketRef.current = socket;

        socket.on("connect", ()=> setConnectionStatus(ConnectionStatus.Connected));
        socket.on("disconnect", ()=> setConnectionStatus(ConnectionStatus.Disconnected));
        
        return ()=>{
            try{
                socket.disconnect(); socket.close();
            } catch(err){console.log(err)}
        }
    }, []);

    return {
        socketRef,
        connectionStatus
    }
}