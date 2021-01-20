namespace Orbit_TCP {

    const endpoint :string = "34.66.72.29"
    const port :string = "5000"

    let cloud_connected: boolean = false
    let cloud_connecting: boolean = false

    export function connect()
    {
        WiFi.waitForConnection();
        if(WiFi.connected() && cloud_connecting === false && cloud_connected === false)
        {
            cloud_connecting = true;
            let cmd = "AT+CIPSTART=\"TCP\",\"" + endpoint + "\","+ port
            atcontrol.sendAT(cmd, "CONNECT", "ERROR", function()
            {
                cloud_connected = true; 
                cloud_connecting = false;
            },
            function(){
                cloud_connected = false;  
                cloud_connecting = false;
            })
        }
    }
    
    export function waitForConnection()
    {
        while (cloud_connecting)
            basic.pause(20);
    }

    export function connecting(): boolean
    {
        return cloud_connecting;
    }

    export function connected(): boolean
    {
        return cloud_connected;
    }

    export function send(text: string)
    {
        waitForConnection();
        if (connected()) {
            function ignore_callback() { };
            atcontrol.sendAT("AT+CIPSEND=" + text.length.toString(), "OK", "ERROR", ignore_callback, ignore_callback);
            atcontrol.sendData(text, "SEND OK", "ERROR", ignore_callback, ignore_callback);
        }
    }


}