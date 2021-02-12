namespace WiFi {

    let wifi_connecting: boolean = false
    let wifi_connected: boolean = false

    let inited: boolean = false; 

    let wifi_ssid : string;
    let wifi_pw : string; 

    let reconnecting : boolean = false;
    let wifi_connect_callback : ()=>void = function(){};
    let wifi_disconnect_callback : ()=>void = function(){};

    function wifiReconnect()
    {
        if(wifi_connected == false)
        {
            reconnecting = true;
            wifi_connecting = true;
            Orbit_AT.sendAT("AT+CWJAP=\"" + wifi_ssid + "\",\"" + wifi_pw + "\"", "OK", "ERROR", function () {
                wifi_connecting = false;
                reconnecting = false; 
            },wifiReconnect);
        }
    }

    function init() {
        if (inited)
            return; 
        inited = true; 

        Orbit_AT.addWatcher("WIFI CONNECTED", function (data: string): string {
            wifi_connected = true;
            wifi_connect_callback();
            return "WIFI CONNECTED";
        });
        Orbit_AT.addWatcher("WIFI DISCONNECT", function (data: string): string {
            if(wifi_connected)
            {
                wifi_disconnect_callback();
                wifi_connected = false;
            }
            if(!reconnecting)
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
            Orbit_AT.sendAT("AT+CWJAP=\"" + ssid + "\",\"" + pw + "\"", "OK", "ERROR", function () {
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

    export function setDisconnectCallback(callback: ()=>void)
    {
        wifi_disconnect_callback = callback; 
    }

    export function setConnectCallback(callback: ()=>void)
    {
        wifi_connect_callback = callback; 
    }

}