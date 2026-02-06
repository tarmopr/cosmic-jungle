const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');

let width, height;
let particles = [];
let characters = [];
let ripples = [];
let effects = [];
let backgroundObjects = [];
let stars = [];
let frame = 0;
let flowRotation = 0;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let targetMouseX = window.innerWidth / 2;
let targetMouseY = window.innerHeight / 2;
let lastInputTime = Date.now();

// Config
const MAX_PARTICLES = 300;
const TRAIL_ALPHA = 0.05;
const FLOW_INTENSITY = 0.005;

let densityMultiplier = 0.6;
let speedMultiplier = 0.6;

const densitySlider = document.getElementById('densitySlider');
const speedSlider = document.getElementById('speedSlider');

if (densitySlider) densitySlider.addEventListener('input', (e) => densityMultiplier = parseFloat(e.target.value));
if (speedSlider) speedSlider.addEventListener('input', (e) => speedMultiplier = parseFloat(e.target.value));

// Load Character Assets with Transparency Processing
const charAssets = [];
const charSrcs = ['char1.png', 'char2.png', 'char3.png', 'char4.png', 'char5.png', 'char6.png', 'char7.png', 'char8.png', 'char9.png'];

function processImage(img) {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tCtx.drawImage(img, 0, 0);
    const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < 50) {
            data[i + 3] = 0;
        } else {
            data[i + 3] = Math.min(255, (brightness - 50) * 1.5);
        }
    }
    tCtx.putImageData(imgData, 0, 0);

    // VIGNETTE MASK: Force edges to be transparent to avoid any rectangular box
    tCtx.globalCompositeOperation = 'destination-in';
    const grad = tCtx.createRadialGradient(
        tempCanvas.width / 2, tempCanvas.height / 2, 0,
        tempCanvas.width / 2, tempCanvas.height / 2, tempCanvas.width / 2
    );
    grad.addColorStop(0.7, 'black');
    grad.addColorStop(1, 'transparent');
    tCtx.fillStyle = grad;
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tCtx.globalCompositeOperation = 'source-over';

    return tempCanvas;
}

charSrcs.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        charAssets.push(processImage(img));
    };
});

class CosmicObject {
    constructor(type) {
        this.reset(type);
    }

    reset(type) {
        this.type = type || (Math.random() > 0.7 ? 'galaxy' : 'nebula');
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 400 + 200;
        this.hue = Math.random() * 360;
        this.alpha = 0;
        this.maxAlpha = Math.random() * 0.1 + 0.05;
        this.rotation = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.002;
        this.fadeState = 'in';
        // DISTANCE: Further objects move less
        this.parallaxFactor = Math.random() * 15 + 10;
    }

    update() {
        if (this.fadeState === 'in') {
            this.alpha += 0.0005;
            if (this.alpha >= this.maxAlpha) this.fadeState = 'stay';
        } else if (this.fadeState === 'stay') {
            if (Math.random() < 0.001) this.fadeState = 'out';
        } else {
            this.alpha -= 0.0005 * speedMultiplier;
            if (this.alpha <= 0) this.reset();
        }
        this.rotation += this.spin * speedMultiplier;
    }

    draw() {
        const offX = (mouseX - width / 2) / this.parallaxFactor;
        const offY = (mouseY - height / 2) / this.parallaxFactor;

        ctx.save();
        ctx.translate(this.x + offX, this.y + offY);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.globalCompositeOperation = 'screen';

        if (this.type === 'nebula') {
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            grad.addColorStop(0, `hsla(${this.hue}, 80%, 50%, 0.8)`);
            grad.addColorStop(0.5, `hsla(${(this.hue + 40) % 360}, 60%, 30%, 0.3)`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            // Irregular shape
            for (let a = 0; a < Math.PI * 2; a += 0.2) {
                const r = this.size * (0.8 + Math.sin(a * 3 + frame * 0.01) * 0.2);
                const px = Math.cos(a) * r;
                const py = Math.sin(a) * r;
                if (a === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.fill();
        } else {
            // Galaxy spiral
            for (let i = 0; i < 5; i++) {
                ctx.rotate(Math.PI / 2.5);
                const grad = ctx.createRadialGradient(this.size * 0.3, 0, 0, this.size * 0.3, 0, this.size * 0.6);
                grad.addColorStop(0, `hsla(${this.hue}, 100%, 70%, 0.6)`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(this.size * 0.3, 0, this.size * 0.4, this.size * 0.1, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            // Core
            const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 0.2);
            coreGrad.addColorStop(0, 'white');
            coreGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.prevX = this.x;
        this.prevY = this.y;
        this.speed = Math.random() * 2 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.life = 0;
        this.maxLife = Math.random() * 200 + 100;
        this.colorHue = Math.random() * 360;
        this.thickness = Math.random() * 3 + 0.5;
        // VARIETY: Particles can be vines, stars, or mini-nebulae
        const r = Math.random();
        this.type = r > 0.95 ? 'nebula' : (r > 0.8 ? 'star' : 'vine');
        this.parallaxFactor = Math.random() * 30 + 50; // Subtle parallax for flow
    }

    update(density) {
        this.prevX = this.x;
        this.prevY = this.y;

        const rotX = Math.cos(flowRotation);
        const rotY = Math.sin(flowRotation);

        const nx = (this.x * rotX - this.y * rotY) * FLOW_INTENSITY;
        const ny = (this.x * rotY + this.y * rotX) * FLOW_INTENSITY;

        const n1 = Math.sin(nx + frame * 0.01) * Math.cos(ny);
        const n2 = Math.cos(nx) * Math.sin(ny + frame * 0.01);

        this.angle += (n1 + n2) * 0.1 * speedMultiplier;

        this.x += Math.cos(this.angle) * this.speed * speedMultiplier;
        this.y += Math.sin(this.angle) * this.speed * speedMultiplier;

        this.life++;

        if (this.life > this.maxLife || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            if (particles.length > MAX_PARTICLES * density) {
                return false;
            }
            this.reset();
        }
        return true;
    }

    draw() {
        const offX = (mouseX - width / 2) / this.parallaxFactor;
        const offY = (mouseY - height / 2) / this.parallaxFactor;

        const alpha = Math.sin((this.life / this.maxLife) * Math.PI);
        if (this.type === 'star') {
            ctx.fillStyle = `hsla(${this.colorHue}, 50%, 90%, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(this.x + offX, this.y + offY, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'nebula') {
            const rad = 10 * alpha;
            const grad = ctx.createRadialGradient(this.x + offX, this.y + offY, 0, this.x + offX, this.y + offY, rad);
            grad.addColorStop(0, `hsla(${this.colorHue}, 100%, 70%, 0.3)`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x + offX, this.y + offY, rad, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const rainbowHue = (this.colorHue + frame * 0.5) % 360;
            const mix = Math.sin(frame * 0.02) * 0.5 + 0.5;
            const hue = mix > 0.7 ? rainbowHue : 120 + (Math.random() - 0.5) * 20;
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha * 0.4})`;
            ctx.lineWidth = this.thickness;
            ctx.beginPath();
            ctx.moveTo(this.prevX + offX, this.prevY + offY);
            ctx.lineTo(this.x + offX, this.y + offY);
            ctx.stroke();
        }
    }
}

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = Math.random() * 200 + 100;
        this.life = 1.0;
        const hues = [300, 280, 190, 100];
        this.hue = hues[Math.floor(Math.random() * hues.length)];
        this.noise = Math.random() * 20;
    }

    update() {
        this.radius += 5;
        this.life -= 0.012;
        return this.life > 0;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${this.hue}, 100%, 70%, ${this.life})`;
        ctx.lineWidth = 3;
        for (let a = 0; a < Math.PI * 2; a += 0.1) {
            const r = this.radius + Math.sin(a * 5 + frame * 0.1) * this.noise;
            const x = this.x + Math.cos(a) * r;
            const y = this.y + Math.sin(a) * r;
            if (a === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = `hsla(${this.hue}, 100%, 80%, ${this.life * 0.5})`;
        ctx.lineWidth = 1;
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class Effect {
    constructor(x, y, type, img, size, hue) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.img = img;
        this.size = size;
        this.hue = hue;
        this.life = 1.0;
        this.particles = [];

        if (type === 'explode') {
            for (let i = 0; i < 30; i++) {
                this.particles.push({
                    x: x + size / 2,
                    y: y + size / 2,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    size: Math.random() * 5 + 2,
                    hue: hue + (Math.random() - 0.5) * 60
                });
            }
        }
    }

    update() {
        this.life -= 0.02;
        if (this.type === 'explode') {
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.96;
                p.vy *= 0.96;
            });
        }
        return this.life > 0;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.globalCompositeOperation = 'screen';

        if (this.type === 'explode') {
            this.particles.forEach(p => {
                ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${this.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (this.type === 'dissolve') {
            ctx.filter = `hue-rotate(${this.hue}deg) contrast(150%)`;
            const jitter = (1 - this.life) * 20;
            ctx.drawImage(this.img, this.x + (Math.random() - 0.5) * jitter, this.y + (Math.random() - 0.5) * jitter, this.size, this.size);
        } else if (this.type === 'beam') {
            ctx.filter = `hue-rotate(${this.hue}deg) brightness(200%)`;
            ctx.drawImage(this.img, this.x, this.y, this.size, this.size * this.life);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.life * 0.8})`;
            ctx.fillRect(this.x + this.size / 2 - 2, 0, 4, height);
        } else if (this.type === 'wave') {
            ctx.filter = `hue-rotate(${this.hue}deg)`;
            const wave = Math.sin(this.life * 20) * 30;
            ctx.drawImage(this.img, this.x + wave, this.y, this.size, this.size);
        }

        ctx.restore();
    }
}

class Character {
    constructor() {
        if (charAssets.length === 0) { this.dead = true; return; }
        this.canvas = charAssets[Math.floor(Math.random() * charAssets.length)];
        this.size = Math.random() * 170 + 80; // Random sizes (80 to 250)
        this.x = Math.random() * (width - this.size);
        this.y = Math.random() * (height - this.size);
        // VARIETY: Random speed and direction
        this.vx = (Math.random() - 0.5) * (Math.random() * 4 + 1);
        this.vy = (Math.random() - 0.5) * (Math.random() * 4 + 1);
        this.alpha = 0;
        this.hue = Math.random() * 360; // Unique color combination
        this.maxAlpha = Math.random() * 0.6 + 0.4;
        this.state = 'fade-in';
        this.timer = 0;
        this.stayTime = Math.random() * 300 + 200;
        this.popped = false;

        // EXTRA: Random trail length and aura type
        this.trail = [];
        this.trailLength = Math.floor(Math.random() * 20 + 10);
        this.auraType = Math.random() > 0.5 ? 'rainbow' : 'fire';

        // DISTANCE: Smaller = Further = Slower Parallax
        this.depth = this.size / 250;
        this.parallaxFactor = 5 + (1 - this.depth) * 40;

        // BEHAVIOR: Linear, Wandering, Zigzag, Spiral, Orbit, Flicker, Follow
        const types = ['linear', 'wandering', 'zigzag', 'spiral', 'orbit', 'flicker', 'follow'];
        this.movementType = types[Math.floor(Math.random() * types.length)];
        this.angle = Math.random() * Math.PI * 2;
        this.turnTimer = 0;
        this.spiralRadius = 0;
        this.targetDist = Math.random() * 200 + 100;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
    }

    isClicked(mx, my) {
        const offX = (mouseX - width / 2) / this.parallaxFactor;
        const offY = (mouseY - height / 2) / this.parallaxFactor;
        const curX = this.x + offX;
        const curY = this.y + offY;
        return mx > curX && mx < curX + this.size &&
            my > curY && my < curY + this.size;
    }

    popOut() {
        this.popped = true;
        const types = ['explode', 'dissolve', 'beam', 'wave'];
        const offX = (mouseX - width / 2) / this.parallaxFactor;
        const offY = (mouseY - height / 2) / this.parallaxFactor;
        effects.push(new Effect(this.x + offX, this.y + offY, types[Math.floor(Math.random() * types.length)], this.canvas, this.size, this.hue));
    }

    update() {
        if (this.dead || this.popped) return false;

        // Update movement based on behavior
        switch (this.movementType) {
            case 'wandering':
                this.vx += (Math.random() - 0.5) * 0.2;
                this.vy += (Math.random() - 0.5) * 0.2;
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > 4) { this.vx *= 0.9; this.vy *= 0.9; }
                break;
            case 'zigzag':
                this.turnTimer++;
                if (this.turnTimer > 60) {
                    this.vx = (Math.random() - 0.5) * 6;
                    this.vy = (Math.random() - 0.5) * 6;
                    this.turnTimer = 0;
                }
                break;
            case 'spiral':
                this.angle += 0.02 * speedMultiplier;
                this.spiralRadius += 0.1 * speedMultiplier;
                this.vx = Math.cos(this.angle) * 2;
                this.vy = Math.sin(this.angle) * 2;
                if (this.spiralRadius > 100) this.spiralRadius = 0;
                break;
            case 'orbit':
                this.angle += 0.01 * speedMultiplier;
                const centerX = width / 2;
                const centerY = height / 2;
                const tx = centerX + Math.cos(this.angle) * (width * 0.3);
                const ty = centerY + Math.sin(this.angle) * (height * 0.3);
                this.vx = (tx - this.x) * 0.05;
                this.vy = (ty - this.y) * 0.05;
                break;
            case 'flicker':
                if (Math.random() < 0.01) {
                    this.x += (Math.random() - 0.5) * 200;
                    this.y += (Math.random() - 0.5) * 200;
                }
                break;
            case 'follow':
                const dx = mouseX - (this.x + this.size / 2);
                const dy = mouseY - (this.y + this.size / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > this.targetDist) {
                    this.vx += (dx / dist) * 0.1;
                    this.vy += (dy / dist) * 0.1;
                } else {
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                }
                const fSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (fSpeed > 5) { this.vx *= 0.9; this.vy *= 0.9; }
                break;
        }

        // Update trail
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLength) this.trail.pop();

        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;

        // Bounce off edges
        if (this.x < -this.size) this.x = width;
        if (this.x > width) this.x = -this.size;
        if (this.y < -this.size) this.y = height;
        if (this.y > height) this.y = -this.size;

        if (this.state === 'fade-in') {
            this.alpha += 0.005;
            if (this.alpha >= this.maxAlpha) this.state = 'stay';
        } else if (this.state === 'stay') {
            this.timer++;
            if (this.timer > this.stayTime) this.state = 'fade-out';
        } else if (this.state === 'fade-out') {
            this.alpha -= 0.005;
            if (this.alpha <= 0) return false;
        }
        return true;
    }

    draw() {
        if (this.dead || this.popped) return;
        const offX = (mouseX - width / 2) / this.parallaxFactor;
        const offY = (mouseY - height / 2) / this.parallaxFactor;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.globalCompositeOperation = 'screen';

        // Draw Trail
        this.trail.forEach((pos, i) => {
            const tAlpha = (1 - i / this.trail.length) * this.alpha * 0.3;
            ctx.globalAlpha = tAlpha;
            ctx.filter = `hue-rotate(${this.hue + i * 5}deg) blur(2px)`;
            ctx.drawImage(this.canvas, pos.x + offX, pos.y + offY, this.size, this.size);
        });

        // Draw Aura Effect
        ctx.globalAlpha = this.alpha * 0.5;
        const auraHue = this.auraType === 'rainbow' ? (frame * 2) % 360 : (10 + Math.random() * 20); // Fire is orange/red
        ctx.shadowBlur = 30;
        ctx.shadowColor = `hsla(${auraHue}, 100%, 70%, 1)`;

        ctx.globalAlpha = this.alpha;
        ctx.filter = `hue-rotate(${this.hue}deg)`;

        // Wobble Effect
        const wobbleX = Math.sin(frame * this.wobbleSpeed) * 5;
        const wobbleY = Math.cos(frame * this.wobbleSpeed * 1.5) * 5;
        const scaleWobble = 1 + Math.sin(frame * 0.05) * 0.05;

        ctx.translate(this.x + offX + this.size / 2 + wobbleX, this.y + offY + this.size / 2 + wobbleY);
        ctx.scale(scaleWobble, scaleWobble);
        ctx.drawImage(this.canvas, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = [];
    characters = [];
    ripples = [];
    effects = [];
    backgroundObjects = [new CosmicObject(), new CosmicObject(), new CosmicObject()];
    stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5,
        blink: Math.random() * 0.05,
        parallaxFactor: Math.random() * 50 + 80 // Far stars move less
    }));

    for (let i = 0; i < MAX_PARTICLES * 0.5; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    const densityCycle = Math.sin(frame * 0.005) * 0.4 + 0.6;
    flowRotation += 0.001 * Math.sin(frame * 0.002);
    const globalRotation = Math.sin(frame * 0.0005) * 0.02;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(5, 5, 5, ${TRAIL_ALPHA})`;
    ctx.fillRect(0, 0, width, height);

    // Draw Starfield
    stars.forEach(s => {
        const offX = (mouseX - width / 2) / s.parallaxFactor;
        const offY = (mouseY - height / 2) / s.parallaxFactor;
        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.5 + Math.sin(frame * s.blink) * 0.4;
        ctx.beginPath();
        ctx.arc(s.x + offX, s.y + offY, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Background Cosmic Objects
    backgroundObjects.forEach(obj => {
        obj.update();
        obj.draw();
    });

    ctx.translate(width / 2, height / 2);
    ctx.rotate(globalRotation);
    ctx.translate(-width / 2, -height / 2);

    const currentMaxParticles = MAX_PARTICLES * densityMultiplier;
    if (particles.length < currentMaxParticles * densityCycle) {
        particles.push(new Particle());
    }

    particles = particles.filter(p => {
        const alive = p.update(densityCycle);
        if (alive) p.draw();
        return alive;
    });

    if (Math.random() < 0.003 && characters.length < 5) {
        characters.push(new Character());
    }
    characters = characters.filter(c => {
        const active = c.update();
        if (active) c.draw();
        return active;
    });

    ripples = ripples.filter(r => {
        const active = r.update();
        if (active) r.draw();
        return active;
    });

    effects = effects.filter(e => {
        const active = e.update();
        if (active) e.draw();
        return active;
    });

    if (frame % 20 === 0) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const rad = Math.random() * 500 + 200;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
        const hue = (frame * 0.04) % 360;
        grad.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.004)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        ctx.globalCompositeOperation = 'source-over';
    }

    // Auto-drift if no input for 3 seconds
    if (Date.now() - lastInputTime > 3000) {
        const driftX = Math.sin(frame * 0.005) * (width * 0.1);
        const driftY = Math.cos(frame * 0.007) * (height * 0.1);
        targetMouseX = (width / 2) + driftX;
        targetMouseY = (height / 2) + driftY;
    }

    frame++;
    requestAnimationFrame(animate);
}

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
    lastInputTime = Date.now();
});

// Mobile Touch Support
window.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    mouseX = touch.clientX;
    mouseY = touch.clientY;
    targetMouseX = touch.clientX;
    targetMouseY = touch.clientY;
    lastInputTime = Date.now();
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    mouseX = touch.clientX;
    mouseY = touch.clientY;
    targetMouseX = touch.clientX;
    targetMouseY = touch.clientY;
    lastInputTime = Date.now();
}, { passive: true });

// Gyroscope / Tilt Detection
function initGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS requires user gesture
        const requestPermission = async () => {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                    window.removeEventListener('click', requestPermission);
                    window.removeEventListener('touchstart', requestPermission);
                }
            } catch (err) {
                console.error("Gyroscope permission denied or error:", err);
            }
        };
        window.addEventListener('click', requestPermission, { once: true });
        window.addEventListener('touchstart', requestPermission, { once: true });
    } else {
        // Non-iOS or permission already granted/not needed
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

function handleOrientation(event) {
    // Map tilt (-45 to 45 degrees) to screen offsets
    const tiltX = (event.gamma || 0) / 45;
    const tiltY = (event.beta - 45 || 0) / 45; // Offset beta by 45 for typical holding angle

    targetMouseX = (width / 2) + (tiltX * 300);
    targetMouseY = (height / 2) + (tiltY * 300);
    lastInputTime = Date.now();
}

window.addEventListener('resize', init);
window.addEventListener('mousedown', (e) => {
    let clickedChar = false;
    for (let i = characters.length - 1; i >= 0; i--) {
        if (characters[i].isClicked(e.clientX, e.clientY)) {
            characters[i].popOut();
            clickedChar = true;
            break;
        }
    }
    if (!clickedChar) {
        ripples.push(new Ripple(e.clientX, e.clientY));
    }
});

resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ctx.clearRect(0, 0, width, height);
    init();
});

init();
initGyro();
animate();
