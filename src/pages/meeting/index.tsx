import { useCallback, useEffect, useRef, useState } from "react"
import { MeetingModel, Member } from "../../@types"
import { MeetingEntry } from "./Entry";
import { Room } from "./Room";
import  { io, Socket } from 'socket.io-client';
import styled from 'styled-components';


const Container = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;

    .connection-status{
        /* position: absolute;
        top: 0; left: 0; */
        background-color:white;
    }
`


export const Meeting = ()=> {

    const {isConnected, setMe, me, meeting, socketRef} = useMeeting();

    return (
        <Container>
            <div className="connection-status">
                {isConnected ? "Connected": "Not Connected"}
            </div>

            {
                !me? (<MeetingEntry setMe={setMe}/>) : (<Room meeting={meeting!} me={me} socketRef={socketRef as any}/>)
            }
        </Container>
    )
}

const useMeeting = ()=> {

    const socketRef = useRef<Socket>();
    const [socketId, setSocketId] = useState<string>();
    const [me, setMe] = useState<Member>();
    const [meeting, setMeeting] = useState<MeetingModel>();

    useEffect(()=> {
        
        //https://mysrvtest.herokuapp.com/
        //http://localhost:5000
        const socket = io(`https://mysrvtest.herokuapp.com/`, {
            transports:["websocket"]
        });
        socket.on("connect", ()=>setSocketId(socket?.id));
        socket.on("disconnect", ()=>setSocketId(undefined));
        socket.on("meeting", (meeting: MeetingModel)=>setMeeting(meeting));
        socket.on('connect_failed', function(error: any) {
            alert(error)
         })
        // socket.onAny(function(){console.log(arguments)})
        socketRef.current = socket;
    }, [])

    const onSetMeState = useCallback((me: Member)=>{
        me.socketId = socketId;
        setMe(me);
        socketRef.current?.emit("join", me);
    }, [socketId]);

    return {
        isConnected: !!socketId,
        me,
        setMe: onSetMeState,
        socketId,
        meeting,
        socketRef
    }
}