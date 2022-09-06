namespace Orbit_IoT {

    const wifi_ssid: string = "OrbitLab"
    const wifi_pw: string = "orbitlab"

    let institution_id = "";

    let mqtt_number_event_callback: (data: number, sender: number, topic: string) => void = function (d: number, s: number) { };
    let mqtt_text_event_callback: (data: string, sender: number, topic: string) => void = function (d: string, s: number) { };
    let topics = "";
    let root = "";
    //% block="send a number %value to Channel %topics" weight=3
    //% block.loc.da="send nummer %value to Kanal %topics"
    //% subcategory="Orbit MQTT"
    export function sendNumberCmdMQTTTopic(value: number, topics: string) {
        let packet = Orbit_Format.CreatePacket("number", value.toString(), institution_id);
        sendMqttToTopic(packet, topics);
    }

    //% block="send text %text to Channel %topic " weight=3
    //% block.loc.da="send tekst %text til Kanal %topic"
    //% subcategory="Orbit MQTT"
    export function sendTextCmdMQTTTopic(text: string, topics: string) {
        text = text.trim();
        let packet = Orbit_Format.CreatePacket("text", text, institution_id);
        sendMqttToTopic(packet, topics);
    }
    function sendMqttToTopic(packet: string, topics: string) {

        if (topics === "") {
            topics = "testTopic";

        } else {
            topics = topics


        }
        topics = topics
        let topic: string = "ceed/microbit/topic/" + topics;

        Orbit_MQTT.send(packet, topic);
    }


    //% block="listen on Channel%topic" weight=3
    //% block.loc.da="lyt på Kanal %topics"
    //% subcategory="Orbit MQTT"
    export function addSubscribersToTopic(topics: string) {
        let topic: string = "ceed/microbit/topic/" + topics;
        Orbit_MQTT.addSubscriber(topic)
    }





    //% block="Setup ORBIT Cloud with Username %user and password %password and institution id %institution"  weight=90
    //% block.loc.da="Forbind til ORBIT Cloud med brugernavn %user og kode %password og skole id %institution"
    //% subcategory="Orbit MQTT"
    export function setupForMQTTCloud(user: string, password: string, institution: string) {
        user = user.trim();
        password = password.trim();
        institution = institution.trim();

        Orbit_AT.start();
        if (!WiFi.connected() && !WiFi.connecting())
            WiFi.connect(wifi_ssid, wifi_pw);
        institution_id = institution;
        let serial = control.deviceSerialNumber();
        let topic: string = "ceed/microbit/data/" + serial;
        Orbit_MQTT.connect(topic, user, password);
        Orbit_MQTT.waitForConnection();
    }

    //% block="Connected to Cloud %state" weight=1
    //% block.loc.da="Forbundet til Cloud %state"
    //% subcategory="Orbit MQTT"
    export function cloudStateMQTT(state: boolean): boolean {
        if (Orbit_MQTT.connected() == state) {
            return true
        }
        else {
            return false
        }
    }

    /* removed as a block */
    function sendNameCmdMQTT(name: string) {
        name = name.trim();
        let packet = Orbit_Format.CreatePacket("name", name, institution_id);
        sendMqttTo(packet, 0);
    }


    /* removed as block */
    function sendNumberCmdMQTT(value: number, to: number) {
        let packet = Orbit_Format.CreatePacket("number", value.toString(), institution_id);
        sendMqttTo(packet, to);
    }

    /* removed as block */
    function sendTextCmdMQTT(text: string, to: number) {
        text = text.trim();
        let packet = Orbit_Format.CreatePacket("text", text, institution_id);
        sendMqttTo(packet, to);
    }

    function sendMqttTo(packet: string, to: number) {
        let topic: string = "ceed/microbit/data/" + to.toString();
        Orbit_MQTT.send(packet, topic);
    }


    //% block="Received Number" weight=2
    //% block.loc.da="Nummer modtaget"
    //% subcategory="Orbit MQTT"
    export function addMQTTNumHandler(handler: (number: number, from: number, channel: string) => void) {
        mqtt_number_event_callback = handler;
        Orbit_MQTT.setDataCallback(mqtt_packet_callback);
    }

    //% block="Received Text" weight=2
    //% block.loc.da="Tekst modtaget"
    //% subcategory="Orbit MQTT"
    export function addMQTTTextHandler(handler: (text: string, from: number, channel: string) => void) {
        mqtt_text_event_callback = handler;
        Orbit_MQTT.setDataCallback(mqtt_packet_callback);
    }

    //% block="MQTT Connected" weight=1
    //% block.loc.da="cloud forbundet"
    //% subcategory="Orbit MQTT"
    export function mqttConnected(handler: () => void) {
        Orbit_MQTT.setConnectCallback(handler);
    }

    //% block="MQTT Disconnected" weight=1
    //% block.loc.da="cloud mistet forbindelsen"
    //% subcategory="Orbit MQTT"
    export function mqttDisconnected(handler: () => void) {
        Orbit_MQTT.setDisconnectCallback(handler);
    }

    //% block="Connect to hotspot. WiFi name %ssid, password %pw"
    //% block.loc.da="forbind til wifi. WiFi navn %ssid, password %pw"
    //% subcategory="Wifi"
    export function wifiConnect(ssid: string, pw: string) {
        ssid = ssid.trim();
        pw = pw.trim();

        Orbit_AT.start();
        if (!WiFi.connected() && !WiFi.connecting()) {
            WiFi.connect(ssid, pw);
        }
    }

    //% block="wifi connected %state"
    //% block.loc.da="wifi forbundet %state"
    //% subcategory="Wifi"
    export function wifiState(state: boolean): boolean {
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

    function mqtt_packet_callback(data: string, topic: string) {
        let payload = Orbit_Format.GetPayload(data);
        let from: number = Orbit_Format.GetSender(data);
        if (payload !== "") {
            if (Orbit_Format.IsCmdPacket("number", data)) {
                let number = parseFloat(payload);
                mqtt_number_event_callback(number, from, topic);
            }
            else if (Orbit_Format.IsCmdPacket("text", data)) {
                mqtt_text_event_callback(payload, from, topic);
            }
        }
    }

}
