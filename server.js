const express = require('express');
const socket = require('socket.io');
const app = express();
const server = app.listen(3000);
const io = socket(server);

app.use(express.static('public'));

console.log("Starting server...");

let players = [];

let map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
const t = 20;

io.on('connection', function(socket) {
    console.log("made socket connection", socket.id);
    players.push({id: socket.id, x: 150, y: 150});

    socket.emit('sendMap', {map: map});
    io.sockets.emit('emitPlayerData', players);

    socket.on('sendPlayerData', playerData => {
        updatePlayer(playerData);
        io.sockets.emit('emitPlayerData', players);
    });

    socket.on('disconnect', function(){
      players = players.filter(p => p.id !== socket.id);
      io.sockets.emit('emitPlayerData', players);
      console.log("player", socket.id, "disconnected");
    })
});

function updatePlayer(playerData) {
    let cords = {x:0, y:0}
    if (playerData.down.indexOf('w') !== -1)
        cords.y = -2;
    else if (playerData.down.indexOf('s') !== -1)
        cords.y = 2;
    if (playerData.down.indexOf('a') !== -1)
        cords.x = -2;
    else if (playerData.down.indexOf('d') !== -1)
        cords.x = 2;
    
    players.forEach(player => {
        if (playerData.id == player.id) {
            if (!collTile(player.x+cords.x, player.y))
                player.x += cords.x;
            if (!collTile(player.x, player.y+cords.y))
                player.y += cords.y;
        }
    });
}

function collTile(x, y) {
    if (map[Math.floor(y/t)][Math.floor(x/t)] !== 0 ||
        map[Math.floor((y+t-2)/t)][Math.floor(x/t)] !== 0 ||
        map[Math.floor(y/t)][Math.floor((x+t-2)/t)] !== 0 ||
        map[Math.floor((y+t-2)/t)][Math.floor((x+t-2)/t)] !== 0)
        return true;
    else
        return false;
}

let tick = 0;
setInterval( function() {
    tick++;
    io.sockets.emit('tick', {tick: tick});
}, 1000);