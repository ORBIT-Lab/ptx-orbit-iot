namespace Orbit_MQTT {

    const endpoint :string = "gigaslack.com"
    const port :string = "8883"

    let mqtt_connected: boolean = false
    let mqtt_connecting: boolean = false
    let inited : boolean = false; 

    let rec_callback : (packet:string)=> void = function (packet : string) {
        
    }

    function init() {
        if (inited)
            return; 
        inited = true; 

        Orbit_AT.addWatcher("+MQTTCONNECTED", function (data: string): string {
            mqtt_connected = true;
            return "+MQTTCONNECTED";
        });
        Orbit_AT.addWatcher("+MQTTDISCONNECTED", function (data: string): string {
            mqtt_connected = false;
            return "+MQTTDISCONNECTED";
        });
        Orbit_AT.addWatcher("+MQTTSUBRECV", subscriptionCallback);
    }

    function addSubscriber(topic: string)
    {
        function empty(){}
        Orbit_AT.sendAT("AT+MQTTSUB=0,\""+topic+"\",1", "OK", "ERROR",empty,empty);
    }

    function subscriptionCallback(data: string): string 
    {
        let jsonEnd = data.indexOf("}");
        let jsonStart = data.indexOf("{");

        if(jsonEnd !== -1 && jsonStart !== -1)
        {
            let packet : string =  data.slice(0, jsonEnd+1); 
            rec_callback(packet);
            return packet;
        }
        return "";
    }

    export function setDataCallback(callback: (packet:string)=> void) {
        rec_callback = callback; 
    }

    export function connect(myTopic: string, usr: string, pw: string)
    {
        init();
        WiFi.waitForConnection();
        if(WiFi.connected() && mqtt_connecting === false && mqtt_connected === false)
        {
            mqtt_connecting = true;

            function mqttConnectionError()
            {
                mqtt_connected = false;  
                mqtt_connecting = false;
            }

            Orbit_AT.sendAT("AT+MQTTUSERCFG=0,2,\"mbit\",\""+usr+"\",\""+pw+"\",0,0,\"\"", "OK", "ERROR", function()
            {
                Orbit_AT.sendAT("AT+MQTTCONN=0,\""+endpoint+"\","+port+",1", "OK", "ERROR", function()
                {
                    addSubscriber(myTopic);
                    mqtt_connected = true; 
                    mqtt_connecting = false;
                },mqttConnectionError);
            }, mqttConnectionError);
        }
    }
    
    export function waitForConnection()
    {
        while (mqtt_connecting)
            basic.pause(20);
    }

    export function connecting(): boolean
    {
        return mqtt_connecting;
    }

    export function connected(): boolean
    {
        return mqtt_connected;
    }

    export function send(text: string, topic: string)
    {
        waitForConnection();
        if (connected()) {
            function ignore_callback() { };
            Orbit_AT.sendAT("AT+MQTTPUBRAW=0,\""+topic+"\","+text.length+",1,0", "OK", "ERROR", ignore_callback,ignore_callback);
            Orbit_AT.sendData(text, "SEND OK", "ERROR", ignore_callback, ignore_callback);
        }
    }


}