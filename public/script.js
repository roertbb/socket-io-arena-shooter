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
const colors = {
    "red": "#f00",
    "blue": "#00f",
    "green": "#0f0",
    "yellow": "#ff0"
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
    let hp;

    players.forEach(player => {
        ctx.fillStyle = colors[player.color];
        ctx.fillRect(player.x, player.y, t, t);
        if (player.id == socket.id) {
            // ctx.strokeStyle = "rgba(255,255,255,0.5)";
            // ctx.strokeRect(player.x, player.y, t, t);
            hp = player.hp;
        }

        if (player.mouse !== undefined) {
            let dy = player.mouse.y - player.y-10,
                dx = player.mouse.x - player.x-10,
                angle = Math.atan2(dy, dx);
                
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(player.x+10, player.y+10);
            ctx.lineTo(player.x+10 + Math.cos(angle)*20, player.y+10 + Math.sin(angle)*20);
            ctx.stroke();
        }
    });

    ctx.fillStyle = "#fff";
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI*2);
        ctx.fill();
    });

    //info bar
    ctx.font = "14px arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${tick}`, 5, 15);
    ctx.fillText(`x:${Key.mouse.x} y:${Key.mouse.y}`, 5, 30);
    ctx.fillText(`HP: ${hp}`, 5, 45);

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

function update() {
    draw();
    if (loggedIn)
        move();

    requestAnimationFrame(update);
}
update();