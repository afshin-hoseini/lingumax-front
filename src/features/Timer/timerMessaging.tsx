import { useMessaging } from "features/MessagingContext"
import { useCallback, useEffect } from "react";
import { TimerMessageData, TimerState } from "./@types";
import { useTimer } from "./timerHook";


export const useTimerMessaging = (maxTime: number)=>{

    const {socketRef} = useMessaging();
    const {pause, reset, start, time, timerState} = useTimer(maxTime);
    const socket = socketRef?.current;


    const emitTimerState = useCallback((state: TimerState, peerSocketId?: string)=>{
        if(!socket || !peerSocketId) return;

        socket.emit("msg", {
            emittedState: state,
            maxTime: 30,
            type: 'timer',
            to: peerSocketId
        } as TimerMessageData);

        switch(state) {
            case TimerState.Started: start(); break;
            case TimerState.Paused: pause(); break;
            case TimerState.Stopped: reset(); break;
        }

    },[socket, pause, reset, start]);

    useEffect(()=>{
        if(!socket) return;

        const msgListener = (data:TimerMessageData)=>{
            if(data.type !== "timer") return;

            switch(data.emittedState) {
                case TimerState.Started: start(); break;
                case TimerState.Paused: pause(); break;
                case TimerState.Stopped: reset(); break;
            }
        }

        socket.on("msg", msgListener);
        return ()=>{socket?.off("msg", msgListener)}

    }, [socket, pause, reset, start]);

    return {
        emitTimerState,
        time, timerState
    }
}