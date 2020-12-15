import { type } from "os"

export enum MemberType {
    Interviewer = "interviewer",
    Interviewee = "interviewee"
}

export type Member = {

    type: MemberType;
    name: string;
    socketId?: string;
}

export type MeetingModel = {
    members: {[socketId: string] : Member};
}
