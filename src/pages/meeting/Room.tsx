import { FC, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { MeetingModel, Member, MemberType } from '../../@types';
import  { Socket } from 'socket.io-client';
import { useMessaging } from 'features/MessagingContext';
import { Meeting } from '.';

const PeerConnection = window.RTCPeerConnection ||
(window as any).mozRTCPeerConnection ||
window.webkitRTCPeerConnection ||
(window as any).msRTCPeerConnection;

navigator.getUserMedia = navigator.getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia ||
    (navigator as any).msGetUserMedia;

export const Container = styled.div<{isPeerConnected?: boolean}>`
    background-color: #181818;
    color: white;
    height: 100vh;
    display:flex;
    flex-direction:column;
`;

export const PeerVideoContainer = styled.div<{isPeerConnected?: boolean}>`

    position: relative;
    height: 100%;
    width:100%;

    #video-audience{
        width: 100%;
        flex:1;
    }
`;

const HeaderSection = styled.div`

    display: flex;
    padding: 12px 8px;

    .my-vid-container {

        width:250px;
        height: 100px;
        max-width: 200px;
        max-height: 150px;
        background-color:red;
        border-radius: 15px;
        overflow: hidden;

        #video-user {
            width:100%;
            height:100%;
            object-fit: cover;
        }
    }

    .info-and-controls {
        display: flex;
        flex-direction: column;
        flex:1;
    }
`;

type Props = {
    me: Member;
    meeting: MeetingModel;
}
type MembersByRole = Partial<{[k in MemberType]: Member}>

export const Room: FC<Props> = ({meeting, me})=> {
    
    const peerSocketId = useMemo(()=>{
        if(!me?.socketId || !meeting?.members) return;
        return Object.keys(meeting.members).find(socketId => socketId !== me.socketId)
    },[me, meeting]);

    const {userVideoRef, audienceVideoRef, createOffer, isPeerConnected} = useRTC(peerSocketId);
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
            <HeaderViewer members={members} me={me} userVideoRef={userVideoRef}/>
            <PeerVideoContainer className="videos-container" isPeerConnected={isPeerConnected}>

                <video id="video-audience" className={`${isPeerConnected? 'pc':''}`} autoPlay ref={audienceVideoRef}/>

            </PeerVideoContainer>
        </Container>
    )
}

const HeaderViewer : FC<{members: MembersByRole, me: Member, userVideoRef: React.RefObject<HTMLVideoElement>}> = ({members, me, userVideoRef})=>{

    
    const peerMember = useMemo(()=>{
        const peerRole = Object.keys(members).find(key => me.socketId !== members?.[key as keyof MembersByRole]?.socketId)
        return members?.[peerRole as keyof MembersByRole];
    }, [me, members]);

    return (
    <HeaderSection>
        <div className="info-and-controls">
            {peerMember ?
                <span>{peerMember?.name} <span>Online</span></span>
                :
                <span>Peer is not online yet</span>
            }
        </div>

        <div className="my-vid-container">
            <video 
                muted id="video-user" 
                autoPlay 
                ref={userVideoRef}/>
        </div>
    </HeaderSection>)
}

const useRTC = (peerSocketId?: string)=> {

    const userVideoRef = useRef<HTMLVideoElement>(null);
    const audienceVideoRef = useRef<HTMLVideoElement>(null);
    const peerConRef = useRef<RTCPeerConnection>();
    const peerSocketIdRef = useRef<string>();
    const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);

    peerSocketIdRef.current = peerSocketId;

    const {socketRef} = useMessaging();

    const createOffer = useCallback(async(audianceSocketId: string)=>{
        try{
            const pc = peerConRef.current!;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketRef!.current?.emit('RTCPC', {
                desc: offer,
                to: audianceSocketId
            })
        }
        catch(err){
            console.log(err);
        }
    }, [socketRef]);

    useEffect(()=>{

        const socket = socketRef!.current!;
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

        const mediaConfig = {video:{
            width:1440, height:480
        }, audio:true};

        if(typeof navigator?.mediaDevices?.getUserMedia === 'undefined'){
            navigator.getUserMedia(mediaConfig, (stream)=>{
                
                if(userVideoRef.current){
                    userVideoRef.current.srcObject = stream;
                    stream.getTracks().forEach((track) => peerConRef.current!.addTrack(track, stream));
                }
            }, (error)=>{});
        }
        else {
            navigator.mediaDevices.getUserMedia(mediaConfig)
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