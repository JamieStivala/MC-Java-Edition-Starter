import {promisify} from "util";
import * as mc from "minecraft-protocol";

const promisePing = promisify(mc.ping)
export async function isServerActive(host : string) : Promise <boolean>{
    return promisePing({host: host}).then((result : mc.NewPingResult) => {return result.players.online > 0;}).catch(() => {return false});
}

export function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}