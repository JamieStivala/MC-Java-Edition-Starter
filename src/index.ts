import {exec} from 'child_process'
import * as mc from 'minecraft-protocol'
import {isServerActive, sleep} from './tools'

let args = process.argv.slice(2);
let host = args[0];
let port = args[1];
let systemctlService = args[2];
let timeout = args[3];

function awaitLogin() : Promise <void> {
    return new Promise<void>(resolve => {
        let server = mc.createServer({'online-mode': false, host: '0.0.0.0', port: Number(port), version: '1.15.2', motd: "Start server by logging in", maxPlayers: 1});

        server.on('login', client => {
            client.write('login', {entityId: client.uuid, levelType: 'default', gameMode: 0, dimension: 0, difficulty: 2, hashedSeed: [0,0], maxPlayers: server.maxPlayers, reducedDebugInfo: false, seed: 1});
            client.write('position', {x: 0, y: 1.62, z: 0, yaw: 0, pitch: 0, flags: 0x00});
            client.end("Starting server, please wait a minute or two");
            server.close();
            sleep(2000).then(() => resolve());  //Wait for the server monitor to stop
        });
    });
}

async function checkActivity(lastActive : Date, serverStarted : boolean) : Promise<void>{
    await sleep(1000);
    let active = await isServerActive(host);

    if(active) return checkActivity(new Date(), true);
    else if(!active && !serverStarted) return checkActivity(new Date(), serverStarted);
    else if(!active && serverStarted && (new Date().getTime()) - lastActive.getTime() < Number(timeout)) return checkActivity(lastActive, serverStarted);
}

async function serverHandler() : Promise <void> {
    await awaitLogin();

    exec('sudo systemctl start ' + systemctlService, () => console.log("SystemCTL start initiated"));
    await checkActivity(new Date(), false);

    exec('sudo systemctl stop ' + systemctlService, () => console.log("SystemCTL stop initiated"));
    await sleep(60000);

    return serverHandler();
}

serverHandler().catch(error => console.log(error));