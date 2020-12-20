export enum TimerState {
    Stopped = 'Stopped',
    Started = 'Started',
    Paused = 'Paused'
}

export enum ControlBtnType {
    Play = "play",
    Pause = "pause",
    Reset = "reset"
}

export type TimerMessageData = {
    type: 'timer',
    emittedState: TimerState,
    maxTime: number;
    from?: string;
    to?: string;
}