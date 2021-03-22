namespace Orbit_AT {
    const MaxQueueCount : number = 8;
    const ORBIT_EVENTS : number = 100;

    class Queue<T> {
        _store: T[] = [];
        count : number = 0; 
        constructor()
        {}

        push(val: T) {
          this._store.push(val);
          this.count++; 
        }
        pop(): T | undefined {
            if(this.count > 0)
            {
                this.count--;
                return this._store.shift();
            }
            return undefined;
        }
    }

    class AtCmd
    {
        cmd: string;
        ok_match: string;
        error_match: string;

        onError: () => void;
        onCmp: () => void;

        constructor(cmd: string,ok_match: string, error_match: string,
            cmp: () => void, error: () => void) {
            this.cmd = cmd;
            this.ok_match = ok_match;
            this.error_match = error_match;
            this.onCmp = cmp; 
            this.onError = error;
        }
    }

    class AtWatcher
    {
        match: string;
        process: (data: string) => void;

        text: string;

        constructor(match: string, process: (data: string) => void) {
            this.match = match; 
            this.process = process;
        }
    }
    
    const at_line_delimiter : string = "\u000D\u000A"
    let cmd_queue : Queue<AtCmd> = new Queue<AtCmd>();
    let watchers: AtWatcher[] = [];
    let started: boolean = false; 

    export function start()
    {
        if(!started)
        {
            started = true;
            atCmdTask();
            setupESP8266()
        }
    }

    export function addWatcher(matchStr: string, callback: (data: string) => void)
    {
        let val: AtWatcher = new AtWatcher(matchStr, callback);
        watchers.push(val);
    }

    export function sendAT(command: string, ok_match: string, error_match : string, cmpCallback: ()=>void, errorCallback: ()=>void)  {
        while(cmd_queue.count > MaxQueueCount)
        {
            control.waitForEvent(ORBIT_EVENTS, EventBusValue.MICROBIT_EVT_ANY)
        }
        
        cmd_queue.push(new AtCmd(command+at_line_delimiter, ok_match, error_match, cmpCallback, errorCallback));
        processQueue("");
    }

    export function sendData(command: string, ok_match: string, error_match : string, cmpCallback: ()=>void, errorCallback: ()=>void)  {
        cmd_queue.push(new AtCmd(command, ok_match, error_match, cmpCallback, errorCallback));
        processQueue("");
    }


    function setupESP8266() {
        sendAT("AT", "OK", "ERROR",empty_callback,empty_callback)
        sendAT("AT+RESTORE", "ready", "ERROR",function()
        {
            serial.readString(); //clear upstart info.
        }, empty_callback); // restore to factory settings
        sendAT("AT+CWMODE=1", "OK", "ERROR", empty_callback, empty_callback); // set to STA mode
    }

    function empty_callback()
    {
    }

    const watcherEvt : number = 202;
    let cmpWatchers : AtWatcher[] = [];

    function processWatchers(text: string)
    {
        for(let watcher of watchers)
        {
            let index : number = text.indexOf(watcher.match);
            if (index !== -1)
            {
                watcher.text = text;
                cmpWatchers.push(watcher);
                control.raiseEvent(ORBIT_EVENTS, watcherEvt, EventCreationMode.CreateAndFire);
            }
        }
    }

    let current_cmd: AtCmd | undefined = undefined; 
    let last_cmd_send : number = 0;
    const timeout_ms: number = 15000;

    function checkForEventTimeout()
    {
        if (current_cmd !== undefined)
        {
            let time_since_start = input.runningTime()-last_cmd_send;
            if(time_since_start > timeout_ms)
            {
                doneCMD = current_cmd;
                control.raiseEvent(ORBIT_EVENTS, errorEvt, EventCreationMode.CreateAndFire);
                current_cmd = undefined;
                processQueue("");
            }
        }
    }

    const cmpEvt : number = 200;
    const errorEvt : number = 201;
    let doneCMD : AtCmd | undefined = undefined; 

    function processQueue(text: string)
    {
        if (current_cmd !== undefined)
        {
            let sucsess = text.includes(current_cmd.ok_match);
            let error = text.includes(current_cmd.error_match);
            if(sucsess || error)
            {
                doneCMD = current_cmd;
                if(sucsess)
                    control.raiseEvent(ORBIT_EVENTS, cmpEvt, EventCreationMode.CreateAndFire);
                else
                    control.raiseEvent(ORBIT_EVENTS, errorEvt, EventCreationMode.CreateAndFire);
                current_cmd = undefined;
                text = "";
            }
        }

        if (current_cmd === undefined) {
            current_cmd = cmd_queue.pop();
            if (current_cmd !== undefined)
            {
                serial.writeString(current_cmd.cmd);
                last_cmd_send = input.runningTime();
            }
        }
    }

    function atCmdTask()
    {
        serial.redirect(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200);
        serial.setRxBufferSize(128);
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            let recevice_text = serial.readString();
            let data : string[] = recevice_text.split('\n');
            for(let line of data)
            {
                processWatchers(line);
                processQueue(line);
            }
        });

        control.onEvent(ORBIT_EVENTS, cmpEvt, function () {
            if(doneCMD !== undefined)
                doneCMD.onCmp();
            doneCMD = undefined;
        });

        control.onEvent(ORBIT_EVENTS, errorEvt, function () {
            if(doneCMD !== undefined)
                doneCMD.onError();
            doneCMD = undefined;
        });

        control.onEvent(ORBIT_EVENTS, watcherEvt, function () {
            for(let watcher of cmpWatchers)
            {
                watcher.process(watcher.text);
                watcher.text = "";
            }
            cmpWatchers = [];
        });
        


        control.inBackground(function () {
            while(true)
            {
                checkForEventTimeout();
                basic.pause(2000);
            }
        });

    }

    


}