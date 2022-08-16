// Tilføj din kode her
namespace Orbit_IoT {

    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];


    //% block="Encrypt %data with cesar code %skip" weight=4
    //% block.loc.da="Krypter %data med cesar code %skip"
    //% subcategory="Crypto"
    export function encrypt(data: string, skip: number) : string  {
        let ret : string = ''
        for (let i = 0; i < data.length; i++) 
        {
            let pos = alphabet.indexOf(data[i]);
            if(pos == -1)
                ret += data[i]
            else
                ret += alphabet[(pos + skip) % alphabet.length]
        } 
        return ret
    }

    //% block="Decrypt %data with cesar code %skip" weight=5
    //% block.loc.da="Dekrypter %data med cesar code %skip"
    //% subcategory="Crypto"
    export function decrypt(data: string, skip: number): string {
        let ret: string = ''
        for (let i = 0; i < data.length; i++) {
            let pos = alphabet.indexOf(data[i]);
            if(pos == -1)
                ret += data[i]
            else
            {
                let decrypted_pos = (pos - skip)
                while(decrypted_pos < 0)
                    decrypted_pos = alphabet.length + decrypted_pos
                ret += alphabet[decrypted_pos]
            }
        }
        return ret
    }


}