namespace Orbit_IoT {

    const wifi_ssid :string  = "OrbitLab"
    const wifi_pw :string  = "orbitlab"
    
    let num_rec : {(number: number): void;}[] = [];

    //% block="setup orbitLab cloud" weight=90
    //% subcategory="Orbit TCP"
    export function setupForTCPCloud() {
        Orbit_AT.start();
        WiFi.connect(wifi_ssid, wifi_pw);
        Orbit_TCP.connect();
    }

    //% block="cloud connected %state" weight=70
    //% subcategory="Orbit TCP"
    export function cloudStateTCP(state: boolean) : boolean {
        Orbit_TCP.waitForConnection();
        if (Orbit_TCP.connected() == state) {
            return true
        }
        else {
            return false
        }
    }

    //% block="send group name %name" weight=5
    //% subcategory="Orbit TCP"
    export function sendNameCmdTCP(name: string)
    {
        let packet = Orbit_Format.CreatePacket("name", "\"" + name + "\"");
        Orbit_TCP.send(packet);
    }

    //% block="send a number %value" weight=4
     //% subcategory="Orbit TCP"
    export function sendNumberCmdTCP(value: number)
    {
        let packet = Orbit_Format.CreatePacket("number", value.toString());
        Orbit_TCP.send(packet);
    }

    //% block="send text %text" weight=4
    //% subcategory="Orbit TCP"
    export function sendTextCmdTCP(text: string)
    {
        let packet = Orbit_Format.CreatePacket("text", "\"" + text + "\"");
        Orbit_TCP.send(packet);
    }


    //% block="setup orbitLab cloud with Username %user and password %password" weight=90
    //% subcategory="Orbit MQTT"
    export function setupForMQTTCloud(user: string, password: string) {
        Orbit_AT.start();
        WiFi.connect(wifi_ssid, wifi_pw);

        let serial = control.deviceSerialNumber();
        let topic: string = "ceed/microbit/data/"+serial;
        Orbit_MQTT.connect(topic,user,password);
        Orbit_MQTT.waitForConnection();
    }

    //% block="cloud connected %state" weight=70
    //% subcategory="Orbit MQTT"
    export function cloudStateMQTT(state: boolean) : boolean {
        if (Orbit_MQTT.connected() == state) {
            return true
        }
        else {
            return false
        }
    }

    //% block="send group name %name to server" weight=5
    //% subcategory="Orbit MQTT"
    export function sendNameCmdMQTT(name: string)
    {
        let packet = Orbit_Format.CreatePacket("name", "\"" + name + "\"");
        sendMqttTo(packet, 0);
    }

    //% block="send a number %value to %to (0 is server)" weight=4
    //% subcategory="Orbit MQTT"
    export function sendNumberCmdMQTT(value: number, to: number)
    {
        let packet = Orbit_Format.CreatePacket("number", value.toString());
        sendMqttTo(packet, to);
    }

    //% block="send text %text" weight=4
    //% subcategory="Orbit MQTT"
    export function sendTextCmdMQTT(text: string)
    {
        let packet = Orbit_Format.CreatePacket("text", "\"" + text + "\"");
        sendMqttTo(packet, 0);
    }

    function sendMqttTo(packet: string, to: number) {
        let topic: string = "ceed/microbit/data/"+to.toString();
        Orbit_MQTT.send(packet, topic);
    }


    //% block="Received Number" weight=3
    //% subcategory="Orbit MQTT"
    export function addMQTTNumHandler(handler: (number: number) => void) {
        num_rec.push(handler);
        Orbit_MQTT.setDataCallback(mqtt_packet_callback);
    }

    //% block="MQTT Connected" weight=3
    //% subcategory="Orbit MQTT"
    export function mqttConnected(handler: () => void) {
        Orbit_MQTT.setConnectCallback(handler);
    }

    //% block="MQTT Disconnected" weight=3
    //% subcategory="Orbit MQTT"
    export function mqttDisconnected(handler: () => void) {
        Orbit_MQTT.setDisconnectCallback(handler);
    }
    
    //% block="wifi connected %state"
    //% subcategory="Wifi"
    export function wifiState(state: boolean) : boolean {
        WiFi.waitForConnection();
        if (WiFi.connected() == state) {
            return true
        }
        else {
            return false
        }
    }

    //% block="Wifi Connected" weight=3
    //% subcategory="Wifi"
    export function wifiConnected(handler: () => void) {
        WiFi.setConnectCallback(handler);
    }

    //% block="Wifi Disconnected" weight=3
    //% subcategory="Wifi"
    export function wifiDisconnected(handler: () => void) {
        WiFi.setDisconnectCallback(handler);
    }

    function mqtt_packet_callback(data:string) {
        let payload = Orbit_Format.GetPayload(data);
        if (payload !== "")
        {
            if (Orbit_Format.IsCmdPacket("number", data)) {
                let number = parseFloat(payload);
                num_rec.forEach(callback => {
                    callback(number);
                });
            }
        }    
    }
    
}
