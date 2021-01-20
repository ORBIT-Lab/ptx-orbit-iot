namespace Orbit_IoT {

    const wifi_ssid :string  = "OrbitLab"
    const wifi_pw :string  = "orbitlab"
    

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
        let topic: string = "ceed/microbit/data/"+0;
        Orbit_MQTT.send(toSendStr, topic);
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
