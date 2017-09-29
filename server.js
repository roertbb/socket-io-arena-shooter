const express = require('express');
const socket = require('socket.io');
const app = express();
const server = app.listen(3000);
const io = socket(server);

app.use(express.static('public'));

console.log("Starting server...");

let players = [];
let playersData = [];
let bullets = [];
let stats = [];
let packages = [];

let map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,2,2,0,0,0,0,1,1,1,1,1,1,0,0,0,0,2,2,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,2,2,2,2,0,0,0,0,0,0,0,0,0,0,2,2,2,2,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
const t = 20;

const spawningPoints = [{x: 40, y: 120}, {x: 340, y: 120}];

io.on('connection', function(socket) {
    console.log("made socket connection", socket.id);

    socket.on('createPlayer', player => {
        let spawningPoint = spawningPoints[Math.floor(Math.random()*spawningPoints.length)];
        players.push({id: socket.id, name: player.name, color: player.color, hp: 100, gun: "default", ammo: -1, x: spawningPoint.x, y: spawningPoint.y, vx: 0, vy: 0, ground: false, delay: 0});
        playersData.push({id: socket.id, down: []});
        stats.push({id: socket.id, name: player.name, k:0, d:0});
        io.sockets.emit('emitPlayerData', players);
        io.sockets.emit('emitStats', stats);
    })
    
    socket.emit('sendMap', {map: map});

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
      stats = stats.filter(p => p.id !== socket.id);
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

    else if (player !== undefined) {

    if (player.tick == tick) {
        let spawningPoint = spawningPoints[Math.floor(Math.random()*spawningPoints.length)];
        player.hp = 100;
        player.x = spawningPoint.x;
        player.y = spawningPoint.y;
        delete player.tick;
    }

    if (player.hp > 0) {
    
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

    if (mouse !== undefined && player.tick === undefined) {
        if (mouse.pressed && player.delay <= 0) {
            player.delay = 8;
            let angle = Math.atan2(player.mouse.y - player.y-10, player.mouse.x - player.x-10);
            if (player.ammo > 0)
                player.ammo--;
            if (player.ammo === 0) {
                player.gun = "default";
                player.ammo = -1;
            }
            bullets.push({id: player.id, type: player.gun, x: player.x+10, y: player.y+10, vx: Math.cos(angle)*15, vy: Math.sin(angle)*15});
        }
        player.delay--;
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
}

function collTile(x, y) {
    // if (map[Math.floor(y/t)][Math.floor(x/t)] !== 0 ||
    //     map[Math.floor((y+t-2)/t)][Math.floor(x/t)] !== 0 ||
    //     map[Math.floor(y/t)][Math.floor((x+t-2)/t)] !== 0 ||
    //     map[Math.floor((y+t-2)/t)][Math.floor((x+t-2)/t)] !== 0)
    //     return true;
    // else
    //     return false;
    let left_up = map[Math.floor(y/t)][Math.floor(x/t)],
        right_up = map[Math.floor(y/t)][Math.ceil(x/t)],
        left_down = map[Math.ceil(y/t)][Math.floor(x/t)],
        right_down = map[Math.ceil(y/t)][Math.ceil(x/t)];

    if (left_up !== 0 || 
        right_up !== 0 ||
        left_down !== 0 ||
        right_down !== 0) 
        return true;
    else {
        return false;
    }
}

function collBullet(x, y) {
    if (map[Math.floor(y/t)][Math.floor(x/t)] !== 0)
        return true;
    else
        return false;
}

function aabbBullet(player, bullet) {
    if (bullet.x > player.x && bullet.x < player.x+t &&
        bullet.y > player.y && bullet.y < player.y+t)
        return true;
    else
        return false;
}

function aabbToAabb(player, package) {
    if (player.x+t < package.x || package.x+t < player.x ||
        player.y+t < package.y || package.y+t < player.y)
        return false;
    else
        return true;
}

function spawnPackage() {
    const spawnPoints = ["40,180", "340,180", "40,240", "340,240"];
    const type = ["health", "gun1", "gun2"];

    let alreadySpawned = packages.map(package => {
        return String(package.x)+","+String(package.y);
    });

    let availablePoints = spawnPoints.filter(package => {
        return (alreadySpawned.indexOf(package) === -1)
    }).map(package => {
        let cords = package.split(',');
        return {x: Number(cords[0]), y: Number(cords[1])};
    });
    
    let spawnPoint = availablePoints[Math.floor(Math.random()*availablePoints.length)];
    
    packages.push({type: type[Math.floor(Math.random()*type.length)], x: spawnPoint.x, y: spawnPoint.y});    
}

setInterval( function() {
    let statsChanged = false;

    players.forEach(player => {
        let pd = playersData.filter(pd => pd.id == player.id)[0];
        if (pd === undefined)
            pd = {id: player.id, down: []};
        updatePlayer(pd);
        packages.forEach(package => {
            if (aabbToAabb(player,package)) {
                if (package.type === "health")
                    player.hp += 20;
                else {
                    player.gun = package.type;
                    player.ammo = 10;
                }
                packages.splice(packages.indexOf(package),1);
            }
        });
    });

    bullets.forEach(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        players.forEach(player => {
            if (aabbBullet(player,bullet)) {
                if (player.id !== bullet.id) {
                    player.hp -= 20;
                    bullets.splice(bullets.indexOf(bullet),1);
                }    
            }
            if (player.hp <= 0 && player.tick === undefined) {
                player.tick = tick+5;
                player.x = -20;
                player.y = -20;
                stats.forEach(stat => {
                    if (stat.id === player.id) {
                        stat.d++;
                    }
                    else if (stat.id === bullet.id) {
                        stat.k++;
                    }
                });
                statsChanged = true;
            }
        });
        if (collBullet(bullet.x, bullet.y))
            bullets.splice(bullets.indexOf(bullet),1); 
    });

    io.sockets.emit('emitPlayerData', players.filter(player => player.tick == undefined));
    io.sockets.emit('emitBulletData', bullets);
    if (statsChanged)
        io.sockets.emit('emitStats', stats);
    io.sockets.emit('emitPackageData', packages);
}, 30);

let tick = 0;
setInterval( function() {
    tick++;
    io.sockets.emit('tick', {tick: tick});
    if (tick % 10 === 0 && packages.length < 4)
        spawnPackage();
}, 1000);