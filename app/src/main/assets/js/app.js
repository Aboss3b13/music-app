/**
 * BeatForge Studio - Main Application
 * UI management, event handling, and application orchestration
 */

window.BeatForge = window.BeatForge || {};

(function () {
    const engine = BeatForge.AudioEngine;
    const instruments = BeatForge.Instruments;
    const sequencer = BeatForge.Sequencer;
    const mixer = BeatForge.Mixer;
    const patterns = BeatForge.Patterns;
    const recorder = BeatForge.Recorder;

    let currentView = 'sequencer';
    let currentOctave = 4;
    let currentKeysInstrument = 'piano';
    let currentPadBank = 'drums';
    let visualizerFrame = null;

    // =====================================================
    // INITIALIZATION
    // =====================================================

    function init() {
        // Splash screen
        document.getElementById('start-btn').addEventListener('click', startApp);
    }

    function startApp() {
        // Initialize audio
        engine.init();
        sequencer.init();

        // Build UI
        buildSequencerGrid();
        buildPadGrid();
        buildPianoKeyboard();
        mixer.buildMixerUI();
        populateInstrumentList();

        // Attach all event listeners
        attachTransportEvents();
        attachViewEvents();
        attachEffectsEvents();
        attachExportEvents();
        attachPatternPresetEvents();
        attachStepCountEvents();

        // Sequencer callbacks
        sequencer.onStep(onSequencerStep);
        sequencer.onStop(onSequencerStop);

        // Start visualizers
        startVisualizers();
        mixer.startMeters();

        // Fade out splash
        const splash = document.getElementById('splash-screen');
        splash.classList.add('fade-out');
        setTimeout(() => splash.style.display = 'none', 600);

        document.getElementById('app').classList.remove('hidden');
    }

    // =====================================================
    // SEQUENCER GRID
    // =====================================================

    function buildSequencerGrid() {
        const grid = document.getElementById('sequencer-grid');
        const header = document.getElementById('steps-header');
        const steps = sequencer.getSteps();
        const tracks = instruments.DEFAULT_TRACKS;

        // Build step numbers header
        header.innerHTML = '';
        for (let i = 0; i < steps; i++) {
            const num = document.createElement('div');
            num.className = 'seq-step-num' + (i % 4 === 0 ? ' beat' : '');
            num.textContent = i + 1;
            header.appendChild(num);
        }

        // Build track rows
        grid.innerHTML = '';
        tracks.forEach(track => {
            const info = track.type === 'drum'
                ? instruments.DRUM_INSTRUMENTS[track.instrument]
                : instruments.SYNTH_INSTRUMENTS[track.instrument];

            const row = document.createElement('div');
            row.className = 'seq-row';
            row.dataset.trackId = track.id;

            // Label
            const label = document.createElement('div');
            label.className = 'seq-row-label';
            label.innerHTML = `
                <span class="color-dot" style="background:${info.color}"></span>
                <span class="name">${info.name}</span>
            `;
            label.addEventListener('click', () => {
                // Preview sound
                if (track.type === 'drum') {
                    sequencer.triggerDrum(track.instrument, 0.8);
                } else {
                    sequencer.triggerSynth(track.instrument, track.note, 0.4, 0.7);
                }
            });
            row.appendChild(label);

            // Steps
            const stepsContainer = document.createElement('div');
            stepsContainer.className = 'seq-steps';

            for (let i = 0; i < steps; i++) {
                const step = document.createElement('div');
                step.className = 'seq-step' + (i % 4 === 0 ? ' beat-marker' : '');
                if (track.instrument === 'nebula') step.classList.add('nebula-glow');
                step.dataset.track = track.id;
                step.dataset.step = i;

                // Set color based on instrument
                step.style.setProperty('--step-color', info.color);

                step.addEventListener('click', onStepClick);
                step.addEventListener('touchstart', onStepTouch, { passive: false });

                stepsContainer.appendChild(step);
            }
            row.appendChild(stepsContainer);

            // Controls
            const controls = document.createElement('div');
            controls.className = 'seq-row-controls';

            const volSlider = document.createElement('input');
            volSlider.type = 'range';
            volSlider.className = 'seq-vol-slider';
            volSlider.min = 0;
            volSlider.max = 100;
            volSlider.value = 80;
            volSlider.dataset.track = track.id;
            volSlider.addEventListener('input', (e) => {
                sequencer.setTrackVolume(track.id, parseInt(e.target.value) / 100);
            });

            const muteBtn = document.createElement('button');
            muteBtn.className = 'seq-mute-btn';
            muteBtn.textContent = 'M';
            muteBtn.dataset.track = track.id;
            muteBtn.addEventListener('click', (e) => {
                e.target.classList.toggle('muted');
                sequencer.setTrackMute(track.id, e.target.classList.contains('muted'));
            });

            controls.appendChild(volSlider);
            controls.appendChild(muteBtn);
            row.appendChild(controls);

            grid.appendChild(row);
        });
    }

    function onStepClick(e) {
        const trackId = e.target.dataset.track;
        const step = parseInt(e.target.dataset.step);
        const active = sequencer.toggleStep(trackId, step);
        e.target.classList.toggle('active', active);

        if (active) {
            e.target.style.background = e.target.style.getPropertyValue('--step-color');
            e.target.style.opacity = '0.8';
        } else {
            e.target.style.background = '';
            e.target.style.opacity = '';
        }
    }

    function onStepTouch(e) {
        e.preventDefault();
        onStepClick(e);
    }

    function refreshSequencerUI() {
        const steps = sequencer.getSteps();
        const tracks = instruments.DEFAULT_TRACKS;
        const pat = sequencer.getPattern();

        tracks.forEach(track => {
            for (let i = 0; i < steps; i++) {
                const el = document.querySelector(
                    `.seq-step[data-track="${track.id}"][data-step="${i}"]`
                );
                if (el) {
                    const active = pat[track.id] && pat[track.id][i];
                    el.classList.toggle('active', !!active);
                    if (active) {
                        el.style.background = el.style.getPropertyValue('--step-color');
                        el.style.opacity = '0.8';
                    } else {
                        el.style.background = '';
                        el.style.opacity = '';
                    }
                }
            }
        });
    }

    function onSequencerStep(step) {
        // Update step display
        document.getElementById('current-step').textContent = step + 1;

        // Highlight current step
        document.querySelectorAll('.seq-step.current').forEach(el => {
            el.classList.remove('current');
        });
        document.querySelectorAll(`.seq-step[data-step="${step}"]`).forEach(el => {
            el.classList.add('current');
        });
    }

    function onSequencerStop() {
        document.querySelectorAll('.seq-step.current').forEach(el => {
            el.classList.remove('current');
        });
        document.getElementById('current-step').textContent = '1';

        const playBtn = document.getElementById('play-btn');
        playBtn.classList.remove('playing');
        playBtn.querySelector('.play-icon').classList.remove('hidden');
        playBtn.querySelector('.pause-icon').classList.add('hidden');
    }

    // =====================================================
    // PAD GRID
    // =====================================================

    function buildPadGrid() {
        const grid = document.getElementById('pad-grid');
        grid.innerHTML = '';
        updatePadGrid();
    }

    function updatePadGrid() {
        const grid = document.getElementById('pad-grid');
        grid.innerHTML = '';
        const bank = instruments.PAD_BANKS[currentPadBank];
        const keyMap = '1234QWERASDFZXCV';

        bank.forEach((sound, i) => {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.dataset.sound = sound;
            pad.dataset.bank = currentPadBank;
            pad.dataset.index = i;

            let name = sound;
            if (currentPadBank === 'drums') {
                const drum = instruments.DRUM_INSTRUMENTS[sound];
                name = drum ? drum.name : sound;
                if (drum) pad.style.borderColor = drum.color + '44';
            }

            pad.innerHTML = `
                <span class="pad-name">${name}</span>
                <span class="pad-key">${keyMap[i]}</span>
            `;

            pad.addEventListener('mousedown', onPadTrigger);
            pad.addEventListener('touchstart', onPadTrigger, { passive: false });

            grid.appendChild(pad);
        });
    }

    function onPadTrigger(e) {
        e.preventDefault();
        const pad = e.currentTarget;
        const sound = pad.dataset.sound;
        const bank = pad.dataset.bank;

        pad.classList.add('triggered');
        setTimeout(() => pad.classList.remove('triggered'), 200);

        // Update info
        document.getElementById('pad-current-name').textContent =
            bank === 'drums' ? (instruments.DRUM_INSTRUMENTS[sound]?.name || sound) : sound;
        document.getElementById('pad-velocity-bar').style.width = '80%';
        setTimeout(() => {
            document.getElementById('pad-velocity-bar').style.width = '0%';
        }, 300);

        if (bank === 'drums') {
            sequencer.triggerDrum(sound, 0.8);
        } else {
            const instType = bank === 'nebula' ? 'nebula' : (bank === 'bass' ? 'bass' : 'lead');
            sequencer.triggerSynth(instType, sound, 0.5, 0.7);
        }
    }

    // =====================================================
    // PIANO KEYBOARD
    // =====================================================

    function buildPianoKeyboard() {
        const keyboard = document.getElementById('piano-keyboard');
        keyboard.innerHTML = '';

        const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const blackNotes = { 'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#' };

        // Build 3 octaves
        for (let oct = currentOctave - 1; oct <= currentOctave + 1; oct++) {
            whiteNotes.forEach(note => {
                const fullNote = note + oct;
                const whiteKey = document.createElement('div');
                whiteKey.className = 'piano-key white';
                whiteKey.dataset.note = fullNote;
                whiteKey.innerHTML = `<span class="key-label">${fullNote}</span>`;
                whiteKey.addEventListener('mousedown', onKeyPress);
                whiteKey.addEventListener('mouseup', onKeyRelease);
                whiteKey.addEventListener('mouseleave', onKeyRelease);
                whiteKey.addEventListener('touchstart', onKeyPress, { passive: false });
                whiteKey.addEventListener('touchend', onKeyRelease);
                keyboard.appendChild(whiteKey);

                // Black key after white (if applicable)
                if (blackNotes[note]) {
                    const blackNote = blackNotes[note] + oct;
                    const blackKey = document.createElement('div');
                    blackKey.className = 'piano-key black';
                    blackKey.dataset.note = blackNote;
                    blackKey.innerHTML = `<span class="key-label">${blackNotes[note]}</span>`;
                    blackKey.addEventListener('mousedown', onKeyPress);
                    blackKey.addEventListener('mouseup', onKeyRelease);
                    blackKey.addEventListener('mouseleave', onKeyRelease);
                    blackKey.addEventListener('touchstart', onKeyPress, { passive: false });
                    blackKey.addEventListener('touchend', onKeyRelease);
                    keyboard.appendChild(blackKey);
                }
            });
        }
    }

    function onKeyPress(e) {
        e.preventDefault();
        const key = e.currentTarget;
        const note = key.dataset.note;
        key.classList.add('pressed');
        sequencer.triggerSynth(currentKeysInstrument, note, 1.0, 0.7);
    }

    function onKeyRelease(e) {
        e.currentTarget.classList.remove('pressed');
    }

    // =====================================================
    // INSTRUMENT LIST
    // =====================================================

    function populateInstrumentList() {
        const list = document.getElementById('instrument-list');
        list.innerHTML = '';

        // Drums
        Object.entries(instruments.DRUM_INSTRUMENTS).forEach(([id, info]) => {
            const item = document.createElement('div');
            item.className = 'instrument-item';
            item.innerHTML = `<span class="dot" style="background:${info.color}"></span>${info.name}`;
            item.addEventListener('click', () => sequencer.triggerDrum(id, 0.8));
            list.appendChild(item);
        });

        // Divider
        const divider = document.createElement('div');
        divider.style.cssText = 'border-bottom:1px solid var(--border-color);margin:6px 0';
        list.appendChild(divider);

        // Synths
        Object.entries(instruments.SYNTH_INSTRUMENTS).forEach(([id, info]) => {
            const item = document.createElement('div');
            item.className = 'instrument-item';
            item.innerHTML = `<span class="dot" style="background:${info.color}"></span>${info.name}`;
            item.addEventListener('click', () => sequencer.triggerSynth(id, 'C4', 0.5, 0.7));
            list.appendChild(item);
        });
    }

    // =====================================================
    // EVENT HANDLERS
    // =====================================================

    function attachTransportEvents() {
        // Play/Pause
        document.getElementById('play-btn').addEventListener('click', () => {
            if (sequencer.getIsPlaying()) {
                sequencer.pause();
                const btn = document.getElementById('play-btn');
                btn.classList.remove('playing');
                btn.querySelector('.play-icon').classList.remove('hidden');
                btn.querySelector('.pause-icon').classList.add('hidden');
            } else {
                sequencer.play();
                const btn = document.getElementById('play-btn');
                btn.classList.add('playing');
                btn.querySelector('.play-icon').classList.add('hidden');
                btn.querySelector('.pause-icon').classList.remove('hidden');
            }
        });

        // Stop
        document.getElementById('stop-btn').addEventListener('click', () => {
            sequencer.stop();
        });

        // BPM
        const bpmInput = document.getElementById('bpm-input');
        bpmInput.addEventListener('change', (e) => {
            sequencer.setBPM(parseInt(e.target.value));
        });
        document.getElementById('bpm-down').addEventListener('click', () => {
            const newBPM = sequencer.getBPM() - 1;
            sequencer.setBPM(newBPM);
            bpmInput.value = sequencer.getBPM();
        });
        document.getElementById('bpm-up').addEventListener('click', () => {
            const newBPM = sequencer.getBPM() + 1;
            sequencer.setBPM(newBPM);
            bpmInput.value = sequencer.getBPM();
        });

        // Swing
        document.getElementById('swing-amount').addEventListener('input', (e) => {
            sequencer.setSwing(parseInt(e.target.value));
        });

        // Metronome
        document.getElementById('metronome-btn').addEventListener('click', (e) => {
            const enabled = !sequencer.getMetronome();
            sequencer.setMetronome(enabled);
            e.currentTarget.classList.toggle('active', enabled);
        });

        // Loop
        document.getElementById('loop-btn').addEventListener('click', (e) => {
            const enabled = !sequencer.getLoop();
            sequencer.setLoop(enabled);
            e.currentTarget.classList.toggle('active', enabled);
        });

        // Record button opens export dialog
        document.getElementById('record-btn').addEventListener('click', () => {
            document.getElementById('export-dialog').classList.remove('hidden');
        });
    }

    function attachViewEvents() {
        // View tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                switchView(view);
            });
        });

        // Pad bank selector
        document.querySelectorAll('.pad-bank').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.pad-bank').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentPadBank = e.target.dataset.bank;
                updatePadGrid();
            });
        });

        // Keys instrument selector
        document.getElementById('keys-instrument').addEventListener('change', (e) => {
            currentKeysInstrument = e.target.value;
        });

        // Octave controls
        document.getElementById('octave-down').addEventListener('click', () => {
            if (currentOctave > 1) {
                currentOctave--;
                document.getElementById('octave-display').textContent = currentOctave;
                buildPianoKeyboard();
            }
        });
        document.getElementById('octave-up').addEventListener('click', () => {
            if (currentOctave < 7) {
                currentOctave++;
                document.getElementById('octave-display').textContent = currentOctave;
                buildPianoKeyboard();
            }
        });
    }

    function attachEffectsEvents() {
        document.getElementById('fx-reverb').addEventListener('input', (e) => {
            engine.setReverb(parseInt(e.target.value));
            document.getElementById('fx-reverb-val').textContent = e.target.value + '%';
        });

        document.getElementById('fx-delay').addEventListener('input', (e) => {
            engine.setDelay(parseInt(e.target.value));
            document.getElementById('fx-delay-val').textContent = e.target.value + '%';
        });

        document.getElementById('fx-distortion').addEventListener('input', (e) => {
            engine.setDistortion(parseInt(e.target.value));
            document.getElementById('fx-distortion-val').textContent = e.target.value + '%';
        });

        document.getElementById('fx-filter').addEventListener('input', (e) => {
            const freq = parseInt(e.target.value);
            const res = parseFloat(document.getElementById('fx-resonance').value);
            engine.setFilter(freq, res);
            document.getElementById('fx-filter-val').textContent =
                freq >= 1000 ? (freq / 1000).toFixed(1) + 'k' : freq + '';
        });

        document.getElementById('fx-resonance').addEventListener('input', (e) => {
            const freq = parseInt(document.getElementById('fx-filter').value);
            engine.setFilter(freq, parseFloat(e.target.value));
            document.getElementById('fx-resonance-val').textContent =
                parseFloat(e.target.value).toFixed(1);
        });

        document.getElementById('master-volume').addEventListener('input', (e) => {
            engine.setMasterVolume(parseInt(e.target.value));
            document.getElementById('master-vol-val').textContent = e.target.value + '%';
        });
    }

    function attachExportEvents() {
        document.getElementById('export-wav').addEventListener('click', () => {
            document.getElementById('export-dialog').classList.remove('hidden');
        });

        document.getElementById('export-share').addEventListener('click', () => {
            doExport('share');
        });

        document.getElementById('export-cancel').addEventListener('click', () => {
            document.getElementById('export-dialog').classList.add('hidden');
        });

        document.getElementById('export-confirm').addEventListener('click', () => {
            doExport('save');
        });
    }

    function attachPatternPresetEvents() {
        document.getElementById('pattern-preset').addEventListener('change', (e) => {
            const presetId = e.target.value;
            if (!presetId) return;

            patterns.loadPreset(presetId, sequencer);

            // Update BPM display
            document.getElementById('bpm-input').value = sequencer.getBPM();
            document.getElementById('total-steps').textContent = sequencer.getSteps();

            // Rebuild and refresh
            buildSequencerGrid();
            refreshSequencerUI();
        });
    }

    function attachStepCountEvents() {
        document.querySelectorAll('.step-count').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const steps = parseInt(e.target.dataset.steps);
                document.querySelectorAll('.step-count').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                sequencer.setSteps(steps);
                document.getElementById('total-steps').textContent = steps;
                buildSequencerGrid();
                refreshSequencerUI();
            });
        });
    }

    // =====================================================
    // VIEW SWITCHING
    // =====================================================

    function switchView(view) {
        currentView = view;

        // Update tabs
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('active', t.dataset.view === view);
        });

        // Update views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.add('hidden');
        });

        const viewEl = document.getElementById(view + '-view');
        if (viewEl) {
            viewEl.classList.remove('hidden');
        }
    }

    // =====================================================
    // EXPORT
    // =====================================================

    async function doExport(mode) {
        const format = document.getElementById('export-format')?.value || 'wav';
        const loops = parseInt(document.getElementById('export-loops')?.value || 4);
        const filename = document.getElementById('export-filename')?.value || 'beatforge-track';

        const progressEl = document.getElementById('export-progress');
        const fillEl = document.getElementById('progress-fill');
        const textEl = document.getElementById('progress-text');

        progressEl.classList.remove('hidden');
        fillEl.style.width = '0%';
        textEl.textContent = 'Rendering audio...';

        const updateProgress = (p) => {
            fillEl.style.width = (p * 100) + '%';
            if (p < 0.5) textEl.textContent = 'Scheduling notes...';
            else if (p < 0.8) textEl.textContent = 'Rendering audio...';
            else if (p < 1) textEl.textContent = 'Encoding file...';
            else textEl.textContent = 'Complete!';
        };

        try {
            if (mode === 'share') {
                await recorder.shareFile({
                    bpm: sequencer.getBPM(),
                    steps: sequencer.getSteps(),
                    pattern: sequencer.getPattern(),
                    trackConfigs: instruments.DEFAULT_TRACKS,
                    loops,
                    filename,
                    onProgress: updateProgress,
                });
            } else {
                await recorder.exportWAV({
                    bpm: sequencer.getBPM(),
                    steps: sequencer.getSteps(),
                    pattern: sequencer.getPattern(),
                    trackConfigs: instruments.DEFAULT_TRACKS,
                    loops,
                    filename,
                    onProgress: updateProgress,
                });
            }

            textEl.textContent = 'Export complete! ✓';
            setTimeout(() => {
                document.getElementById('export-dialog').classList.add('hidden');
                progressEl.classList.add('hidden');
            }, 1500);
        } catch (err) {
            textEl.textContent = 'Error: ' + err.message;
            console.error('Export error:', err);
        }
    }

    // =====================================================
    // VISUALIZERS
    // =====================================================

    function startVisualizers() {
        drawVisualizer();
        drawMasterVisualizer();
    }

    function drawVisualizer() {
        const canvas = document.getElementById('waveform-visualizer');
        if (!canvas) return;

        const ctx2d = canvas.getContext('2d');
        const analyser = engine.getWaveformAnalyser();
        if (!analyser) {
            visualizerFrame = requestAnimationFrame(drawVisualizer);
            return;
        }

        canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
        canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);

        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);

        function draw() {
            visualizerFrame = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(data);

            const w = canvas.width;
            const h = canvas.height;

            ctx2d.fillStyle = 'rgba(10, 14, 26, 0.3)';
            ctx2d.fillRect(0, 0, w, h);

            ctx2d.lineWidth = 2;
            ctx2d.strokeStyle = '#00f0ff';
            ctx2d.beginPath();

            const sliceWidth = w / bufLen;
            let x = 0;

            for (let i = 0; i < bufLen; i++) {
                const v = data[i] / 128.0;
                const y = (v * h) / 2;

                if (i === 0) ctx2d.moveTo(x, y);
                else ctx2d.lineTo(x, y);

                x += sliceWidth;
            }

            ctx2d.lineTo(w, h / 2);
            ctx2d.stroke();
        }

        draw();
    }

    function drawMasterVisualizer() {
        const canvas = document.getElementById('master-visualizer');
        if (!canvas) return;

        const ctx2d = canvas.getContext('2d');
        const analyser = engine.getAnalyser();
        if (!analyser) return;

        canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
        canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);

        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);

        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(data);

            const w = canvas.width;
            const h = canvas.height;

            ctx2d.fillStyle = 'rgba(21, 27, 46, 0.4)';
            ctx2d.fillRect(0, 0, w, h);

            const barWidth = w / bufLen * 2.5;
            let x = 0;

            for (let i = 0; i < bufLen; i++) {
                const barHeight = (data[i] / 255) * h;
                const hue = 180 + (i / bufLen) * 100;
                ctx2d.fillStyle = `hsl(${hue}, 80%, 55%)`;
                ctx2d.fillRect(x, h - barHeight, barWidth - 1, barHeight);
                x += barWidth;
                if (x > w) break;
            }
        }

        draw();
    }

    // =====================================================
    // KEYBOARD SHORTCUTS
    // =====================================================

    document.addEventListener('keydown', (e) => {
        // Don't handle if focus is on an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                document.getElementById('play-btn').click();
                break;
            case 'Escape':
                sequencer.stop();
                break;
        }

        // Pad keyboard mapping
        const padKeys = '1234qwerasdfzxcv';
        const keyIndex = padKeys.indexOf(e.key.toLowerCase());
        if (keyIndex !== -1 && currentView === 'pads') {
            const pads = document.querySelectorAll('.pad');
            if (pads[keyIndex]) {
                pads[keyIndex].dispatchEvent(new MouseEvent('mousedown'));
            }
        }

        // Piano keyboard mapping (bottom two rows = white keys)
        if (currentView === 'keys') {
            const pianoMap = {
                'a': 'C', 's': 'D', 'd': 'E', 'f': 'F',
                'g': 'G', 'h': 'A', 'j': 'B',
                'k': 'C+1', 'l': 'D+1',
                'w': 'C#', 'e': 'D#', 't': 'F#', 'y': 'G#', 'u': 'A#',
            };

            const mapped = pianoMap[e.key.toLowerCase()];
            if (mapped) {
                let note, oct;
                if (mapped.includes('+1')) {
                    note = mapped.replace('+1', '');
                    oct = currentOctave + 1;
                } else {
                    note = mapped;
                    oct = currentOctave;
                }
                const fullNote = note + oct;
                sequencer.triggerSynth(currentKeysInstrument, fullNote, 0.5, 0.7);

                // Highlight key
                const keyEl = document.querySelector(`.piano-key[data-note="${fullNote}"]`);
                if (keyEl) {
                    keyEl.classList.add('pressed');
                    setTimeout(() => keyEl.classList.remove('pressed'), 200);
                }
            }
        }
    });

    // =====================================================
    // INIT ON LOAD
    // =====================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
