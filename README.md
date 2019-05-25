# Minecraft Java Edition Server Starter
The purpose of this simple script is to start a Java Edition Server only when somebody is going to use the server rather than being continuously on.  This reduces server load drastically.

### How it works
The concept is very very simple.  Here is how it works:
- Starts an emulated JavaScript, Java Edition Minecraft Server
- Waits for a user to login
- Once a user logs inside the server, the serer the server stops and calls a systemd script (The systemd script in this case would be the Minecraft Server)
- The NodeJS Script then waits for the actual server to start and then pings it every 30 seconds
- Once there are no people inside the server (amount of players inside ping is 0) for 10 minutes, the server stops and goes back into waiting phase

### Future Tasks
[ ] Read server.properties and check if whitelist is on.  If on, read whitelist.json and if they are not whitelisted, don't start the server