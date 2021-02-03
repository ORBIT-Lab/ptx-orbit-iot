namespace Orbit_Format
{

    export function CreatePacket(cmd: string, value: string) : string
    {

        let serial = control.deviceSerialNumber();
        let packet = "{"
        packet += "\"uid\":" + serial + ","
        packet += "\"cmd\":\""+cmd+"\","
        packet += "\"payload\":" + value
        packet += "}"
        return packet;
    }


    export function IsCmdPacket(cmd: string, packet: string): boolean {
        return packet.includes("\"cmd\":\"" + cmd + "\"");
    }

    export function GetPayload(packet: string): string {
        let payload_id = "\"payload\":";
        let index = packet.indexOf(payload_id);
        if (index >= 0) {
            index += payload_id.length;
            let end = packet.indexOf("\"", index);
            return packet.substring(index, end);
        }
        return ""
    }


}