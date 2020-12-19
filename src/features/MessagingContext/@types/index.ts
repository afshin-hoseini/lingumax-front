import { Socket } from "socket.io-client";
import { ConnectionStatus } from "@types";

export type MessagingContextType = {
    socketRef?: React.MutableRefObject<Socket | undefined>;
    connectionStatus?: ConnectionStatus;
}