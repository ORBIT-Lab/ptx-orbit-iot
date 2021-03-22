namespace Orbit_MQTT {

    const endpoint :string = "gigaslack.com"
    const port :string = "8883"

    let mqtt_connected: boolean = false
    let mqtt_connecting: boolean = false
    let inited : boolean = false; 

    let connect_callback : ()=>void = function(){};
    let disconnect_callback : ()=>void = function(){};

    let rec_callback : (packet:string)=> void = function (packet : string) {
    }

    function init() {
        if (inited)
            return; 
        inited = true; 

        Orbit_AT.addWatcher("+MQTTCONNECTED", function (data: string): string {
            mqtt_connected = true;
            if(!mqtt_connecting)
                connect_callback();
            return "+MQTTCONNECTED";
        });
        Orbit_AT.addWatcher("+MQTTDISCONNECTED", function (data: string): string {
            mqtt_connected = false;
            disconnect_callback();
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
        let jsonStart = data.indexOf("{");
        if(jsonStart !== -1)
        {
            let packet : string =  data.substr(jsonStart); 
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

            let serial = control.deviceSerialNumber();
            let micro_id = "mbit"+serial;
            Orbit_AT.sendAT("AT+MQTTUSERCFG=0,2,\""+micro_id+"\",\""+usr+"\",\""+pw+"\",0,0,\"\"", "OK", "ERROR", function()
            {
                Orbit_AT.sendAT("AT+MQTTCONN=0,\""+endpoint+"\","+port+",1", "OK", "ERROR", function()
                {
                    addSubscriber(myTopic);
                    mqtt_connected = true; 
                    mqtt_connecting = false;
                    connect_callback();
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
            text += "\r\n";
            function ignore_callback() { };
            Orbit_AT.sendAT("AT+MQTTPUBRAW=0,\""+topic+"\","+text.length+",1,0", "OK", "ERROR", ignore_callback,ignore_callback);
            Orbit_AT.sendData(text, "+MQTTPUB:OK", "ERROR", ignore_callback, ignore_callback);
        }
    }

    export function setDisconnectCallback(callback: ()=>void)
    {
        disconnect_callback = callback; 
    }

    export function setConnectCallback(callback: ()=>void)
    {
        connect_callback = callback; 
    }

}