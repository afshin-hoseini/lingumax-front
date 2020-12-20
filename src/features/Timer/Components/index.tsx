import { FC } from "react";
import { ControlBtnType } from "../@types";
import styled from 'styled-components';

type ControlBtnProps = {
    
    controlType : ControlBtnType,
    onClick : ()=>void;
    visible?: boolean;
}

const Container = styled.button`
    border: none;
    border-radius: 50%;
    padding: 0;
    background: unset;
    color: white;
    font-size: 2em;
    outline:unset;
    cursor: pointer;
    display:flex;
`;

const TypeClassNameMap : {[k in  ControlBtnType] : string} = {
    pause: 'bx bx-pause-circle',
    play: 'bx bx-play-circle',
    reset:'bx bx-reset'
}

export const ControlBtn : FC<ControlBtnProps> = ({controlType, onClick, visible})=>{

    if(!visible) return null;
    return (
        <Container className={`timer-ctrl ${controlType}`} onClick={onClick}>
            <i className={TypeClassNameMap[controlType]} ></i>
        </Container>
    )
}