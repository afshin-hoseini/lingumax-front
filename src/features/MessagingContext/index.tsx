import { createContext, FC, useContext, useMemo } from 'react';
import { MessagingContextType } from './@types';
import { useMessagingConnection } from './hooks';

export const MessagingContext = createContext<MessagingContextType>({});

export const MessagingProvider : FC = ({children})=> {

    const {connectionStatus, socketRef} = useMessagingConnection();
    const value = useMemo<MessagingContextType>(()=>({connectionStatus, socketRef}),[connectionStatus, socketRef]);

    return (
        <MessagingContext.Provider value={value}>
            {children}
        </MessagingContext.Provider>
    )
}

export const useMessaging = ()=> useContext(MessagingContext);