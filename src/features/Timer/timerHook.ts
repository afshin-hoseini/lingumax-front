import { useCallback, useEffect, useRef, useState } from "react";
import { TimerState } from "./@types";

export const useTimer = (maxTime: number)=> {
    const timerRef = useRef<number>();
    const [time, setTime] = useState<number>(0);
    const [timerState, setTimerState] = useState<TimerState>(TimerState.Stopped);

    const pause = useCallback(()=>{
        if(timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = undefined;
            setTimerState(TimerState.Paused);
        }
    }, []);

    const start = useCallback(()=>{
        if(!timerRef.current) {
            timerRef.current = setInterval(()=>{
                setTime(time => {

                    if(time < maxTime)
                        return time+1;

                    pause();
                    return time;
                })
            }, 1000);
            setTimerState(TimerState.Started);
        }
    }, [maxTime, pause]);

    const reset = useCallback(()=>{
        pause();
        setTime(0);
        setTimerState(TimerState.Stopped);
    }, [pause]);

    // Stops the timer when unmount
    useEffect(()=>{
        return ()=> {
            if(timerRef.current) clearInterval(timerRef.current)
        }
    },[])

    return {
        time, timerState, pause, start, reset
    }
}