import { FC, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export const Container = styled.div<{isPeerConnected?: boolean}>`

`;

export const VideosContainer = styled.div<{isPeerConnected?: boolean}>`

    position: relative;
    height: 100vh;

    #video-audience:not(.pc){
        display: none;
    }

    #video-audience.pc {
        position:absolute;
        top:0; left:0; bottom: 0; right:0;
        width:100%;
        min-width:100%;
        height:100%;
    }

    #video-user {
        position:absolute;
        z-index:1;
        transition:all 0.4s ease-in;
    }

    #video-user:not(.pc) {
        top:0; left:0; bottom: 0; right:0;
        width:100%;
        min-width:100%;
        height:100%;
    }

    #video-user.pc{
        position:absolute;
        top:0; right:0;
        left:unset; bottom: unset;
        max-width:250px;
        max-height: 150px;
    }
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

    const {userVideoRef, audienceVideoRef, createOffer, isPeerConnected} = useRTC(socketRef, peerSocketId);
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
            <VideosContainer className="videos-container" isPeerConnected={isPeerConnected}>

                <video style={{backgroundColor:'gray', maxWidth:200}} muted id="video-user" className={`${isPeerConnected? 'pc':''}`} autoPlay ref={userVideoRef}/>
                <video style={{backgroundColor:'gray', maxWidth:200}} id="video-audience" className={`${isPeerConnected? 'pc':''}`} autoPlay ref={audienceVideoRef}/>

            </VideosContainer>
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
    const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);

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
                {urls: ["stun:stun.services.mozilla.com", "stun:numb.viagenie.ca"]},
                {
                    urls: ["turn:51.75.233.33"],
                    username:"1608519387",
                    credential:"UOCOi+EYw6yrV0ze31Ox2M45ySA="
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

            if(connectionState === "connected") setIsPeerConnected(true);
            if(["disconnected", "failed"].includes(connectionState)) { 
                audienceVideoRef.current!.srcObject = null;
                setIsPeerConnected(false);
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
        createOffer,
        isPeerConnected
    }
}