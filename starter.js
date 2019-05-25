let minecraft = require('minecraft-protocol/src/index');

let exec = require('child_process').exec;

let host = "jamiestivala.com";
let port = 25565;

function waitForLogin() {
    return new Promise(function (resolve) {
        let server = minecraft.createServer({
            'online-mode': false,
            host: '0.0.0.0',
            port: 25565,
            version: '1.14.1',
            motd: "Start server by logging in",
            'max-players': 1
        });

        server.on('login', async function (client) {
            client.write('login', {
                entityId: client.id,
                levelType: 'default',
                gameMode: 0,
                dimension: 0,
                difficulty: 2,
                maxPlayers: server.maxPlayers,
                reducedDebugInfo: false
            });
            client.end("Starting Server\nPlease wait a minute or two");
            server.close();
            resolve();
        });
    });
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

let firstTime = true;
let lastActive = null;

function pingServerUntilInactivity(host, port) {
    console.log("hit test");
    return new Promise((resolve) => {
        pingWrapper(host, port).then(async (result) => {
            firstTime = false;

            if (result.players.online === 0 && new Date().valueOf() - lastActive.valueOf() >= 600000) { //After 10 minutes of inactivity
                console.log("Server Inactive\nStarting stop sequence");
                resolve();
            } else {
                lastActive = new Date();
            }
            await sleep(10000);
            return resolve(pingServerUntilInactivity(host, port));
        }).catch(async (error) => {
            console.log(error);
            if (firstTime) {
                await sleep(10000);
                lastActive = new Date();
                return resolve(pingServerUntilInactivity(host, port));
            } else {
                console.log("Server down or " + error);
                return resolve();
            }
        })
    });
}

function pingWrapper(host, port) {
    return new Promise((resolve, reject) => {
        minecraft.ping({host: host, port: port}, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    })
}

function serverStartAndStop() {
    console.log("\n\nAwaiting for login\n\n");
    waitForLogin().then(async () => {
        console.log("User logged in.  Now starting the server");
        await sleep(1000); //Making sure that the port is closed

        exec('sudo systemctl start SMPServer', () => console.log("SystemCTL start initiated"));
        await sleep(120000);  //Give the server 2 minutes to stop

        lastActive = new Date();
        pingServerUntilInactivity(host, port).finally(async function () {
            console.log("Server inactive.  Going back to waiting stage");
            exec('sudo systemctl stop SMPServer', () => console.log("SystemCTL stop initiated"));
            await sleep(120000); //Give the server 2 minutes to stop
            firstTime = true;
            lastActive = null;
            serverStartAndStop();
        })
    });
}

serverStartAndStop();