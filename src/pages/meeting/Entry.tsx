import React, { FC } from 'react';
import styled from 'styled-components';
import { Member } from '../../@types';

const Container = styled.form`

    width:100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;

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
}
export const MeetingEntry: FC<Props> = ({setMe})=> {
    return (
        <Container onSubmit={(e)=>{
            const form =  (e.target as HTMLFormElement);
            const me : Member = {
                type : form.type.value,
                name: form.username.value
            }
            
            setMe(me);
            e.preventDefault();
        }}>
            <div className="types-rg">
                <input type="radio" value="interviewer" name="type" id="type-interviewer"/>
                <label htmlFor="type-interviewer">Interviewer</label>
                <input type="radio" value="interviewee" name="type" id="type-interviewee"/>
                <label htmlFor="type-interviewee">Interviewee</label>
            </div>
            <span> Enter your name: </span>
            <input name="username" placeholder="e.g James Hetfield"/>

            <button className="join-btn">Join</button>
        </Container>
    )
}
