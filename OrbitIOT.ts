namespace Orbit_IoT {

    const wifi_ssid :string  = "OrbitLab"
    const wifi_pw :string  = "orbitlab"

    const endpoint :string = "34.66.72.29"
    const port :string = "5000"
    
    function connectMQTT()
    {
        function ignore_callback(){};
        atcontrol.sendAT("AT+MQTTUSERCFG=0,1,\"mbit\",\"\",\"\",0,0,\"\"", "OK", "ERROR", function()
        {
            atcontrol.sendAT("AT+MQTTCONN=0,\""+endpoint+"\",1883,0", "OK", "ERROR", function()
            {
                atcontrol.sendAT("AT+MQTTPUB=0,\"bittest\",\"test3\",1,0", "OK", "ERROR", ignore_callback,ignore_callback);
            },ignore_callback);
        },ignore_callback);
    }


    //% block="setup orbitLab cloud"
    export function setupForCloud()
    {
        atcontrol.start();
        WiFi.connect(wifi_ssid, wifi_pw);
        Orbit_MQTT.connect();
    }

    //% block="cloud connected %state" weight=70
    export function cloudState(state: boolean) : boolean {
        Orbit_MQTT.waitForConnection();
        if (Orbit_MQTT.connected() == state) {
            return true
        }
        else {
            return false
        }
    }

    //% block="wifi connected %state" weight=70
    export function wifiState(state: boolean) : boolean {
        WiFi.waitForConnection();
        if (WiFi.connected() == state) {
            return true
        }
        else {
            return false
        }
    }

    function sendToCloud(cmd: string, value: string)
    {

        let serial = control.deviceSerialNumber();
        let toSendStr = "{"
        toSendStr += "\"uid\":" + serial + ","
        toSendStr += "\"cmd\":\""+cmd+"\","
        toSendStr += "\"payload\":" + value
        toSendStr += "}"
        Orbit_MQTT.send(toSendStr);
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
