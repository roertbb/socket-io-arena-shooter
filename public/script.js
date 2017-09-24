// const socket = io.connect('http://localhost:3000');
// const socket = io.connect('http://192.168.56.1:3000'); // virtualbox ipv4
const socket = io.connect('http://192.168.1.101:3000'); // wireless ipv4


let canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    w = canvas.width =  400;
    h = canvas.height = 280;

let Key = {
	pressed: {},
	keys: {w: 87, s: 83, a: 65, d: 68},
	isDown: function (keyCode) { return this.pressed[this.keys[keyCode]]; },
	onKeyDown: function (event) { this.pressed[event.keyCode] = true; },
	onKeyUp: function (event) { delete this.pressed[event.keyCode]; }
};
window.addEventListener('keyup', (event) => { Key.onKeyUp(event); }, false);
window.addEventListener('keydown', (event) => { Key.onKeyDown(event); }, false);

let players = [];
let map = undefined;
let tick = 0;

function move() {
    let player = {
        id: socket.id,
        down: []
    };

    if (Key.isDown('w'))
        player.down.push('w');
    else if (Key.isDown('s'))
        player.down.push('s');
    if (Key.isDown('a'))
        player.down.push('a');
    else if (Key.isDown('d'))
        player.down.push('d');

    if (player.down.length !== 0)
        socket.emit('sendPlayerData', player);
}

function draw() {
    const t = 20;

    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#757575";
    ctx.fillRect(0,0,w,h);

    ctx.fillStyle = "#353535";
    if (map !== undefined) {
        for (let i=0; i<map[0].length; i++) {
            for (let j=0; j<map.length; j++) {
                if (map[j][i] !== 0)
                    ctx.fillRect(i*t, j*t, t, t);
            }
        }
    }

    players.forEach(player => {
        if (player.id == socket.id)
            ctx.fillStyle = "#fff";
        else
            ctx.fillStyle = "#4f3";

        ctx.fillRect(player.x, player.y, t, t);
    });

    ctx.font = "14px arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${tick}`, 5, 15);
}

socket.on('emitPlayerData', data => {
    players = data;
});

socket.on('sendMap', data => {
    map = data.map;
});

socket.on('tick', data => {
    tick = data.tick;
})

function update() {
    draw();
    move();

    requestAnimationFrame(update);
}

update();