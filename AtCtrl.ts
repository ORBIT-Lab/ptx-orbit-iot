namespace atcontrol {
    
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
            onCmp: () => void, onError: () => void) {
            this.cmd = cmd;
            this.ok_match = ok_match;
            this.error_match = error_match;
            this.onCmp = onCmp; 
            this.onError = onError;
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

    function processWatchers(text: string): string
    {
        if (watchers.length == 0)
            return text; 
        
        watchers.forEach(watcher => {
            let index : number = text.indexOf(watcher.match);
            if (index !== -1)
            {
                let data: string = text.substr(index, text.length - index);
                data = watcher.process(data); 
                let temp = text.substr(0, index); 
                let end_start = data.length + index;
                temp += text.substr(end_start, text.length - end_start);
                text = temp; 
            }
        });
        return text; 
    }

    function atCmdTask()
    {
        serial.redirect(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200);
        serial.setRxBufferSize(128);
        
        control.inBackground(function ()
        {
            let current_cmd: AtCmd | undefined = undefined; 
            let recevice_text: string = "";
            const timeout: number = 10000;
            let time_at_depature: number = 0;

            while(true)
            {
                if (current_cmd === undefined) {
                    current_cmd = cmd_queue.pop();
                    if (current_cmd !== undefined)
                    {
                        serial.writeString(current_cmd.cmd);
                        time_at_depature = input.runningTime();
                    }
                }

                recevice_text += serial.readString();
                recevice_text = processWatchers(recevice_text);
                

                let handled_index : number = -1;
                if (current_cmd !== undefined) {
                    handled_index = recevice_text.indexOf(current_cmd.ok_match);
                    if ((handled_index !== -1) || (current_cmd.ok_match === "")) {
                        current_cmd.onCmp();
                        handled_index += current_cmd.ok_match.length;
                        current_cmd = undefined;
                    }
                    else
                    {
                        handled_index = recevice_text.indexOf(current_cmd.error_match);
                        if ((handled_index !== -1) || (input.runningTime() - time_at_depature) > timeout) {
                            current_cmd.onError();
                            handled_index += current_cmd.error_match.length;
                            current_cmd = undefined;
                        }
                    }
                }

                if (handled_index != -1)
                    recevice_text = recevice_text.substr(handled_index);
                else if (recevice_text.length > 100)
                    recevice_text = recevice_text.substr(50);
                
                
                basic.pause(50);
            }
        });
    }

    


}