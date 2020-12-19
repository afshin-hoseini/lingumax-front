import React, { useState } from 'react';
import './App.css';
import { Meeting } from './pages/meeting';
import { AppContextProvider } from './features/AppContext';
import { MessagingContext, MessagingProvider } from './features/MessagingContext';
import { ConnectionStatus } from './@types';

function App() {
    const [connectionStablishedOnce, setConnectionStablishedOnce] = useState<boolean>(false);

    return (
        <AppContextProvider>
            <MessagingProvider>
                    <MessagingContext.Consumer >
                        {({connectionStatus})=>{
                            
                            if(connectionStablishedOnce || connectionStatus === ConnectionStatus.Connected){
                                setConnectionStablishedOnce(true);
                                return <Meeting/>
                            }
                            
                            return <span>Connecting to server ...</span>
                        }}
                    </MessagingContext.Consumer>
                    
            </MessagingProvider>
        </AppContextProvider>
    );
}

export default App;
