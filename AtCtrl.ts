namespace Orbit_AT {
    
    const MaxQueueCount : number = 20;
    const ORBIT_EVENTS : number = 100;
    const WATCHER_EVENT : number = 202;
    const TIMEOUT_MS: number = 1000;
    const QUEUE_ITEM_CMP_EVENT : number = 201;

    const LINE_DELIMITER: string = "\u000D\u000A"


    enum ATStatus
    {
        PENDING_PROCESS,
        PENDING_OK,
        PENDING_ERROR,
        DONE
    }

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
        status: ATStatus;

        timeout: number; 

        ok_match: string;
        error_match: string;

        onError: () => void;
        onCmp: () => void;

        

        constructor(cmd: string,ok_match: string, error_match: string,
            cmp: () => void, error: () => void, timeout : number) {
            this.status = ATStatus.PENDING_PROCESS;
            this.cmd = cmd;
            this.ok_match = ok_match;
            this.error_match = error_match;
            this.onCmp = cmp; 
            this.onError = error;
            this.timeout = timeout;
        }
    }

    class AtWatcher
    {
        match: string;
        process: (data: string) => void;

        events: string[] = [];

        constructor(match: string, process: (data: string) => void) {
            this.match = match; 
            this.process = process;
        }

        public checkFrame(frame:string) : boolean
        {
            if (frame.includes(this.match))
            {
                this.events.push(frame);
                return true;
            }
            return false;
        }

        public invokeEvents()
        {
            for(let event of this.events)
            {
                this.process(event);
            }
            this.events = [];
        }

    }


    let current_cmd: AtCmd | undefined = undefined; 
    let last_cmd_send : number = 0;

    let cmd_queue       : Queue<AtCmd> = new Queue<AtCmd>();
    let cmd_cmp_queue   : Queue<AtCmd> = new Queue<AtCmd>();

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

    export function sendAT(command: string, ok_match: string, error_match : string, cmpCallback: ()=>void, errorCallback: ()=>void, timeout: number = 0)  {
        if(timeout == 0)
            timeout = TIMEOUT_MS;
        
        while(cmd_queue.count > MaxQueueCount)
        {
            control.waitForEvent(ORBIT_EVENTS, EventBusValue.MICROBIT_EVT_ANY)
        }
        
        cmd_queue.push(new AtCmd(command+LINE_DELIMITER, ok_match, error_match, cmpCallback, errorCallback, timeout));
    }

    export function sendData(command: string, ok_match: string, error_match : string, cmpCallback: ()=>void, errorCallback: ()=>void)  {
        cmd_queue.push(new AtCmd(command, ok_match, error_match, cmpCallback, errorCallback, TIMEOUT_MS));
    }

    function setupESP8266() { 

        let done : boolean = false; 

        sendAT("AT", "OK", "ERROR",empty_callback,empty_callback)
        sendAT("AT+RESTORE", "OK", "ERROR",function()
        {
            basic.pause(3000);
            sendAT("AT+CWMODE=1", "OK", "ERROR", empty_callback, empty_callback); // set to STA mode
            done = true; 
        }, function (){ done = true;});
        
        while(!done)
        {
            basic.pause(100);
        }
    }

    function empty_callback()
    {
    }
    
    let uart_rx : Queue<string> = new Queue<string>(); 

    function atCmdTask()
    {

        serial.redirect(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200);
        serial.setRxBufferSize(128);
        serial.readString(); //empty startup jitter. 

        serial.onDataReceived(LINE_DELIMITER, function () {
            let raw_uart_frame : string = serial.readUntil(LINE_DELIMITER);
            serial.readString(); // clear buffer, if any more data. For some reason this is important for stability. 

            uart_rx.push(raw_uart_frame);
        });

        control.inBackground(uartControlThread);

        control.onEvent(ORBIT_EVENTS, QUEUE_ITEM_CMP_EVENT, function () {
            
            while(cmd_cmp_queue.count > 0)
            {
                let cmd_item : AtCmd = cmd_cmp_queue.pop(); 
                if(cmd_item.status == ATStatus.PENDING_OK)
                {
                    cmd_item.onCmp();
                }
                else
                {
                    cmd_item.onError();
                }
            }
        });

        control.onEvent(ORBIT_EVENTS, WATCHER_EVENT, function () {
            for(let watcher of watchers)
            {
                watcher.invokeEvents();
            }
        });
    
    }

    

    function processWatchers(text: string)
    {
        let watcherActivated : boolean = false; 

        for(let watcher of watchers)
        {
            if(watcher.checkFrame(text))
                watcherActivated =  true;
        }
        
        if(watcherActivated)
        {
            control.raiseEvent(ORBIT_EVENTS, WATCHER_EVENT, EventCreationMode.CreateAndFire);
        }
        
    }


    function processQueue(text: string)
    {
        if (current_cmd !== undefined)
        {
            let sucsess = text.includes(current_cmd.ok_match);
            let error = text.includes(current_cmd.error_match);
            if(sucsess || error)
            {
                current_cmd.status = sucsess ? ATStatus.PENDING_OK : ATStatus.PENDING_ERROR;
                cmd_cmp_queue.push(current_cmd);
                current_cmd = undefined;
                control.raiseEvent(ORBIT_EVENTS, QUEUE_ITEM_CMP_EVENT, EventCreationMode.CreateAndFire);
            }
        }
    }

    function updateQueueAndTimeout()
    {
        if (current_cmd === undefined) {
            current_cmd = cmd_queue.pop();
            if (current_cmd !== undefined)
            {
                serial.writeString(current_cmd.cmd);
                last_cmd_send = input.runningTime();
            }
        }
        else
        {
            let time_since_start = input.runningTime()-last_cmd_send;
            if(time_since_start > current_cmd.timeout)
            {
                current_cmd.status = ATStatus.PENDING_ERROR;
                cmd_cmp_queue.push(current_cmd);
                current_cmd = undefined;
                control.raiseEvent(ORBIT_EVENTS, QUEUE_ITEM_CMP_EVENT, EventCreationMode.CreateAndFire);
            }
        }
    }


    function uartControlThread()
    {
        while(true)
        {
            while(uart_rx.count > 0)
            {
                let data_frame : string = uart_rx.pop();
                processWatchers(data_frame);
                processQueue(data_frame);
            }

            updateQueueAndTimeout();
            basic.pause(100);
        }
    }

    function isEmpty( str : string) {
        return (!str || str.length === 0 );
    }
}