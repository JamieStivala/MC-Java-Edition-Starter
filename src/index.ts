import {exec} from 'child_process'
import * as mc from 'minecraft-protocol'
import * as config from '../resources/config.json'
import {isServerActive, sleep} from './tools'

function awaitLogin() : Promise <void> {
    return new Promise<void>(resolve => {
        let server = mc.createServer({'online-mode': false, host: '0.0.0.0', port: Number(config.port), version: '1.15.2', motd: "Start server by logging in", maxPlayers: 1});

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
    await sleep(3000);
    let active = await isServerActive();

    console.log((new Date().getTime()) - lastActive.getTime());

    if(active) return checkActivity(new Date(), true);
    else if(!active && !serverStarted) return checkActivity(new Date(), serverStarted);
    else if(!active && serverStarted && (new Date().getTime()) - lastActive.getTime() < config.timeout) return checkActivity(lastActive, serverStarted);
}

async function serverHandler() : Promise <void> {
    await awaitLogin();

    exec('sudo systemctl start ' + config.systemctlService, () => console.log("SystemCTL start initiated"));
    await checkActivity(new Date(), false);

    exec('sudo systemctl stop ' + config.systemctlService, () => console.log("SystemCTL stop initiated"));
    await sleep(60000);

    return serverHandler();
}

serverHandler().catch(error => console.log(error));