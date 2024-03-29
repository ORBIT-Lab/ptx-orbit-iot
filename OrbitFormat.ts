namespace Orbit_Format
{

    export function CreatePacket(cmd: string, value: string, institution: string) : string
    {

        let serial = control.deviceSerialNumber();
        let packet = "{"
        packet += "\"uid\":" + serial + ","
        packet += "\"cmd\":\""+cmd+"\","
        packet += "\"payload\":\""+value+"\","
        if(institution !== "")
            packet += "\"institution_uid\":\""+institution+"\""
        packet += "}"
        return packet;
    }

    export function IsCmdPacket(cmd: string, packet: string): boolean {
        return packet.includes("\"cmd\":\"" + cmd + "\"");
    }

    export function GetPayload(packet: string): string {
        let payload_id = "\"payload\":\"";
        let index = packet.indexOf(payload_id);
        if (index >= 0) {
            index += payload_id.length;
            let end = packet.indexOf("\"", index);
            return packet.substr(index, end-index);
        }
        return ""
    }

    export function GetSender(packet: string): number {
        let payload_id = "\"uid\":";
        let index = packet.indexOf(payload_id);
        if (index >= 0) {
            index += payload_id.length;
            let end = packet.indexOf(",", index);
            return parseInt(packet.substr(index, end-index));
        }
        return 0;
    }


}