const canvas = document.getElementById('bubbleCanvas');
const ctx = canvas.getContext('2d');
canvas.style.touchAction = 'none'; // allow slide/drag without scrolling

// use a small pool so rapid pops can overlap briefly without long audio tails
const popSounds = Array.from({ length: 4 }, () => {
    const a = new Audio('pop2.mp3');
    a.preload = 'auto';
    return a;
});
let popSoundIndex = 0;
let bubbles = [];
let isPointerDown = false;

class Bubble {
    constructor(x, y, radius) {
        this.x = x; this.y = y; this.radius = radius;
        this.popped = false;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.popped) {
            // Popped State (Flat/Empty)
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.stroke();
        } else {
            // Unpopped State (3D/clear bubble effect)
            let g = ctx.createRadialGradient(this.x - 5, this.y - 5, 2, this.x, this.y, this.radius);
            g.addColorStop(0, 'rgba(255,255,255,0.25)');
            g.addColorStop(1, 'rgba(255,255,255,0.05)');

            ctx.save();
            ctx.shadowColor = 'rgba(255,255,255,0.15)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = g;
            ctx.fill();
            ctx.restore();

            // thinner, more defined outline with a subtle double stroke
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.stroke();

            ctx.lineWidth = 0.7;
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.stroke();
        }
    }

    pop() {
        if (!this.popped) {
            this.popped = true;
            // RESPAWN LOGIC: Wait 10 seconds then un-pop
            setTimeout(() => {
                this.popped = false;
                requestAnimationFrame(drawAll);
            }, 10000);
            return true;
        }
        return false;
    }
}

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bubbles = [];

    const radius = 22; // Size of bubble
    const xSpacing = radius * 2.1;
    const ySpacing = radius * 1.8; // Tighter vertical spacing

    for (let y = 0; y < canvas.height + radius; y += ySpacing) {
        // STAGGER EFFECT: Every second row is shifted to the right
        let isEvenRow = Math.floor(y / ySpacing) % 2 === 0;
        let xOffset = isEvenRow ? radius : 0;

        for (let x = xOffset; x < canvas.width + radius; x += xSpacing) {
            bubbles.push(new Bubble(x, y, radius));
        }
    }

    drawAll();
}

function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bubbles.forEach(b => b.draw());
}

function playPopSound() {
    const s = popSounds[popSoundIndex];
    popSoundIndex = (popSoundIndex + 1) % popSounds.length;
    s.currentTime = 0;
    s.play().catch(() => {});
    setTimeout(() => {
        s.pause();
        s.currentTime = 0;
    }, 180);
}

function popAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Only spread if the click started inside a bubble
    const originHit = bubbles.some(b => Math.hypot(mouseX - b.x, mouseY - b.y) < b.radius);
    if (!originHit) return;

    const spreadRadius = 80; // only affect nearby bubbles (smaller spread)
    const maxDelay = 400; // cap how long the spread takes
    const speed = 2.2; // ms per pixel

    bubbles.forEach(b => {
        const dist = Math.hypot(mouseX - b.x, mouseY - b.y);
        if (dist > spreadRadius) return;

        const delay = Math.min(maxDelay, dist * speed);
        setTimeout(() => {
            if (b.pop()) {
                playPopSound();
                drawAll();
            }
        }, delay);
    });
}

function handlePointerDown(e) {
    isPointerDown = true;
    popAt(e.clientX, e.clientY);
}

function handlePointerMove(e) {
    if (!isPointerDown) return;
    popAt(e.clientX, e.clientY);
}

function handlePointerUp() {
    isPointerDown = false;
}

canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);
window.addEventListener('pointercancel', handlePointerUp);
window.addEventListener('resize', init);

init();
