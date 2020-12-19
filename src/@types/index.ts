export enum ConnectionStatus {
    None="None",
    Connecting="Connecting",
    Disconnected="Disconnected",
    Reconnecting="Reconnecting",
    Connected="Connected"
}
export enum MemberType {
    Interviewer = "interviewer",
    Interviewee = "interviewee"
}

export type User = {
    firstName?: string;
    lastName?: string;
    id?: number | string;
}

export type Member = {
    type: MemberType;
    name: string;
    socketId?: string;
}

export type MeetingModel = {
    members: {[socketId: string] : Member};
}
