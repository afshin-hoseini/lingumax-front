import { useCallback, useEffect, useState } from "react"
import { ConnectionStatus, MeetingModel, Member } from "../../@types"
import { MeetingEntry } from "./Entry";
import { Room } from "./Room";
import styled from 'styled-components';
import { useMessaging } from "features/MessagingContext";
import { useApp } from "features/AppContext";


const Container = styled.div`
    display: flex;
    flex-direction: column;
    width:100%;
    height: 100vh;

    .connection-status{
        /* position: absolute;
        top: 0; left: 0; */
        background-color:white;
    }
`


export const Meeting = ()=> {

    const {setMe, me, meeting} = useMeeting();

    return (
        <Container>
            {
                !me? (
                    <MeetingEntry setMe={setMe} meeting={meeting}/>
                ) : (
                    <Room meeting={meeting!} me={me}/>
                )
            }
        </Container>
    )
}

const useMeeting = ()=> {

    const {connectionStatus, socketRef} = useMessaging();
    const {setMeeting, meeting} = useApp();
    const [me, setMe] = useState<Member>();

    const socket = socketRef?.current;
    useEffect(()=>{
        
        if(!socket) return;
        socket.on("meeting", (meeting: MeetingModel)=>{
            setMeeting?.(meeting);
        });
    }, [socket, setMeeting]);

    const onSetMeState = useCallback((me: Member)=>{

        const socketId = socket?.id;

        if(connectionStatus !== ConnectionStatus.Connected || !socketId) {
            alert("Please chec your connection to server. Try to refresh the page.");
            return;
        }

        me.socketId = socketId;
        setMe(me);
        socket?.emit("join", me);

    }, [connectionStatus, socket]);

    return {
        isConnected: connectionStatus === ConnectionStatus.Connected,
        me,
        setMe: onSetMeState,
        socketId: socket?.id,
        meeting,
        socketRef
    }
}