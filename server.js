const express = require('express'),
    socket = require('socket.io'),
    app = express(),
    server = app.listen(3000),
    io = socket(server);

app.use(express.static('public'));

console.log('Starting server...');

// data
let players = [],
    playersData = [],
    bullets = [],
    stats = [],
    packages = [],
    time = 0;

// consts
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,3,3,0,0,0,0,2,2,2,2,2,2,0,0,0,0,3,3,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,3,3,3,3,0,0,0,0,0,0,0,0,0,0,3,3,3,3,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1]
    ];

const t = 20,
    spawnPoints = [{x: 40, y: 120}, {x: 340, y: 120}],
    bulletSpeed = {
        "default": 15,
        "gun1": 20,
        "gun2": 12
    },
    bulletDelay =  {
        "default": 8,
        "gun1": 15,
        "gun2": 12
    },
    bulletAmmo = {
        "default": -1,
        "gun1": 8,
        "gun2": 10,
    },
    bulletDamage = {
        "default": 20,
        "gun1": 60,
        "gun2": 40
    },
    packageSpawnPoints = [{x: 40, y: 180}, {x: 340, y: 180}, {x: 40, y: 240}, {x: 340, y: 240}],
    packageType = ["health", "gun1", "gun2"],
    packageHealth = 20,
    packageSpawnTime = 10,
    playerMaxFrame = 5;

// socket connection event
io.on('connection', function(socket) {
    console.log('Made socket connection with', socket.id);

    socket.on('createPlayer', data => {
        createPlayer(data, socket.id)
        io.sockets.emit('serverData', {
            players: players,
            stats: stats
        })
    });

    socket.emit('sendMap', {map: map});

    socket.on('clientData', playerData => {
        playersData.forEach(pd => {
            if (pd.id === playerData.id) {
                pd.down = playerData.down;
                pd.mouse = playerData.mouse;
            }
        });
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        stats = stats.filter(p => p.id !== socket.id);
        io.sockets.emit('serverData', {
            players: players,
            stats: stats
        });
    });
});

function createPlayer(playerData, socketId) {
    let spawningPoint = spawnPoints[Math.floor(Math.random()*spawnPoints.length)];
    players.push({
        id: socketId,
        name: playerData.name,
        color: playerData.color,
        hp: 100,
        gun: "default",
        ammo: -1,
        x: spawningPoint.x,
        y: spawningPoint.y,
        vx: 0,
        vy: 0,
        ground: false,
        tillNextBullet: 0,
        sprite: {
            frame: 0,
            tillNext: 0,
        }
        //respawnAt
    });
    playersData.push({
        id: socketId,
        down: [],
        mouse: undefined
    });
    stats.push({
        id: socketId,
        name: playerData.name,
        k: 0,
        d: 0
    });
}

function rectToTile(rect, tile = map) {
    let left_up = tile[Math.floor(rect.y/t)][Math.floor(rect.x/t)],
        right_up = tile[Math.floor(rect.y/t)][Math.ceil(rect.x/t)],
        left_down = tile[Math.ceil(rect.y/t)][Math.floor(rect.x/t)],
        right_down = tile[Math.ceil(rect.y/t)][Math.ceil(rect.x/t)];
    
    // if (((left_up === 3 && right_up === 3) || (left_up === 3 && right_up === 0) || (left_up === 0 && right_up === 3) || (left_up === 0 && right_up === 0)) && 
    //     ((left_down === 3 && right_down === 3) || (left_down === 3 && right_down === 0) || (left_down === 0 && right_down === 3) && 
    //     ((left_down === 0 && right_down === 0) || (left_up === 0 && right_up === 0))))
    //     return false;
    if (left_up === 1 || right_up === 1 ||  left_down === 1 || right_down === 1 || 
        left_up === 2 || right_up === 2 ||  left_down === 2 || right_down === 2 || 
        left_up === 3 || right_up === 3 ||  left_down === 3 || right_down === 3) 
        return true;
    else {
        return false;
    }
}

function pointToTile(point, tile = map) {
    if (tile[Math.floor(point.y/t)][Math.floor(point.x/t)] !== 0)
        return true;
    else
        return false;
}

function rectToPoint(rect, point) {
    if (point.x < rect.x || point.x > rect.x+t ||
        point.y < rect.y || point.y > rect.y+t)
        return false;
    else
        return true;
}

function rectToRect(rect1, rect2) {
    if (rect1.x+t < rect2.x || rect2.x+t < rect1.x ||
        rect1.y+t < rect2.y || rect2.y+t < rect1.y)
        return false;
    else
        return true;
}

function spawnPackage() {
    let alreadySpawned = packages.map(point => {
            return String(point.x)+','+String(point.y);
        }),
        availablePoints = packageSpawnPoints.map(point => {
            return String(point.x)+','+String(point.y);
        }).filter(point => {
            return (alreadySpawned.indexOf(point) === -1)
        }).map(point => {
            let cords = point.split(',');
            return {x: Number(cords[0]), y: Number(cords[1])};
        }),
        spawnPoint = availablePoints[Math.floor(Math.random()*availablePoints.length)];

    packages.push({type: packageType[Math.floor(Math.random()*packageType.length)], x: spawnPoint.x, y: spawnPoint.y});
}

function updatePlayer(playerData = {id: player.id, down: []}) {
    let player = players.filter(p => p.id === playerData.id)[0];

    if (playerData.down === undefined)
        playerData.down = [];

    if (playerData.mouse === undefined)
        playerData.mouse = {x: undefined, Y: undefined};

    if (player !== undefined) {

        if (player.respawnAt === time) {
            let spawningPoint = spawnPoints[Math.floor(Math.random()*spawnPoints.length)];
            player.hp = 100,
            player.gun = "default";
            player.ammo = -1;
            player.x = spawningPoint.x;
            player.y = spawningPoint.y;
            delete player.respawnAt;
        }

        if (player.hp > 0) {
            if (playerData.down.indexOf('a') !== -1) {
                if (player.vx > -5)
                    player.vx -= 0.5;
            }
            else if (playerData.down.indexOf('d') !== -1) {
                if (player.vx < 5)
                    player.vx += 0.5;
            }
            else {
                if (player.vx > 0)
                    player.vx -= 0.5;
                else if (player.vx < 0)
                    player.vx += 0.5;
            }

            if (playerData.down.indexOf('w') !== -1 && player.ground) {
                player.vy = -9.5;
                player.ground = false;
            }

            player.ground = false;
            if (rectToTile({x: player.x, y: player.y+1}, map))
                player.ground = true;
            if (!player.ground) {
                player.vy += 0.8;
            }

            if (!rectToTile({x: player.x+player.vx, y: player.y}, map))
                player.x += player.vx;
            else {
                do {
                    if (player.vx > 0)
                        player.vx -= 0.5;
                    else if (player.vx < 0)
                        player.vx +=0.5;
                } while(rectToTile({x: player.x+player.vx, y: player.y}, map));
                player.x += player.vx;
            }

            if (!rectToTile({x: player.x, y: player.y+player.vy}, map))
                player.y += player.vy;
            else {
                do {
                    if (player.vy > 0)
                        player.vy -= 0.5;
                    else if (player.vy < 0)
                        player.vy += 0.5;
                } while(rectToTile({x: player.x, y: player.y+player.vy}, map));
                player.y += player.vy;
                if (player.vy > 0)
                    player.ground = true;
                player.vy = 0;
            }

            // shooting bullets
            if (playerData.mouse !== undefined && player.respawnAt === undefined) {
                if (playerData.mouse.pressed && player.tillNextBullet <= 0) {
                    player.tillNextBullet = bulletDelay[player.gun];
                    let angle = Math.atan2(playerData.mouse.y - player.y-10, playerData.mouse.x - player.x - 10);
                    if (player.ammo > 0)
                        player.ammo--;
                    if (player.ammo === 0) {
                        player.gun = 'default';
                        player.ammo = -1;
                    }
                    
                    bullets.push({
                        id: player.id,
                        type: player.gun,
                        x: player.x+10,
                        y: player.y+12,
                        vx: Math.cos(angle)*bulletSpeed[player.gun],
                        vy: Math.sin(angle)*bulletSpeed[player.gun]
                    });
                }
                player.tillNextBullet--;
            }

            // managing sprites
            if (player.vx === 0 && player.vy === 0) {
                // staying
                player.sprite.frame = 0;
                player.sprite.tillNext = -1;
            }
            else if (player.vy !== 0) {
                // jumping
                player.sprite.frame = -1
                player.sprite.tillNext = -1
            }
            else if (player.vx !== 0 && player.vy === 0) {
                // moving
                if (player.sprite.frame < 1) {
                    player.sprite.frame = 1;
                    player.sprite.tillNext = 5;
                }

                player.sprite.tillNext--;
                if (player.sprite.tillNext <= 0) {
                    player.sprite.tillNext = 5;
                    player.sprite.frame++;
                    if (player.sprite.frame === playerMaxFrame)
                        player.sprite.frame = 1;
                }
            }

            if (playerData.mouse.x !== undefined);
                player.sprite.turned = (player.x+15 < playerData.mouse.x)?"right":"left";

            players.forEach(p => {
                if (p.id === player.id) {
                    p.x = player.x;
                    p.y = player.y;
                    p.dx = player.dx;
                    p.dy = player.dy;
                    p.ground = player.ground;
                    p.mouse = playerData.mouse;
                    p.sprite = player.sprite;
                }
            });
        }
    }
}

// main interval
setInterval(() => {
    let statsChanged = false;

    players.forEach(player => {
        let pd = playersData.filter(pd => pd.id === player.id)[0];
        updatePlayer(pd);
        packages.forEach(package => {
            if (rectToRect({x: player.x, y: player.y}, {x: package.x, y: package.y})) {
                if (package.type === "health")
                    player.hp += packageHealth;
                else {
                    player.gun = package.type;
                    player.ammo = bulletAmmo[package.type];
                }
                packages.splice(packages.indexOf(package), 1);
            }
        });
    });

    bullets.forEach(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        players.forEach(player => {
            //TODO: change - rectToCircle
            if (player.id !== bullet.id && rectToPoint({x: player.x, y: player.y}, {x: bullet.x, y: bullet.y})) {
                // TODO: collision type depend on bullet
                player.hp -= bulletDamage[bullet.type];
                bullets.splice(bullets.indexOf(bullet),1);
            }
            if (player.hp <= 0 && player.respawnAt === undefined) {
                player.respawnAt = time+5;
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
        if (pointToTile({x: bullet.x, y: bullet.y}, map))
            bullets.splice(bullets.indexOf(bullet),1);
    });

    let data = {
        players: players.filter(player => player.respawnAt === undefined),
        bullets: bullets,
        packages: packages,
        stats: stats
    }

    io.sockets.emit('serverData', data);
}, 30);

// time interval
setInterval(() => {
    time++;
    io.sockets.emit('time', {time: time});
    if (time % packageSpawnTime === 0 && packages.length < packageSpawnPoints.length)
        spawnPackage();
}, 1000);