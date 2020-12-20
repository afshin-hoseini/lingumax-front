import React, { FC } from 'react';
import styled from 'styled-components';
import { MeetingModel, Member } from '../../@types';

const Container = styled.form`

    width:100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    font-size:1em;
    margin: 20px auto;

    .types-rg {
        display: flex;
    }

    &>*{
        margin: 8px 0;
    }

    .join-btn {
        align-self: flex-end;
        padding: 8px 12px;
    }
`;

type Props = {
    setMe : (me: Member)=>void;
    meeting?: MeetingModel;
}
export const MeetingEntry: FC<Props> = ({setMe, meeting})=> {

    return (
        <Container onSubmit={(e)=>{
            const form =  (e.target as HTMLFormElement);
            const me : Member = {
                type : form.type.value,
                name: form.username.value
            }

            e.preventDefault();
            if(!me.name || !me.type) {
                alert("Please determine your role and name.");
                return;
            }
            
            setMe(me);
        }}>
            <b>Select you role:</b>
            <div className="types-rg">
                <input type="radio" value="interviewer" name="type" id="type-interviewer" defaultChecked/>
                <label htmlFor="type-interviewer">Interviewer</label>
                <input type="radio" value="interviewee" name="type" id="type-interviewee"/>
                <label htmlFor="type-interviewee">Interviewee</label>
            </div>
            <b> Enter your name: </b>
            <input name="username" placeholder="e.g James Hetfield"/>

            <i><b>Note:</b> You might be asked to grant camera and microphone access permission. 
            Please allow the request, in order to make video call go through.</i>
            <button className="join-btn"><b>Join</b></button>
        </Container>
    )
}
