namespace Orbit_AT {
    
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
        process: (data: string) => string;

        constructor(match: string, process: (data: string) => string) {
            this.match = match; 
            this.process = process;
        }
    }
    
    const at_line_delimiter : string = "\u000D\u000A"
    let cmd_queue : Queue<AtCmd> = new Queue<AtCmd>();
    let watchers: AtWatcher[] = [];

    export function start()
    {
        atCmdTask();
        setupESP8266()
    }

    export function addWatcher(matchStr: string, callback: (data: string) => string)
    {
        let val: AtWatcher = new AtWatcher(matchStr, callback);
        watchers.push(val);
    }

    export function sendAT(command: string, ok_match: string, error_match : string, cmpCallback: ()=>void, errorCallback: ()=>void)  {
        cmd_queue.push(new AtCmd(command+at_line_delimiter, ok_match, error_match, cmpCallback, errorCallback));
    }

    export function sendData(command: string, ok_match: string, error_match : string, cmpCallback: ()=>void, errorCallback: ()=>void)  {
        cmd_queue.push(new AtCmd(command, ok_match, error_match, cmpCallback, errorCallback));
    }


    function setupESP8266() {
        sendAT("AT", "OK", "ERROR",empty_callback,empty_callback)
        sendAT("AT+RESTORE", "OK", "ERROR",function()
        {
            basic.pause(1100);
            serial.readString(); //clear upstart info.
        }, empty_callback); // restore to factory settings
        sendAT("AT+CWMODE=1", "OK", "ERROR", empty_callback, empty_callback); // set to STA mode
    }

    function empty_callback()
    {
    }

    function processWatchers(text: string)
    {
        for(let watcher of watchers)
        {
            let index : number = text.indexOf(watcher.match);
            if (index !== -1)
            {
                watcher.process(text); 
            }
        }
    }

    let current_cmd: AtCmd | undefined = undefined; 

    function processQueue(text: string): string
    {
        const timeout_ms: number = 10000;

        if (current_cmd !== undefined)
        {
            let sucsess = text.includes(current_cmd.ok_match);
            let error = text.includes(current_cmd.error_match);
            if(sucsess || error)
            {
                if(sucsess)
                    current_cmd.onCmp();
                else
                    current_cmd.onError();

                current_cmd = undefined;
                text = "";
            }
        }

        if (current_cmd === undefined) {
            current_cmd = cmd_queue.pop();
            if (current_cmd !== undefined)
            {
                serial.writeString(current_cmd.cmd);
            }
        }

        return text;
    }

    function atCmdTask()
    {
        serial.redirect(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200);
        serial.setRxBufferSize(128);
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            let recevice_text = serial.readUntil(serial.delimiters(Delimiters.NewLine));

            processWatchers(recevice_text);
            processQueue(recevice_text);

        });
    }

    


}