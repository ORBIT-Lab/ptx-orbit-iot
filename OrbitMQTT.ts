namespace Orbit_MQTT {

    const endpoint :string = "34.66.72.29"
    const port :string = "1883"

    let mqtt_connected: boolean = false
    let mqtt_connecting: boolean = false
    let inited : boolean = false; 

    function init() {
        if (inited)
            return; 
        inited = true; 

        atcontrol.addWatcher("+MQTTCONNECTED", function (data: string): string {
            mqtt_connected = true;
            return "+MQTTCONNECTED";
        });
        atcontrol.addWatcher("+MQTTDISCONNECTED", function (data: string): string {
            mqtt_connected = false;
            return "+MQTTDISCONNECTED";
        });
    }

    export function connect()
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

            atcontrol.sendAT("AT+MQTTUSERCFG=0,1,\"mbit\",\"\",\"\",0,0,\"\"", "OK", "ERROR", function()
            {
                atcontrol.sendAT("AT+MQTTCONN=0,\""+endpoint+"\","+port+",1", "OK", "ERROR", function()
                {
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
            atcontrol.sendAT("AT+MQTTPUBRAW=0,\""+topic+"\","+text.length+",1,0", "OK", "ERROR", ignore_callback,ignore_callback);
            atcontrol.sendData(text, "SEND OK", "ERROR", ignore_callback, ignore_callback);
        }
    }


}