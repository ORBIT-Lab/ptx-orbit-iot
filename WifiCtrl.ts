namespace WiFi {

    let wifi_connecting: boolean = false
    let wifi_connected: boolean = false

    export function connect(ssid: string, pw: string) {

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