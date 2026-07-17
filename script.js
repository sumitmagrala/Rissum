/* ==========================================================================
   Interactive Background Particle System
   ========================================================================== */
const canvas = document.getElementById('sparkle-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const heartPath = (x, y, size) => {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.quadraticCurveTo(x, y, x + size / 2, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size / 3);
    ctx.quadraticCurveTo(x + size, y + size * 0.7, x, y + size * 1.25);
    ctx.quadraticCurveTo(x - size, y + size * 0.7, x - size, y + size / 3);
    ctx.quadraticCurveTo(x - size, y, x - size / 2, y);
    ctx.quadraticCurveTo(x, y, x, y + size / 4);
    ctx.closePath();
};

class Particle {
    constructor(x, y, type = 'star', color = '#d68798', speedY = -0.5, speedX = 0) {
        this.x = x;
        this.y = y;
        this.type = type; // 'star' | 'heart' | 'confetti'
        this.size = Math.random() * (type === 'heart' ? 12 : 5) + 3;
        this.speedX = speedX || (Math.random() * 1 - 0.5);
        this.speedY = speedY || (Math.random() * -1.5 - 0.5);
        this.opacity = Math.random() * 0.5 + 0.5;
        this.color = color;
        this.life = 1;
        this.decay = Math.random() * 0.01 + 0.005;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 2 - 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= this.decay;
        this.rotation += this.rotationSpeed;
        if (this.type === 'confetti') {
            this.speedY += 0.05; // gravity for confetti
            this.speedX *= 0.98; // air resistance
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);

        if (this.type === 'star') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'heart') {
            ctx.fillStyle = this.color;
            heartPath(0, 0, this.size);
            ctx.fill();
        } else if (this.type === 'confetti') {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);
        }

        ctx.restore();
    }
}

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Ambient background sparkle generator
function addAmbientSparkles() {
    if (particles.length < 80) {
        // Star dust
        particles.push(new Particle(
            Math.random() * canvas.width,
            canvas.height + 10,
            'star',
            Math.random() > 0.5 ? '#e5b382' : '#fce2e6',
            Math.random() * -1 - 0.2
        ));
        // Floating heart occasionally
        if (Math.random() > 0.95) {
            particles.push(new Particle(
                Math.random() * canvas.width,
                canvas.height + 10,
                'heart',
                '#d68798',
                Math.random() * -0.8 - 0.4
            ));
        }
    }
}

// Mouse trail effect
let mouse = { x: null, y: null };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    // Emit sparkles on move
    if (Math.random() > 0.4) {
        particles.push(new Particle(
            mouse.x,
            mouse.y,
            Math.random() > 0.8 ? 'heart' : 'star',
            Math.random() > 0.5 ? '#fad9a6' : '#d68798',
            Math.random() * 0.5 - 0.25,
            Math.random() * 1 - 0.5
        ));
    }
});

// Click ripple sparkles
window.addEventListener('click', (e) => {
    if (e.target.closest('#open-envelope-btn') || e.target.closest('.candle')) return; // handled separately
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(
            e.clientX,
            e.clientY,
            Math.random() > 0.6 ? 'heart' : 'star',
            Math.random() > 0.5 ? '#ffd54f' : '#d68798',
            Math.random() * 3 - 1.5,
            Math.random() * 3 - 1.5
        ));
    }
});

// Animation Loop
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    addAmbientSparkles();

    particles = particles.filter(p => p.opacity > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animateParticles);
}
animateParticles();

// Trigger a burst of confetti
function triggerConfettiBurst() {
    const colors = ['#fce2e6', '#d68798', '#fad9a6', '#ff8f00', '#ffd54f', '#e04b68', '#f5edf0'];
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.6; // near the cake position

    for (let i = 0; i < 150; i++) {
        const speed = Math.random() * 8 + 4;
        const angle = Math.random() * Math.PI * 2;
        const speedX = Math.cos(angle) * speed;
        const speedY = Math.sin(angle) * speed - 3; // upward bias

        particles.push(new Particle(
            centerX,
            centerY,
            'confetti',
            colors[Math.floor(Math.random() * colors.length)],
            speedY,
            speedX
        ));
    }
}


/* ==========================================================================
   Procedural Audio Synthesizer (Web Audio API)
   ========================================================================== */
class RomanticSynth {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.tempo = 65; // slow romantic beat
        this.schedulerTimer = null;
        this.nextNoteTime = 0.0;
        this.noteQueue = [];
        this.step = 0;
        this.melodyMode = 'ambient'; // 'ambient' | 'birthday'
        
        // Frequencies mapping
        this.notesFreq = {
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
            'C6': 1046.50
        };

        // Ambient romantic arpeggio progression (Cmaj7 - G6 - Am9 - Fmaj7)
        this.ambientProgression = [
            // Measure 1: Cmaj7
            ['C3', 0.0], ['G3', 0.25], ['C4', 0.5], ['E4', 0.75], ['G4', 1.0], ['B4', 1.25], ['E5', 1.5], ['B4', 1.75],
            // Measure 2: Gadd9
            ['G3', 2.0], ['D4', 2.25], ['G4', 2.5], ['A4', 2.75], ['B4', 3.0], ['D5', 3.25], ['G5', 3.5], ['D5', 3.75],
            // Measure 3: Am9
            ['A3', 4.0], ['E4', 4.25], ['A4', 4.5], ['C5', 4.75], ['E5', 5.0], ['G5', 5.25], ['C6', 5.5], ['G5', 5.75],
            // Measure 4: Fmaj9
            ['F3', 6.0], ['C4', 6.25], ['F4', 6.5], ['A4', 6.75], ['C5', 7.0], ['E5', 7.25], ['G5', 7.5], ['E5', 7.75],
        ];

        // Happy Birthday Melodic Notes & Beats (note, beats count)
        this.birthdayMelody = [
            ['D4', 0.75], ['D4', 0.25], ['E4', 1.0], ['D4', 1.0], ['G4', 1.0], ['F4', 2.0],
            ['D4', 0.75], ['D4', 0.25], ['E4', 1.0], ['D4', 1.0], ['A4', 1.0], ['G4', 2.0],
            ['D4', 0.75], ['D4', 0.25], ['D5', 1.0], ['B4', 1.0], ['G4', 1.0], ['F4', 1.0], ['E4', 1.0],
            ['C5', 0.75], ['C5', 0.25], ['B4', 1.0], ['G4', 1.0], ['A4', 1.0], ['G4', 2.0]
        ];
        this.birthdayIndex = 0;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // fade-in
        this.masterGain.connect(this.ctx.destination);
    }

    start() {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.ctx.resume();
        
        // Fade in master volume
        this.masterGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 2.0); // Pleasant soft volume

        this.nextNoteTime = this.ctx.currentTime;
        this.step = 0;
        this.birthdayIndex = 0;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.schedulerTimer);
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 0.5);
        }
    }

    playPianoNote(freq, time, duration = 1.2) {
        if (!freq) return;

        // Custom felt piano note synthesis
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filterNode = this.ctx.createBiquadFilter();

        // Felt piano has fewer high frequencies (Warm low-pass filter)
        filterNode.type = 'lowpass';
        filterNode.Q.setValueAtTime(1.0, time);
        filterNode.frequency.setValueAtTime(1200, time);
        filterNode.frequency.exponentialRampToValueAtTime(150, time + duration);

        // Sine wave mixed with a bit of triangle for soft chime/felt piano tone
        osc1.type = 'triangle';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq * 1.002, time); // detune slightly for richness

        // Volume Envelope: soft attack, exponential decay (piano-like)
        gainNode.gain.setValueAtTime(0.0, time);
        gainNode.gain.linearRampToValueAtTime(0.6, time + 0.04); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.005, time + duration); // Decay/Sustain

        // Connect nodes
        osc1.connect(filterNode);
        osc2.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration);
        osc2.stop(time + duration);
    }

    playChimeEffect() {
        // Celebratory wind chime chord
        const notes = ['G5', 'B5', 'D6', 'G6'];
        const now = this.ctx.currentTime;
        notes.forEach((n, idx) => {
            const freq = this.notesFreq[n];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.5);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 2);
        });
    }

    scheduler() {
        if (!this.isPlaying) return;

        // Schedule notes in advance
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.scheduleNextEvent(this.step, this.nextNoteTime);
            this.advanceStep();
        }

        // Poll every 25ms
        this.schedulerTimer = setTimeout(() => this.scheduler(), 25);
    }

    scheduleNextEvent(step, time) {
        if (this.melodyMode === 'ambient') {
            // Find notes scheduled for the current 16th beat division
            const beatIndex = (step % 32) * 0.25; // 0 to 7.75 beats
            const noteData = this.ambientProgression.find(n => Math.abs(n[1] - beatIndex) < 0.01);
            if (noteData) {
                const noteName = noteData[0];
                const freq = this.notesFreq[noteName];
                this.playPianoNote(freq, time, 1.8);
            }
        } else if (this.melodyMode === 'birthday') {
            // In birthday mode, we play notes from the melody list
            // Each note has custom duration in beats
            if (this.birthdayIndex < this.birthdayMelody.length) {
                const currentMelody = this.birthdayMelody[this.birthdayIndex];
                const noteName = currentMelody[0];
                const freq = this.notesFreq[noteName];
                
                // Play melody note
                this.playPianoNote(freq, time, currentMelody[1] * (60 / this.tempo) * 1.5);
                
                // Play soft ambient bass notes on first beats
                if (this.birthdayIndex % 3 === 0) {
                    const bassNotes = ['C3', 'G3', 'F3'];
                    const bassNote = bassNotes[Math.floor(Math.random() * bassNotes.length)];
                    this.playPianoNote(this.notesFreq[bassNote], time, 3.0);
                }
            } else {
                // Loop Happy Birthday or transition back to ambient
                this.birthdayIndex = 0;
            }
        }
    }

    advanceStep() {
        const beatSecs = 60 / this.tempo;
        
        if (this.melodyMode === 'ambient') {
            this.nextNoteTime += 0.25 * beatSecs; // 16th notes
            this.step++;
        } else if (this.melodyMode === 'birthday') {
            // Get note duration of current melody note
            if (this.birthdayIndex < this.birthdayMelody.length) {
                const beatDuration = this.birthdayMelody[this.birthdayIndex][1];
                this.nextNoteTime += beatDuration * beatSecs * 1.1; // adjust delay slightly for lyrical timing
                this.birthdayIndex++;
            } else {
                this.birthdayIndex = 0;
            }
            this.step++;
        }
    }

    switchToBirthday() {
        this.melodyMode = 'birthday';
        this.birthdayIndex = 0;
        // speed up tempo slightly for Happy Birthday
        this.tempo = 88;
        // set timing to trigger next note immediately
        if (this.ctx) {
            this.nextNoteTime = this.ctx.currentTime + 0.1;
        }
        this.playChimeEffect();
    }
}

const romanticSynth = new RomanticSynth();


/* ==========================================================================
   Envelope Open Transition
   ========================================================================== */
const envelope = document.querySelector('.envelope');
const openEnvelopeBtn = document.getElementById('open-envelope-btn');
const entranceContainer = document.getElementById('entrance-container');
const mainContent = document.getElementById('main-content');
const musicPlayerContainer = document.getElementById('music-player-container');
const musicToggleBtn = document.getElementById('music-toggle');
const playIcon = document.querySelector('.play-icon');
const pauseIcon = document.querySelector('.pause-icon');
const musicText = document.querySelector('.music-text');

openEnvelopeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Animate envelope open
    envelope.classList.add('open');

    // Initialize & Start Synthesizer
    romanticSynth.start();
    updateAudioUI(true);

    // Fade out entrance page, fade in main content
    setTimeout(() => {
        entranceContainer.classList.add('fade-out');
        mainContent.classList.remove('hidden');
        musicPlayerContainer.classList.remove('hidden');
        
        setTimeout(() => {
            mainContent.classList.add('fade-in');
            // Trigger animation calculation for items in view
            checkScrollReveal();
        }, 100);
    }, 1800);
});

// Audio play/pause controls
musicToggleBtn.addEventListener('click', () => {
    if (romanticSynth.isPlaying) {
        romanticSynth.stop();
        updateAudioUI(false);
    } else {
        romanticSynth.start();
        updateAudioUI(true);
    }
});

function updateAudioUI(isPlaying) {
    if (isPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        musicText.textContent = "Mute Music";
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        musicText.textContent = "Play Music";
    }
}


/* ==========================================================================
   Interactive Compliments Generator
   ========================================================================== */
const complimentsList = [
    "Your smile has the power to brighten up the darkest of days and put the stars to shame.",
    "In a world full of temporary things, your elegance and grace are completely timeless.",
    "Rissum, your laughter is the sweetest melody this world has ever heard.",
    "Your beauty is not just in how you look, but in the warmth and light you bring to everyone around you.",
    "You are a stunning masterpiece walking in a gallery of ordinary sights.",
    "Your eyes hold a universe of kindness, depth, and magic that words can never capture.",
    "The stars themselves look down in envy of the way your eyes sparkle with life.",
    "You carry a grace that is so rare, like a single perfect rose blooming under starlight.",
    "Even the moon looks a little less bright when you are standing underneath it.",
    "Being in your presence feels like stepping into a beautiful, sunlit dream."
];

const complimentText = document.getElementById('compliment-text');
const nextComplimentBtn = document.getElementById('next-compliment-btn');
let currentComplimentIndex = 0;

nextComplimentBtn.addEventListener('click', () => {
    complimentText.classList.add('fade-out');

    // Select new random index (different from the current one)
    let newIndex = currentComplimentIndex;
    while (newIndex === currentComplimentIndex) {
        newIndex = Math.floor(Math.random() * complimentsList.length);
    }
    currentComplimentIndex = newIndex;

    // Wait for fade out to complete before showing new text
    setTimeout(() => {
        complimentText.textContent = `"${complimentsList[currentComplimentIndex]}"`;
        complimentText.classList.remove('fade-out');
        complimentText.classList.add('fade-in');
        
        // Remove animation helper class after transition
        setTimeout(() => {
            complimentText.classList.remove('fade-in');
        }, 500);
    }, 400);
});


/* ==========================================================================
   Cake & Candle Blow Out
   ========================================================================== */
const candles = document.querySelectorAll('.candle');
const wishRevealCard = document.getElementById('wish-reveal-card');
let extinguishedCount = 0;

candles.forEach((candle, index) => {
    candle.addEventListener('click', () => {
        if (!candle.classList.contains('extinguished')) {
            candle.classList.add('extinguished');
            
            // Hide the glow overlay
            const glow = document.getElementById(`glow-${index + 1}`);
            if (glow) {
                glow.style.opacity = '0';
            }
            
            // Sparkle effect at the candle top
            const candleRect = candle.getBoundingClientRect();
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(
                    candleRect.left + 4,
                    candleRect.top - 10,
                    'star',
                    '#ffd54f',
                    Math.random() * -1 - 0.2,
                    Math.random() * 1 - 0.5
                ));
            }

            extinguishedCount++;

            // If all candles are blown out
            if (extinguishedCount === candles.length) {
                setTimeout(() => {
                    // Explode confetti
                    triggerConfettiBurst();
                    
                    // Reveal the wish
                    wishRevealCard.classList.remove('hidden');
                    
                    // Switch to birthday song
                    romanticSynth.switchToBirthday();
                    updateAudioUI(true);
                    
                    // Repeat confetti burst a few times
                    setTimeout(triggerConfettiBurst, 600);
                    setTimeout(triggerConfettiBurst, 1200);
                }, 600);
            }
        }
    });
});


/* ==========================================================================
   Scroll-triggered Fade & Slide Animations
   ========================================================================== */
const revealElements = document.querySelectorAll('.reveal-on-scroll, .timeline-item, .letter-scroll-wrapper');

function checkScrollReveal() {
    const triggerBottom = window.innerHeight * 0.85;

    revealElements.forEach(el => {
        const elTop = el.getBoundingClientRect().top;

        if (elTop < triggerBottom) {
            el.classList.add('revealed');
        }
    });
}

window.addEventListener('scroll', checkScrollReveal);
// Initialize calculation once page content fades in
checkScrollReveal();
