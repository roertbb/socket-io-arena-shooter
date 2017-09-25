const express = require('express');
const socket = require('socket.io');
const app = express();
const server = app.listen(3000);
const io = socket(server);

app.use(express.static('public'));

console.log("Starting server...");

let players = [];
let playersData = [];

let map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
const t = 20;

io.on('connection', function(socket) {
    console.log("made socket connection", socket.id);
    players.push({id: socket.id, x: 150, y: 150, vx: 0, vy: 0, ground: false});
    playersData.push({id: socket.id, down: []});

    socket.emit('sendMap', {map: map});
    io.sockets.emit('emitPlayerData', players);

    socket.on('sendPlayerData', playerData => {
        playersData.forEach(pd => {
            if (pd.id === playerData.id) {
                pd.down = playerData.down;
                pd.mouse = playerData.mouse;
            }
        });
        // updatePlayer(playerData);
        // io.sockets.emit('emitPlayerData', players);
    });

    socket.on('disconnect', function(){
      players = players.filter(p => p.id !== socket.id);
      io.sockets.emit('emitPlayerData', players);
      console.log("player", socket.id, "disconnected");
    })
});

// function updatePlayer(playerData) {
//     let cords = {x:0, y:0}
//     if (playerData.down.indexOf('w') !== -1)
//         cords.y = -2;
//     else if (playerData.down.indexOf('s') !== -1)
//         cords.y = 2;
//     if (playerData.down.indexOf('a') !== -1)
//         cords.x = -2;
//     else if (playerData.down.indexOf('d') !== -1)
//         cords.x = 2;
    
//     players.forEach(player => {
//         if (playerData.id == player.id) {
//             if (!collTile(player.x+cords.x, player.y))
//                 player.x += cords.x;
//             if (!collTile(player.x, player.y+cords.y))
//                 player.y += cords.y;
//         }
//     });
// }

function updatePlayer(playerData) {
    // console.log(playerData);
    let player = players.filter(p => p.id === playerData.id)[0];
    let down = playerData.down;
    let mouse = playerData.mouse;
    
    if (down === undefined)
        down = [];

    // console.log(down);

    if (player !== undefined) {

    if (down.indexOf('a') !== -1) {
        if (player.vx > -5)
            player.vx -= 0.5;
    }
    else if (down.indexOf('d') !== -1) {
        if (player.vx < 5)
            player.vx += 0.5;
    }
    else {
        if (player.vx > 0)
            player.vx -= 0.5;
        else if (player.vx < 0)
            player.vx += 0.5;
    }

    if (down.indexOf('w') !== -1 && player.ground) {
        player.vy = -9.5;
        player.ground = false;
    }

    player.ground = false;
    if (collTile(player.x, player.y+1))
        player.ground = true;
    if (!player.ground) {
            player.vy+=0.8;
    }

    if (!collTile(player.x+player.vx, player.y))
        player.x += player.vx;
    else {
        do {
            if (player.vx > 0)
                player.vx -= 0.5;
            else if (player.vx < 0)
                player.vx += 0.5;
        } while(collTile(player.x+player.vx, player.y))
        player.x += player.vx;
    }

    if (!collTile(player.x, player.y+player.vy))
        player.y += player.vy;
    else {
        do {
            if (player.vy > 0)
                player.vy -= 0.5;
            else if (player.vy < 0)
                player.vy += 0.5;
        } while(collTile(player.x, player.y + player.vy))
        player.y += player.vy;
        if (player.vy > 0)
            player.ground = true;
        player.vy = 0;
    }

    players.forEach(p => {
        if (p.id == player.id) {
            p.x = player.x;
            p.y = player.y;
            p.dx = player.dx;
            p.dy = player.dy;
            p.ground = player.ground;
            p.mouse = mouse;
        }
    });

    }
}

function collTile(x, y) {
    // if (map[Math.floor(y/t)][Math.floor(x/t)] !== 0 ||
    //     map[Math.floor((y+t-2)/t)][Math.floor(x/t)] !== 0 ||
    //     map[Math.floor(y/t)][Math.floor((x+t-2)/t)] !== 0 ||
    //     map[Math.floor((y+t-2)/t)][Math.floor((x+t-2)/t)] !== 0)
    //     return true;
    // else
    //     return false;
    if (map[Math.floor(y/t)][Math.floor(x/t)] !== 0 || 
        map[Math.ceil(y/t)][Math.floor(x/t)] !== 0 ||
        map[Math.floor(y/t)][Math.ceil(x/t)] !== 0 ||
        map[Math.ceil(y/t)][Math.ceil(x/t)] !== 0) 
        return true;
    else 
        return false;
}

setInterval( function() {
    players.forEach(player => {
        let pd = playersData.filter(pd => pd.id == player.id)[0];
        if (pd === undefined)
            pd = {id: player.id, down: []};
        updatePlayer(pd);
    });

    io.sockets.emit('emitPlayerData', players);
}, 30);

let tick = 0;
setInterval( function() {
    tick++;
    io.sockets.emit('tick', {tick: tick});
}, 1000);