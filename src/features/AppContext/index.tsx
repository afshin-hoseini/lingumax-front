import {createContext, FC, useContext, useMemo, useState} from 'react';
import { ConnectionStatus } from '@types';
import { AppContextType, AppContextMeeting } from './@types';

const AppContext = createContext<AppContextType>({});

export const AppContextProvider : FC = ({children})=> {

    const [meeting, setMeeting] = useState<AppContextMeeting>();
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>();

    const value = useMemo(()=>({
        meeting, 
        setMeeting,
        connectionStatus, 
        setConnectionStatus
    }), [meeting, setMeeting, connectionStatus, setConnectionStatus]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useApp = ()=>useContext(AppContext);