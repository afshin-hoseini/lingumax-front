import { ConnectionStatus, MeetingModel, Member, User } from "@types"

export type AppContextMeeting = MeetingModel & {
    /** Describes the peer member */
    peer?: Member;
}

type Dispatcher<T> = React.Dispatch<React.SetStateAction<T | undefined>>;
export type AppContextType = {

    user?: User;
    setUser?: Dispatcher<User>;
    meeting?: AppContextMeeting;
    setMeeting?: Dispatcher<AppContextMeeting>;
    connectionStatus?: ConnectionStatus;
    setConnectionStatus?: Dispatcher<ConnectionStatus>;
}