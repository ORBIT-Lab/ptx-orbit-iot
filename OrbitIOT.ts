namespace Orbit_IoT {

    const wifi_ssid :string  = "OrbitLab"
    const wifi_pw :string  = "orbitlab"

    const endpoint :string = "34.66.72.29"
    const port :string = "5000"

    let cloud_connected: boolean = false
    let wifi_connected: boolean = false


    function connectWifi(ssid: string, pw: string) : boolean {
        let done: boolean = false; 
        
        atcontrol.sendAT("AT+CWJAP=\"" + ssid + "\",\"" + pw + "\"", "WIFI GOT IP", "ERROR", function () {
            wifi_connected = true;
            done = true;
            },
            function () {
            wifi_connected = false;
            done = true;
            }
        );
        
        while (done == false)
            basic.pause(20);

        return wifi_connected
    }

    function connectOrbitCloud() :boolean
    {
        /*
        if(wifi_connected)
        {
            
            let cmd = "AT+CIPSTART=\"TCP\",\"" + endpoint + "\","+ port
            sendAT(cmd)
            cloud_connected = waitForResponse("CONNECT");
            requireWait(500)
        }
        */
        return cloud_connected;
    }

    //% block="setup orbitLab cloud"
    export function setupForCloud()
    {
        if(cloud_connected == false)
        {
            atcontrol.start();
            //setupESP8266(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200)
            if(connectWifi(wifi_ssid, wifi_pw))
            {
                //connectOrbitCloud()
            }
        }
    }

    //% block="cloud connected %state" weight=70
    export function cloudState(state: boolean) : boolean {
        if (cloud_connected == state) {
            return true
        }
        else {
            return false
        }
    }

    //% block="wifi connected %state" weight=70
    export function wifiState(state: boolean) : boolean {
        if (wifi_connected == state) {
            return true
        }
        else {
            return false
        }
    }

    function sendToCloud(cmd: string, value: string)
    {
        /*
        if(cloud_connected)
        {
            waitForFreeBus()

            let serial = control.deviceSerialNumber();
            let toSendStr = "{"
            toSendStr += "\"uid\":" + serial + ","
            toSendStr += "\"cmd\":\""+cmd+"\","
            toSendStr += "\"payload\":" + value
            toSendStr += "}"

            sendAT("AT+CIPSEND=" + (toSendStr.length + 2), 100)
            sendAT(toSendStr, 100) // upload data
        }
        */
    }

    //% block="send group name %name" weight=5
    export function sendNameCmd(name: string)
    {
        sendToCloud("name", "\""+name+"\"")
    }

    //% block="send a number %value" weight=4
    export function sendNumberCmd(value: number)
    {
        sendToCloud("number", value.toString())
    }

    //% block="send text %text" weight=4
    export function sendTextCmd(text: string)
    {
        sendToCloud("text", "\""+text+"\"")
    }

}
