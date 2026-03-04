/**
 * BeatForge Studio — Touch Instruments
 * XY Pad, Ribbon Controller, Touch Strings, Orbital Synth
 */
window.BeatForge = window.BeatForge || {};

BeatForge.TouchInstruments = (function () {
    const engine = BeatForge.AudioEngine;
    const inst = BeatForge.Instruments;

    let canvas, ctx2d, mode = 'xy';
    let instrument = 'lead', scale = 'chromatic';
    let activeVoices = {};
    let animFrame = null;
    let trails = [];
    let orbits = [];

    const SCALES = {
        chromatic: [0,1,2,3,4,5,6,7,8,9,10,11],
        major: [0,2,4,5,7,9,11],
        minor: [0,2,3,5,7,8,10],
        pentatonic: [0,2,4,7,9],
        blues: [0,3,5,6,7,10],
        dorian: [0,2,3,5,7,9,10],
        mixolydian: [0,2,4,5,7,9,10],
        arabic: [0,1,4,5,7,8,11],
    };

    // String tunings: guitar-like open strings
    const STRING_NOTES = ['E2','A2','D3','G3','B3','E4','A4','D5'];

    function init(canvasEl) {
        canvas = canvasEl;
        ctx2d = canvas.getContext('2d');
        _resize();
        window.addEventListener('resize', _resize);

        canvas.addEventListener('touchstart', _onTouch, { passive: false });
        canvas.addEventListener('touchmove', _onTouch, { passive: false });
        canvas.addEventListener('touchend', _onTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', _onTouchEnd, { passive: false });

        // Mouse fallback
        canvas.addEventListener('mousedown', _onMouse);
        canvas.addEventListener('mousemove', _onMouseMove);
        canvas.addEventListener('mouseup', _onMouseUp);
        canvas.addEventListener('mouseleave', _onMouseUp);

        _startAnim();
    }

    function _resize() {
        if (!canvas) return;
        const r = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * r;
        canvas.height = rect.height * r;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx2d.scale(r, r);
    }

    function setMode(m) { mode = m; trails = []; orbits = []; _stopAllVoices(); }
    function setInstrument(i) { instrument = i; }
    function setScale(s) { scale = s; }

    /* ====== NOTE MAPPING ====== */
    function _xToNote(xPct) {
        // Map 0-1 to 3 octaves starting from C3
        const sc = SCALES[scale] || SCALES.chromatic;
        const totalNotes = sc.length * 3;
        const idx = Math.floor(xPct * totalNotes);
        const octave = 3 + Math.floor(idx / sc.length);
        const noteIdx = sc[idx % sc.length];
        return inst.NAMES[noteIdx] + octave;
    }

    function _yToFilter(yPct) {
        // Bottom = dark (low filter), top = bright (high filter)
        return 200 + (1 - yPct) * 15000;
    }

    function _yToVelocity(yPct) {
        return 0.3 + (1 - yPct) * 0.6;
    }

    /* ====== VOICE MANAGEMENT ====== */
    function _playNote(id, note, vel) {
        _stopVoice(id);
        const c = engine.getContext();
        engine.resume();
        const dur = mode === 'orbital' ? 2.0 : (mode === 'strings' ? 0.8 : 0.5);
        inst.playSynth(c, engine.getDestination(), note, c.currentTime, dur, vel, instrument);
        activeVoices[id] = { note, time: Date.now() };

        // Notify multitrack recorder
        if (BeatForge.Multitrack && BeatForge.Multitrack.isRecording()) {
            BeatForge.Multitrack.recordEvent({
                type: 'synth', instrument, note, velocity: vel,
                duration: dur, time: c.currentTime
            });
        }
    }

    function _stopVoice(id) {
        delete activeVoices[id];
    }

    function _stopAllVoices() {
        activeVoices = {};
    }

    /* ====== TOUCH HANDLERS ====== */
    function _onTouch(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const x = (touch.clientX - rect.left) / rect.width;
            const y = (touch.clientY - rect.top) / rect.height;
            _handlePoint(touch.identifier, x, y, e.type === 'touchstart');
        }
    }

    function _onTouchEnd(e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            _stopVoice(e.changedTouches[i].identifier);
        }
    }

    let mouseDown = false;
    function _onMouse(e) {
        mouseDown = true;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        _handlePoint('mouse', x, y, true);
    }
    function _onMouseMove(e) {
        if (!mouseDown) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        _handlePoint('mouse', x, y, false);
    }
    function _onMouseUp() {
        mouseDown = false;
        _stopVoice('mouse');
    }

    /* ====== MODE-SPECIFIC HANDLERS ====== */
    function _handlePoint(id, x, y, isNew) {
        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));

        switch (mode) {
            case 'xy': _handleXY(id, x, y, isNew); break;
            case 'ribbon': _handleRibbon(id, x, y, isNew); break;
            case 'strings': _handleStrings(id, x, y, isNew); break;
            case 'orbital': _handleOrbital(id, x, y, isNew); break;
        }
    }

    // ---- XY PAD ----
    let lastXYNote = {};
    function _handleXY(id, x, y, isNew) {
        const note = _xToNote(x);
        if (isNew || note !== lastXYNote[id]) {
            _playNote(id, note, _yToVelocity(y));
            lastXYNote[id] = note;
        }
        // Live filter from Y
        engine.setFilter(_yToFilter(y));
        // Trail
        const rect = canvas.getBoundingClientRect();
        trails.push({ x: x * rect.width, y: y * rect.height, age: 0, color: _noteColor(x) });
        if (trails.length > 300) trails.shift();
    }

    // ---- RIBBON ----
    let lastRibbonNote = {};
    function _handleRibbon(id, x, y, isNew) {
        const note = _xToNote(x);
        const vel = _yToVelocity(y);
        if (isNew || note !== lastRibbonNote[id]) {
            _playNote(id, note, vel);
            lastRibbonNote[id] = note;
        }
        const rect = canvas.getBoundingClientRect();
        trails.push({ x: x * rect.width, y: rect.height / 2, age: 0, color: _noteColor(x), radius: vel * 20 });
        if (trails.length > 200) trails.shift();
    }

    // ---- STRINGS ----
    let lastStringIdx = {};
    function _handleStrings(id, x, y, isNew) {
        const numStrings = STRING_NOTES.length;
        const rect = canvas.getBoundingClientRect();
        const stringIdx = Math.floor(y * numStrings);
        const clampedIdx = Math.max(0, Math.min(numStrings - 1, stringIdx));

        if (isNew || clampedIdx !== lastStringIdx[id]) {
            const baseNote = STRING_NOTES[clampedIdx];
            // X position adds semitones (fret position)
            const sc = SCALES[scale] || SCALES.chromatic;
            const fret = Math.floor(x * sc.length);
            const semitones = sc[Math.min(fret, sc.length - 1)];
            const baseFreq = inst.freq(baseNote);
            const finalFreq = baseFreq * Math.pow(2, semitones / 12);
            // Find nearest note name for recording
            const noteNum = Math.round(12 * Math.log2(finalFreq / 440) + 69);
            const noteName = inst.NAMES[noteNum % 12] + Math.floor(noteNum / 12 - 1);

            _playNote(id, noteName, 0.5 + x * 0.4);
            lastStringIdx[id] = clampedIdx;

            // Vibration visual
            const sy = (clampedIdx + 0.5) / numStrings * rect.height;
            trails.push({ x: x * rect.width, y: sy, age: 0, color: `hsl(${clampedIdx * 45}, 80%, 60%)`, radius: 15 });
        }
    }

    // ---- ORBITAL ----
    function _handleOrbital(id, x, y, isNew) {
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width / 2, cy = rect.height / 2;
        const dx = x * rect.width - cx, dy = y * rect.height - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) / Math.max(cx, cy);
        const angle = Math.atan2(dy, dx);

        // Distance from center = octave/pitch range
        // Angle = note within scale
        const sc = SCALES[scale] || SCALES.chromatic;
        const normalAngle = (angle + Math.PI) / (2 * Math.PI); // 0-1
        const noteIdx = Math.floor(normalAngle * sc.length);
        const octave = 3 + Math.floor(dist * 3);
        const semitone = sc[noteIdx % sc.length];
        const note = inst.NAMES[semitone] + Math.min(octave, 7);

        if (isNew) {
            _playNote(id, note, 0.4 + dist * 0.5);
            orbits.push({ x: x * rect.width, y: y * rect.height, angle, dist, id, born: Date.now() });
        } else {
            const existing = orbits.find(o => o.id === id);
            if (existing) {
                existing.x = x * rect.width;
                existing.y = y * rect.height;
                existing.angle = angle;
                existing.dist = dist;
            }
            const lastOrb = activeVoices[id];
            if (!lastOrb || lastOrb.note !== note) {
                _playNote(id, note, 0.4 + dist * 0.5);
            }
        }
    }

    /* ====== VISUALS ====== */
    function _noteColor(xPct) {
        const hue = xPct * 300;
        return `hsl(${hue}, 90%, 60%)`;
    }

    function _startAnim() {
        if (animFrame) return;
        _drawFrame();
    }

    function _drawFrame() {
        animFrame = requestAnimationFrame(_drawFrame);
        if (!canvas || !ctx2d) return;
        const r = window.devicePixelRatio || 1;
        const w = canvas.width / r, h = canvas.height / r;
        ctx2d.setTransform(1, 0, 0, 1, 0, 0);
        ctx2d.scale(r, r);

        switch (mode) {
            case 'xy': _drawXY(w, h); break;
            case 'ribbon': _drawRibbon(w, h); break;
            case 'strings': _drawStrings(w, h); break;
            case 'orbital': _drawOrbital(w, h); break;
        }
    }

    function _drawXY(w, h) {
        ctx2d.fillStyle = 'rgba(10, 14, 26, 0.15)';
        ctx2d.fillRect(0, 0, w, h);

        // Grid lines
        ctx2d.strokeStyle = 'rgba(42, 52, 82, 0.4)';
        ctx2d.lineWidth = 0.5;
        const sc = SCALES[scale] || SCALES.chromatic;
        const cols = sc.length * 3;
        for (let i = 1; i < cols; i++) {
            const x = (i / cols) * w;
            ctx2d.beginPath(); ctx2d.moveTo(x, 0); ctx2d.lineTo(x, h); ctx2d.stroke();
        }
        for (let i = 1; i < 4; i++) {
            const y = (i / 4) * h;
            ctx2d.beginPath(); ctx2d.moveTo(0, y); ctx2d.lineTo(w, y); ctx2d.stroke();
        }

        // Trails
        trails.forEach(t => {
            t.age++;
            const alpha = Math.max(0, 1 - t.age / 60);
            const radius = 8 + t.age * 0.3;
            ctx2d.beginPath();
            ctx2d.arc(t.x, t.y, radius, 0, Math.PI * 2);
            ctx2d.fillStyle = t.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
            ctx2d.fill();
        });
        trails = trails.filter(t => t.age < 60);
    }

    function _drawRibbon(w, h) {
        ctx2d.fillStyle = 'rgba(10, 14, 26, 0.2)';
        ctx2d.fillRect(0, 0, w, h);

        // Ribbon strip
        const stripY = h * 0.3;
        const stripH = h * 0.4;
        const grad = ctx2d.createLinearGradient(0, 0, w, 0);
        const sc = SCALES[scale] || SCALES.chromatic;
        for (let i = 0; i <= sc.length * 3; i++) {
            grad.addColorStop(i / (sc.length * 3), `hsl(${(i / (sc.length * 3)) * 300}, 70%, 20%)`);
        }
        ctx2d.fillStyle = grad;
        ctx2d.fillRect(0, stripY, w, stripH);

        // Note markers
        ctx2d.strokeStyle = 'rgba(255,255,255,0.15)';
        const cols = sc.length * 3;
        for (let i = 0; i < cols; i++) {
            const x = (i / cols) * w;
            ctx2d.beginPath(); ctx2d.moveTo(x, stripY); ctx2d.lineTo(x, stripY + stripH); ctx2d.stroke();
        }

        // Label
        ctx2d.fillStyle = 'rgba(255,255,255,0.3)';
        ctx2d.font = '12px sans-serif';
        ctx2d.fillText('← Low', 10, stripY - 8);
        ctx2d.fillText('High →', w - 60, stripY - 8);
        ctx2d.fillText('Slide to play', w / 2 - 35, stripY + stripH + 20);

        // Trails
        trails.forEach(t => {
            t.age++;
            const alpha = Math.max(0, 1 - t.age / 40);
            ctx2d.beginPath();
            ctx2d.arc(t.x, t.y, t.radius || 10, 0, Math.PI * 2);
            ctx2d.fillStyle = (t.color || '#00f0ff').replace(')', `, ${alpha})`).replace('hsl', 'hsla');
            if (!t.color.includes('hsl')) {
                ctx2d.fillStyle = `rgba(0, 240, 255, ${alpha})`;
            }
            ctx2d.fill();
        });
        trails = trails.filter(t => t.age < 40);
    }

    function _drawStrings(w, h) {
        ctx2d.fillStyle = 'rgba(10, 14, 26, 0.25)';
        ctx2d.fillRect(0, 0, w, h);

        const numStrings = STRING_NOTES.length;
        for (let i = 0; i < numStrings; i++) {
            const y = (i + 0.5) / numStrings * h;
            const hue = i * 45;

            // String line
            ctx2d.strokeStyle = `hsl(${hue}, 60%, 40%)`;
            ctx2d.lineWidth = 2;
            ctx2d.beginPath(); ctx2d.moveTo(0, y); ctx2d.lineTo(w, y); ctx2d.stroke();

            // Note label
            ctx2d.fillStyle = `hsl(${hue}, 60%, 60%)`;
            ctx2d.font = '11px sans-serif';
            ctx2d.fillText(STRING_NOTES[i], 6, y - 6);

            // Fret markers
            const sc = SCALES[scale] || SCALES.chromatic;
            ctx2d.strokeStyle = `hsla(${hue}, 40%, 30%, 0.3)`;
            ctx2d.lineWidth = 0.5;
            for (let f = 0; f < sc.length; f++) {
                const fx = (f / sc.length) * w;
                ctx2d.beginPath(); ctx2d.moveTo(fx, y - h / numStrings / 2); ctx2d.lineTo(fx, y + h / numStrings / 2); ctx2d.stroke();
            }
        }

        // Vibration trails
        trails.forEach(t => {
            t.age++;
            const alpha = Math.max(0, 1 - t.age / 25);
            const amp = (1 - t.age / 25) * 8;
            ctx2d.strokeStyle = (t.color || '#fff').replace(')', `, ${alpha * 0.7})`).replace('hsl', 'hsla');
            ctx2d.lineWidth = 2;
            ctx2d.beginPath();
            for (let x = t.x - 40; x < t.x + 40; x++) {
                const dx = x - t.x;
                const wave = Math.sin(dx * 0.3 + t.age * 0.5) * amp * Math.exp(-Math.abs(dx) * 0.03);
                if (x === t.x - 40) ctx2d.moveTo(x, t.y + wave);
                else ctx2d.lineTo(x, t.y + wave);
            }
            ctx2d.stroke();
        });
        trails = trails.filter(t => t.age < 25);
    }

    function _drawOrbital(w, h) {
        ctx2d.fillStyle = 'rgba(10, 14, 26, 0.1)';
        ctx2d.fillRect(0, 0, w, h);

        const cx = w / 2, cy = h / 2;
        const maxR = Math.min(cx, cy) * 0.9;

        // Orbit rings
        for (let i = 1; i <= 4; i++) {
            ctx2d.strokeStyle = `rgba(42, 52, 82, ${0.2 + i * 0.05})`;
            ctx2d.lineWidth = 1;
            ctx2d.beginPath();
            ctx2d.arc(cx, cy, maxR * i / 4, 0, Math.PI * 2);
            ctx2d.stroke();
        }

        // Scale lines from center
        const sc = SCALES[scale] || SCALES.chromatic;
        ctx2d.strokeStyle = 'rgba(42, 52, 82, 0.3)';
        for (let i = 0; i < sc.length; i++) {
            const a = (i / sc.length) * Math.PI * 2 - Math.PI / 2;
            ctx2d.beginPath();
            ctx2d.moveTo(cx, cy);
            ctx2d.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
            ctx2d.stroke();
        }

        // Center dot
        ctx2d.fillStyle = 'rgba(0, 240, 255, 0.3)';
        ctx2d.beginPath(); ctx2d.arc(cx, cy, 6, 0, Math.PI * 2); ctx2d.fill();

        // Active orbits
        const now = Date.now();
        orbits.forEach(o => {
            const age = (now - o.born) / 1000;
            const alpha = Math.max(0, 1 - age / 3);
            const hue = (o.angle + Math.PI) / (2 * Math.PI) * 360;
            ctx2d.beginPath();
            ctx2d.arc(o.x, o.y, 12 + o.dist * 8, 0, Math.PI * 2);
            ctx2d.fillStyle = `hsla(${hue}, 80%, 55%, ${alpha * 0.6})`;
            ctx2d.fill();
            ctx2d.strokeStyle = `hsla(${hue}, 90%, 70%, ${alpha})`;
            ctx2d.lineWidth = 2;
            ctx2d.stroke();
        });
        orbits = orbits.filter(o => (now - o.born) < 3000);
    }

    return {
        init, setMode, setInstrument, setScale, SCALES
    };
})();
