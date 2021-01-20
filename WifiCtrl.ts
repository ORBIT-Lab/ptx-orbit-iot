namespace WiFi {

    let wifi_connecting: boolean = false
    let wifi_connected: boolean = false

    let inited: boolean = false; 

    let wifi_ssid : string;
    let wifi_pw : string; 

    function wifiReconnect()
    {
        if(wifi_connected == false)
        {
            wifi_connecting = true;
            atcontrol.sendAT("AT+CWJAP=\"" + wifi_ssid + "\",\"" + wifi_pw + "\"", "OK", "ERROR", function () {
                wifi_connecting = false;
            },wifiReconnect);
        }
    }

    function init() {
        if (inited)
            return; 
        inited = true; 

        atcontrol.addWatcher("WIFI CONNECTED", function (data: string): string {
            wifi_connected = true;
            return "WIFI CONNECTED";
        });
        atcontrol.addWatcher("WIFI DISCONNECT", function (data: string): string {
            wifi_connected = false;
            wifiReconnect();
            return "WIFI DISCONNECT";
        });
    }

    export function connect(ssid: string, pw: string) {
        init();
        wifi_ssid = ssid; 
        wifi_pw = pw; 
        if (wifi_connected == false && wifi_connecting == false) {
            wifi_connecting = true;
            atcontrol.sendAT("AT+CWJAP=\"" + ssid + "\",\"" + pw + "\"", "OK", "ERROR", function () {
                wifi_connecting = false;
            },
                function () {
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