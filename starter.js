let minecraft = require('minecraft-protocol/src/index');

let exec = require('child_process').exec;

function waitForLogin() {
    return new Promise(function (resolve) {
        let server = minecraft.createServer({
            'online-mode': false,
            host: '192.168.0.10',
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

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

function serverStartAndStop() {
    console.log("\n\nAwaiting for login\n\n");
    waitForLogin().then(async () => {
        console.log("User logged in.  Now starting the server");
        await sleep(1000); //Making sure that the port is closed

        exec('sudo systemctl start SMPServer', ()=> console.log("SystemCTL start initiated"));
        await sleep(180000);

        lastActive = new Date();
        pingServerUntilInactivity().then(async function() {
            exec('sudo systemctl stop SMPServer', ()=> console.log("SystemCTL stop initiated"));
            await sleep(180000); //Give the server 3 minutes to stop
            firstTime = true;
            inactive = false;
            lastActive = null;
            serverStartAndStop();
        })
    });
}

let firstTime = true;
let inactive = false;
let lastActive = null;

function pingServerUntilInactivity(){
    return new Promise(async (resolve) => {
        recursionPing("jamiestivala.com", 25565);

        function recursionPing(host, port){
            pingWrapper(host, port).then(async (result) => {
                firstTime = false;

                if(result.players.online === 0){
                    inactive = true;
                    if(new Date().valueOf() - lastActive.valueOf() >= 60000){ //TODO after testing rollback to 10 minutes
                        console.log("server down");
                        resolve(true);
                    }else{
                        inactive = false;
                        lastActive = new Date();
                    }
                }
                await sleep(10000);
                recursionPing(host, port);
            }).catch(async (error) => {
                if(firstTime){
                    await sleep(10000);
                    recursionPing(host, port);
                }else{
                    console.log("Server down or " + error);
                    resolve (false);
                }
            })
        }
    });
}

function pingWrapper(host, port){
    return new Promise((resolve, reject) => {
        minecraft.ping({host: host, port: port}, (error, result) => {
            if(error) reject(error);
            else resolve(result);
        });
    })
}

serverStartAndStop();