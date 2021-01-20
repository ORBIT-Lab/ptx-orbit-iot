namespace Orbit_MQTT {

    const endpoint :string = "34.66.72.29"
    const port :string = "1883"

    let mqtt_connected: boolean = false
    let mqtt_connecting: boolean = false

    export function connect()
    {
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
                atcontrol.sendAT("AT+MQTTCONN=0,\""+endpoint+"\","+port+",0", "OK", "ERROR", function()
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

    export function send(text: string)
    {
        waitForConnection();
        if (connected()) {
            let topic: string = "ceed/microbit/data";
            function ignore_callback() { };
            atcontrol.sendAT("AT+MQTTPUB=0,\""+topic+"\",\"+text+\",1,0", "OK", "ERROR", ignore_callback,ignore_callback);
        }
    }


}