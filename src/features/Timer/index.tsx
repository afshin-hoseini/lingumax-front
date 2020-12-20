import { Member, MemberType } from '@types';
import React, { FC, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { ControlBtnType, TimerState } from './@types';
import { ControlBtn } from './Components';
import { useTimer } from './timerHook';
import { useTimerMessaging } from './timerMessaging';

type Props = {
    className?: string;
    me: Member;
    peer: Member;
};

const Container = styled.div<{percentage: number}>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: relative;

    .timer-controls {
        display: flex;
        flex-direction: row;
        z-index:1;
    }

    .time-value {
        font-size: 1.5em;
        z-index:1;
    }

    ::before{
        content:'';
        position:absolute;
        z-index: 0;
        top:0;
        left:0;
        height:100%;
        width:${p=>p.percentage * 100}%;
        background-color:#745cf980;
        transition: width 0.5s ease-out;
    }
    
`

const TimerIdleStates = [TimerState.Stopped, TimerState.Paused];

const maxTime = 30;
export const InterviewTimer : FC<Props> = ({className, me, peer})=>{

    const {time, timerState, emitTimerState} = useTimerMessaging(maxTime);
    const myRole = me.type;
    const peerSocket = peer.socketId;

    const start = useCallback(()=>emitTimerState(TimerState.Started, peerSocket), [peerSocket, emitTimerState]);
    const pause = useCallback(()=>emitTimerState(TimerState.Paused, peerSocket), [peerSocket, emitTimerState]);
    const reset = useCallback(()=>emitTimerState(TimerState.Stopped, peerSocket), [peerSocket, emitTimerState]);

    const controls = useMemo(()=>{
        if(myRole !== MemberType.Interviewer) return null;
        return (
            <div className="timer-controls">
                <ControlBtn 
                    controlType={ControlBtnType.Play} 
                    visible={TimerIdleStates.includes(timerState) && time < maxTime} 
                    onClick={start}/>
                
                <ControlBtn 
                    controlType={ControlBtnType.Pause} 
                    visible={timerState === TimerState.Started} 
                    onClick={pause}/>

                <ControlBtn 
                    controlType={ControlBtnType.Reset} 
                    visible={timerState === TimerState.Paused} 
                    onClick={reset}/>
            </div>
        )
    }, [timerState, pause, reset, start, myRole, time]);

    return (
        <Container className={`${className}`} percentage={time / maxTime}>
            <span className="time-value">{time}</span>
            {controls}
        </Container>
    )
}

