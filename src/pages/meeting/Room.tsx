import { FC, MutableRefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { MeetingModel, Member, MemberType } from '../../@types';
import  { io, Socket } from 'socket.io-client';
import { ReadStream } from 'tty';

const PeerConnection = window.RTCPeerConnection ||
(window as any).mozRTCPeerConnection ||
window.webkitRTCPeerConnection ||
(window as any).msRTCPeerConnection;

navigator.getUserMedia = navigator.getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia ||
    (navigator as any).msGetUserMedia;

export const Container = styled.div`

`;
const answersFrom : any = {};

type Props = {
    me: Member;
    meeting: MeetingModel;
    socketRef: MutableRefObject<Socket>
}
type MembersByRole = Partial<{[k in MemberType]: Member}>

export const Room: FC<Props> = ({meeting, me, socketRef})=> {

    const peerSocketId = useMemo(()=>{
        if(!me?.socketId || !meeting?.members) return;
        return Object.keys(meeting.members).find(socketId => socketId !== me.socketId)
    },[me, meeting]);

    const {userVideoRef, audienceVideoRef, createOffer} = useRTC(socketRef, peerSocketId);
    const members = useMemo<MembersByRole>(()=>{
        return Object.keys(meeting?.members || {}).reduce((m, key)=>{
            const member = meeting?.members?.[key];
            return {...m, [member.type]: member};
        }, {})
    },[meeting]);

    const myType = me.type;
    const audianceSocketId = members?.interviewee?.socketId;
    useEffect(()=>{
        if( myType !== MemberType.Interviewer) return;
        if(audianceSocketId) {
            setTimeout(()=>createOffer(audianceSocketId), 2000);
        }
    }, [audianceSocketId, myType, createOffer])

    return (
        <Container>
            <MemberViewer members={members}/>
            <div className="videos-container">

                <video style={{backgroundColor:'gray', maxWidth:200}} muted id="video-user" autoPlay ref={userVideoRef}/>
                <video style={{backgroundColor:'gray', maxWidth:200}} id="video-audience" autoPlay ref={audienceVideoRef}/>

            </div>
        </Container>
    )
}

const MemberViewer : FC<{members: MembersByRole}> = ({members})=>{

    return (
    <div>
        <span>Members:</span>
        <ul>
            <li><b>Interviewer: </b> {members.interviewer?.name || "Not here yet!"}</li>
            <li><b>Interviewee: </b> {members.interviewee?.name || "Not here yet!"}</li>
        </ul>
    </div>)
}

const useRTC = (socketRef: MutableRefObject<Socket>, peerSocketId?: string)=> {

    const userVideoRef = useRef<HTMLVideoElement>(null);
    const audienceVideoRef = useRef<HTMLVideoElement>(null);
    const peerConRef = useRef<RTCPeerConnection>();
    const peerSocketIdRef = useRef<string>();

    peerSocketIdRef.current = peerSocketId;

    const createOffer = useCallback(async(audianceSocketId: string)=>{
        try{
            const pc = peerConRef.current!;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketRef.current?.emit('RTCPC', {
                desc: offer,
                to: audianceSocketId
            })
        }
        catch(err){
            console.log(err);
        }
    }, [socketRef]);

    useEffect(()=>{

        const socket = socketRef.current!;
        const pc = new PeerConnection({
            iceServers:[ 
                {urls: "stun:stun.services.mozilla.com"},
                {
                    urls: ["stun:numb.viagenie.ca", "turn:numb.viagenie.ca"],
                    username:"afshin.hoseini@gmail.com",
                    credential:"afshinqaz"
                },
             ]
        });
        peerConRef.current = pc;
        pc.onicecandidate = async ({candidate})=>{

            if(!peerSocketIdRef.current) return;

            socket.emit('RTCPC', {
                candidate,
                to: peerSocketIdRef.current
            });
        }

        pc.ontrack = (event)=>{
            const remoteVid = audienceVideoRef.current!;
            if(remoteVid?.srcObject != null) return;
            remoteVid.srcObject = event.streams[0];
        }

        pc.onconnectionstatechange = (e:any)=>{
            const connectionState = e?.currentTarget?.connectionState;
            if(["disconnected", "failed"].includes(connectionState)) { 
                audienceVideoRef.current!.srcObject = null;
            }
        }


        if(typeof navigator?.mediaDevices?.getUserMedia === 'undefined'){
            navigator.getUserMedia({video:true, audio:true}, (stream)=>{
                
                if(userVideoRef.current){
                    userVideoRef.current.srcObject = stream;
                    stream.getTracks().forEach((track) => peerConRef.current!.addTrack(track, stream));
                }
            }, (error)=>{});
        }
        else {
            navigator.mediaDevices.getUserMedia({video:true, audio:true})
            .then((stream)=>{
                if(userVideoRef.current){
                    userVideoRef.current.srcObject = stream;
                    stream.getTracks().forEach((track) => peerConRef.current!.addTrack(track, stream));
                }
            })
        }
        
        

        socket.on('RTCPC', async function ({from, desc, candidate}:any) {
            const pc = peerConRef.current!;

            if(desc?.type === 'offer') {

                await pc.setRemoteDescription(desc);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                
                socket.emit('RTCPC', {
                    desc: answer,
                    to: from
                });

            }
            else if(desc?.type === 'answer') {
                await pc.setRemoteDescription(desc);
            }
            else if(candidate) {
                await pc.addIceCandidate(candidate)
            }
        });
        
    }, []);

    
    return {
        userVideoRef,
        audienceVideoRef,
        createOffer
    }
}