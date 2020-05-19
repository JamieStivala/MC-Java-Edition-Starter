import {promisify} from "util";
import * as mc from "minecraft-protocol";
import * as config from "../resources/config.json";

const promisePing = promisify(mc.ping)
export async function isServerActive() : Promise <boolean>{
    return promisePing({host: config.host}).then((result : mc.NewPingResult) => {return result.players.online > 0;}).catch(() => {return false});
}

export function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}