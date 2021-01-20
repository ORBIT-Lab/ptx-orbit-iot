namespace WiFi {

    let wifi_connecting: boolean = false
    let wifi_connected: boolean = false

    let inited: boolean = false; 

    function init() {
        if (inited)
            return; 
        inited = true; 

        atcontrol.addWatcher("WIFI GOT IP", function (data: string): string {
            wifi_connected = true;
            return "WIFI GOT IP";
        });
        atcontrol.addWatcher("WIFI DISCONNECT", function (data: string): string {
            wifi_connected = true;
            return "WIFI DISCONNECT";
        });
    }

    export function connect(ssid: string, pw: string) {
        init();

        if (wifi_connected == false && wifi_connecting == false) {
            wifi_connecting = true;
            atcontrol.sendAT("AT+CWJAP=\"" + ssid + "\",\"" + pw + "\"", "OK", "ERROR", function () {
                wifi_connected = true;
                wifi_connecting = false;
            },
                function () {
                    wifi_connected = false;
                    wifi_connecting = false;
                }
            );
        }
    }

    export function waitForConnection()
    {
        while (wifi_connecting)
            basic.pause(20);
    }

    export function connecting(): boolean
    {
        return wifi_connecting;
    }

    export function connected(): boolean
    {
        return wifi_connected;
    }

}