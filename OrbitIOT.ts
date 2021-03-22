namespace Orbit_IoT {

    const wifi_ssid :string  = "OrbitLab"
    const wifi_pw :string  = "orbitlab"
    
    let institution_id = "";
    let num_rec : {(number: number): void;}[] = [];


    //% block="setup orbitLab cloud with Username %user and password %password and institution id %institution"  weight=90
    //% block.loc.da="Forbind til orbitLab cloud med brugernavn %user og kode %password og skole id %institution"
    //% subcategory="Orbit MQTT"
    export function setupForMQTTCloud(user: string, password: string, institution : string) {
        Orbit_AT.start();
        if(!WiFi.connected() && !WiFi.connecting())
            WiFi.connect(wifi_ssid, wifi_pw);
        institution_id = institution;
        let serial = control.deviceSerialNumber();
        let topic: string = "ceed/microbit/data/"+serial;
        Orbit_MQTT.connect(topic,user,password);
        Orbit_MQTT.waitForConnection();
    }

    //% block="cloud connected %state" weight=70
    //% block.loc.da="forbundet til cloud %state"
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
    //% block.loc.da="send gruppe navn %name"
    //% subcategory="Orbit MQTT"
    export function sendNameCmdMQTT(name: string)
    {
        let packet = Orbit_Format.CreatePacket("name", name, institution_id);
        sendMqttTo(packet, 0);
    }


    //% block="send a number %value to %to (0 is server)" weight=4
    //% block.loc.da="send nummer %value til %to (0 er hjemmesiden)"
    //% subcategory="Orbit MQTT"
    export function sendNumberCmdMQTT(value: number, to: number)
    {
        let packet = Orbit_Format.CreatePacket("number", value.toString(), institution_id);
        sendMqttTo(packet, to);
    }

    //% block="send text %text" weight=4
    //% block.loc.da="send tekst %text"
    //% subcategory="Orbit MQTT"
    export function sendTextCmdMQTT(text: string)
    {
        let packet = Orbit_Format.CreatePacket("text",text, institution_id);
        sendMqttTo(packet, 0);
    }

    function sendMqttTo(packet: string, to: number) {
        let topic: string = "ceed/microbit/data/"+to.toString();
        Orbit_MQTT.send(packet, topic);
    }


    //% block="Received Number" weight=3
    //% block.loc.da="Nummer modtaget"
    //% subcategory="Orbit MQTT"
    export function addMQTTNumHandler(handler: (number: number) => void) {
        num_rec.push(handler);
        Orbit_MQTT.setDataCallback(mqtt_packet_callback);
    }

    //% block="MQTT Connected" weight=3
    //% block.loc.da="cloud forbundet"
    //% subcategory="Orbit MQTT"
    export function mqttConnected(handler: () => void) {
        Orbit_MQTT.setConnectCallback(handler);
    }

    //% block="MQTT Disconnected" weight=3
    //% block.loc.da="cloud mistet forbindelsen"
    //% subcategory="Orbit MQTT"
    export function mqttDisconnected(handler: () => void) {
        Orbit_MQTT.setDisconnectCallback(handler);
    }
    
    //% block="Connect to hotspot. WiFi name %ssid, password %pw"
    //% block.loc.da="forbind til wifi. WiFi navn %ssid, password %pw"
    //% subcategory="Wifi"
    export function wifiConnect(ssid: string, pw: string) {
        if(!WiFi.connected() && !WiFi.connecting())
        {
            WiFi.connect(ssid, pw);
        }
    }

    //% block="wifi connected %state"
    //% block.loc.da="wifi forbundet %state"
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
    //% block.loc.da="wifi forbundet"
    //% subcategory="Wifi"
    export function wifiConnected(handler: () => void) {
        WiFi.setConnectCallback(handler);
    }

    //% block="Wifi Disconnected" weight=3
    //% block.loc.da="wifi mistet forbindelsen"
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
