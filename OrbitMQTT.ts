namespace Orbit_MQTT {

    const endpoint :string = "gigaslack.com"
    const port :string = "8883"

    let mqtt_connected: boolean = false
    let mqtt_connecting: boolean = false


    function updateTime()
    {
        function emptyFunc() {}
        atcontrol.sendAT("AT+CIPSNTPCFG=1,8,\"ntp1.aliyun.com\"", "OK", "ERROR", emptyFunc, emptyFunc);
        atcontrol.sendAT("AT+CIPSNTPTIME?", "OK", "ERROR",emptyFunc,emptyFunc);
    }


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

            updateTime();
            atcontrol.sendAT("AT+MQTTUSERCFG=0,2,\"mbit\",\"\",\"\",0,0,\"\"", "OK", "ERROR", function()
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