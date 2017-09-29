// const socket = io.connect('http://localhost:3000');
// const socket = io.connect('http://192.168.56.1:3000'); // virtualbox ipv4
let socket = io.connect('http://192.168.1.101:3000'); // wireless ipv4

let canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    w = canvas.width =  400;
    h = canvas.height = 280;

let Key = {
	pressed: {},
	keys: {w: 87, s: 83, a: 65, d: 68, t: 84},
	isDown: function (keyCode) { return this.pressed[this.keys[keyCode]]; },
	onKeyDown: function (event) { this.pressed[event.keyCode] = true; },
    onKeyUp: function (event) { delete this.pressed[event.keyCode]; },
    mouse: {x: 0, y: 0, pressed: false, delay: 0}
};
window.addEventListener('keyup', (event) => { Key.onKeyUp(event); }, false);
window.addEventListener('keydown', (event) => { Key.onKeyDown(event); }, false);
window.addEventListener('mousemove', (event) => { getMouseCords(event); }, false);
window.addEventListener('mousedown', (event) => { Key.mouse.pressed = true; });
window.addEventListener('mouseup', (event) => { Key.mouse.pressed = false; });

function getMouseCords(event) {
    let rect = canvas.getBoundingClientRect();
    Key.mouse.x = event.clientX-rect.left;
    Key.mouse.y = event.clientY-rect.top;
}

let players = [];
let bullets = [];
let stats = [];
let packages = [];
let map = undefined;
let tick = 0;
let loggedIn = false;

function move() {
    let player = {
        id: socket.id,
        down: [],
        mouse: {x: Key.mouse.x, y: Key.mouse.y, pressed: Key.mouse.pressed, delay: Key.mouse.delay}
    };

    if (Key.isDown('w'))
        player.down.push('w');
    else if (Key.isDown('s'))
        player.down.push('s');
    if (Key.isDown('a'))
        player.down.push('a');
    else if (Key.isDown('d'))
        player.down.push('d');

    // if (player.down.length !== 0)
        socket.emit('sendPlayerData', player);
}

const t = 20;
const colors = ["red", "blue", "green", "yellow"];
const packageType = ["gun1", "gun2", "health"];
const gunType = ["default", "gun1", "gun2"];
const bulletType = {
    "default": "#fff",
    "gun1": "#832",
    "gun2": "#3f4"
};

function draw() {
    let dead = false;
    
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#757575";
    ctx.fillRect(0,0,w,h);

    ctx.fillStyle = "#353535";
    if (map !== undefined) {
        for (let i=0; i<map[0].length; i++) {
            for (let j=0; j<map.length; j++) {
                if (map[j][i] !== 0) {
                    if (map[j][i] === 1)
                        ctx.fillStyle = "#353535"
                    else if (map[j][i] === 2)
                        ctx.fillStyle = "#8B4513"
                    ctx.fillRect(i*t, j*t, t, t);
                }
            }
        }
    }
    let hp, ammo;

    players.forEach(player => {
        // draw hero
        if (player.mouse !== undefined && player.x+15 < player.mouse.x)
            ctx.drawImage(imgHero, 0, colors.indexOf(player.color)*t, t, t, player.x, player.y, t, t);
        else
            ctx.drawImage(imgHero, t, colors.indexOf(player.color)*t, t, t, player.x, player.y, t, t);

        if (player.id == socket.id) {
            hp = player.hp;
            ammo = player.ammo;
        }

        // draw gun
        if (player.mouse !== undefined) {
            let dy = player.mouse.y - player.y-10,
                dx = player.mouse.x - player.x-10,
                angle = Math.atan2(dy, dx);
            
            ctx.translate( player.x+10, player.y+5 );
            ctx.rotate( angle );
            if (player.mouse !== undefined && player.x+15 > player.mouse.x)
                ctx.scale(1,-1);
            ctx.drawImage( imgGun, gunType.indexOf(player.gun)*t, 0, t, 15, 0, 0, t, 15);
            if (player.mouse !== undefined && player.x+15 > player.mouse.x)
                ctx.scale(1,-1);
            ctx.rotate( -angle );
            ctx.translate( -player.x-10, -player.y-5 );
        }
    });

    bullets.forEach(bullet => {
        ctx.fillStyle = bulletType[bullet.type];
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI*2);
        ctx.fill();
    });

    ctx.fillStyle = "#384";
    packages.forEach(package => {
        //ctx.fillRect(package.x, package.y, t, t);
        ctx.drawImage(imgPackage, packageType.indexOf(package.type)*t, 0 ,t, t, package.x, package.y, t, t);
    });

    //info bar
    ctx.font = "14px arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${tick}`, 5, 15);
    ctx.fillText(`x:${Key.mouse.x} y:${Key.mouse.y}`, 5, 30);
    ctx.fillText(`HP: ${hp}`, 5, 45);
    ctx.fillText(`ammo: ${ammo===-1?"unlimited":ammo}`, 5, 60);

    //cursor
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.arc(Key.mouse.x,Key.mouse.y,5,0,Math.PI*2);
    ctx.stroke();

    let playersIDs = players.map(player => player.id);

    if (playersIDs.indexOf(socket.id) === -1) {
        ctx.fillStyle = "rgba(53,53,53,0.6)";
        ctx.fillRect(0,0,w,h);

        ctx.fillStyle = "#fff";
        if (loggedIn) {
            // draw.proper.fill
            ctx.fillText("You died!",w/2-40,h/2);
            ctx.fillText(`respawning in 5 seconds`,w/2-80,h/2+20);
        }
        else {
            // must have died
            ctx.fillText("please customize and hit play button!",w/2-120,h/2);
        }
    }

    if (Key.isDown('t')) {
        ctx.fillStyle = "rgba(53,53,53,0.6)";
        ctx.fillRect(0,0,w,h);

        ctx.fillStyle = "#fff";
        let y = 0;
        ctx.fillText(`kills       deaths`,150,30);
        stats.forEach(stat => {
            ctx.fillText(`${stat.name}`,50,50+y);
            ctx.fillText(`${stat.k}`,150,50+y);
            ctx.fillText(`${stat.d}`,200,50+y);
            y+=20;
        });
    }
}

socket.on('emitPlayerData', data => {
    players = data;
});

socket.on('emitBulletData', data => {
    bullets = data;
});

socket.on('emitStats', data => {
    stats = data;
});

socket.on('emitPackageData', data => {
    packages = data;
});

socket.on('sendMap', data => {
    map = data.map;
});

socket.on('tick', data => {
    tick = data.tick;
})

function loginPlayer() {
    let name = document.getElementById("playerName").value,
        color = document.getElementById("color").value;
    let player = {name: name, color: color};

    let names = players.map(player => player.name);
    if (names.indexOf(name) !== -1)
        return;

    loggedIn = true;
    socket.emit('createPlayer', player);
    document.getElementById('login').style = "display:none";
}

let imgHero, imgGun, imgPackage;
function load() {
    imgHero = new Image();
    imgHero.src = "./img/player.png";
    imgGun = new Image();
    imgGun.src = "./img/weapon.png";
    imgPackage = new Image();
    imgPackage.src = "./img/package.png"
}

function update() {
    draw();
    if (loggedIn)
    move();
    
    requestAnimationFrame(update);
}
load();
update();