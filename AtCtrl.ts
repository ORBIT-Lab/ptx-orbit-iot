namespace atcontrol {
    const at_line_delimiter : string = "\u000D\u000A"
    let cmd_queue : Queue<AtCmd>

    export function start()
    {
        atCmdTask();
        setupESP8266()
    }

    export function sendAT(command: string, ok_match: string, error_match : string, cmpCallback: ()=>void, errorCallback: ()=>void)  {
        cmd_queue.push(new AtCmd(command, ok_match, error_match));
    }


    function setupESP8266() {
        sendAT("AT+RESTORE", "OK", "ERROR",
        function () {
            sendAT("AT+CWMODE=1", "OK", "ERROR", empty_callback, empty_callback); // set to STA mode
        },
        function () {
            
        }); // restore to factory settings
    }

    function empty_callback()
    {
    
    }

    function atCmdTask()
    {
        serial.redirect(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200);
        control.inBackground(function ()
        {
            let current_cmd: AtCmd | undefined = undefined; 
            let recevice_text: string = "";
            const timeout: number = 10000;
            let time_at_depature: number = 0;

            led.plot(0,0);

            while(true)
            {
                /*
                if (current_cmd === undefined) {
                    current_cmd = cmd_queue.pop();
                    if (current_cmd !== undefined)
                    {
                        led.plot(1,0);
                        serial.writeString(current_cmd.cmd + at_line_delimiter);
                        time_at_depature = input.runningTime();
                    }
                }

                recevice_text += serial.readString();
                let lines = recevice_text.split(at_line_delimiter);
                let line: string | undefined = undefined;
                if (lines.length > 1) {
                    led.plot(2,0);
                    line = lines[0]; 
                    recevice_text = lines[1];
                }
                    
                if (current_cmd !== undefined) {
                    if ((line !== undefined && line.includes(current_cmd.ok_match))) {
                        led.plot(3,0);
                        current_cmd.onCmp();
                        current_cmd = undefined;
                    }
                    if ((line !== undefined && line.includes(current_cmd.error_match)) ||
                        (input.runningTime() - time_at_depature) > timeout) {
                        led.plot(4,0);
                        current_cmd.onError();
                        current_cmd = undefined;
                    }
                }
                */
                basic.pause(20);
            }
        });
    }

    class Queue<T> {
        _store: T[] = [];

        constructor()
        {}

        push(val: T) {
          this._store.push(val);
        }
        pop(): T | undefined {
          return this._store.shift();
        }
    }

    class AtCmd
    {
        cmd: string;
        ok_match: string;
        error_match: string;

        onError: () => void;
        onCmp: () => void;

        constructor(cmd: string,ok_match: string, error_match: string) {
            this.cmd = cmd;
            this.ok_match = ok_match;
            this.error_match = error_match;
        }
    }


}