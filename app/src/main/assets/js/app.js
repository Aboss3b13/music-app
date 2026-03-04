/**
 * BeatForge Studio — App Controller
 * Wires UI to modules: sequencer, pads, keys, touch instruments, mixer, multitrack, recorder.
 */
(function () {
    'use strict';
    const engine = BeatForge.AudioEngine;
    const inst   = BeatForge.Instruments;
    const seq    = BeatForge.Sequencer;
    const pat    = BeatForge.Patterns;
    const touch  = BeatForge.TouchInstruments;
    const mt     = BeatForge.Multitrack;
    const mixer  = BeatForge.Mixer;
    const rec    = BeatForge.Recorder;

    /* ====== DOM REFS ====== */
    const $ = (s, p) => (p || document).querySelector(s);
    const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

    let currentView = 'sequencer';
    let padBank     = 'drums';
    let keysInst    = 'piano';
    let keysOctave  = 4;
    let isRecording = false;

    /* ====== BOOT ====== */
    document.addEventListener('DOMContentLoaded', () => {
        $('#start-btn').addEventListener('click', _start);
        $('#splash-screen').addEventListener('click', e => {
            if (e.target === $('#splash-screen') || e.target.closest('.splash-content')) _start();
        });
    });

    let started = false;
    function _start() {
        if (started) return;
        started = true;
        engine.init();
        seq.init();
        mixer.init($('#mixer-ch'));

        $('#splash-screen').style.opacity = '0';
        setTimeout(() => {
            $('#splash-screen').style.display = 'none';
            $('#app').classList.remove('hidden');
            _buildUI();
        }, 400);
    }

    /* ====== BUILD UI ====== */
    function _buildUI() {
        _setupNav();
        _setupTransport();
        _setupFX();
        _buildSequencer();
        _buildPads();
        _buildKeyboard();
        _initTouch();
        _setupMultitrack();
        _setupMixerUI();
        _setupExport();
    }

    /* ====== NAVIGATION ====== */
    function _setupNav() {
        $$('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => _switchView(btn.dataset.view));
        });
    }

    function _switchView(view) {
        currentView = view;
        $$('.view').forEach(v => { v.classList.add('hidden'); v.classList.remove('active'); });
        const target = $(`#${view}-view`);
        if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
        $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
        if (view === 'touch') {
            setTimeout(() => touch.setMode($('.tmode.active').dataset.mode), 50);
        }
    }

    /* ====== TRANSPORT ====== */
    function _setupTransport() {
        $('#play-btn').addEventListener('click', _togglePlay);
        $('#stop-btn').addEventListener('click', _stopAll);
        $('#record-btn').addEventListener('click', _toggleRecord);

        $('#bpm-input').value = seq.getBPM();
        $('#bpm-input').addEventListener('change', () => {
            seq.setBPM(parseInt($('#bpm-input').value) || 120);
        });
        $('#bpm-down').addEventListener('click', () => { seq.setBPM(seq.getBPM() - 5); $('#bpm-input').value = seq.getBPM(); });
        $('#bpm-up').addEventListener('click', () => { seq.setBPM(seq.getBPM() + 5); $('#bpm-input').value = seq.getBPM(); });

        $('#metronome-btn').addEventListener('click', () => {
            $('#metronome-btn').classList.toggle('on');
            seq.setMetronome($('#metronome-btn').classList.contains('on'));
        });

        seq.setOnStep(step => {
            if (step < 0) { $('#cur-step').textContent = '1'; return; }
            $('#cur-step').textContent = step + 1;
            $$('.seq-cell').forEach(el => el.classList.remove('cur'));
            $$('.seq-cell[data-step="' + step + '"]').forEach(el => el.classList.add('cur'));
        });
    }

    function _togglePlay() {
        if (seq.isPlaying()) { seq.pause(); _setPlayIcon(false); }
        else { seq.play(); _setPlayIcon(true); }
    }

    function _stopAll() {
        seq.stop(); mt.stopAll(); _setPlayIcon(false);
        if (isRecording) { mt.stopRecording(); isRecording = false; $('#record-btn').classList.remove('recording'); }
    }

    function _toggleRecord() {
        if (isRecording) {
            mt.stopRecording();
            isRecording = false;
            $('#record-btn').classList.remove('recording');
        } else {
            mt.startRecording();
            isRecording = true;
            $('#record-btn').classList.add('recording');
            if (!seq.isPlaying()) { seq.play(); _setPlayIcon(true); }
        }
    }

    function _setPlayIcon(playing) {
        const play = $('#play-btn');
        play.querySelector('.ico-play').classList.toggle('hidden', playing);
        play.querySelector('.ico-pause').classList.toggle('hidden', !playing);
        play.classList.toggle('playing', playing);
    }

    /* ====== FX PANEL ====== */
    function _setupFX() {
        $('#fx-toggle').addEventListener('click', () => $('#fx-panel').classList.toggle('hidden'));

        const fxMap = {
            'fx-reverb': v => engine.setReverb(v / 100),
            'fx-delay': v => engine.setDelay(v / 100),
            'fx-distortion': v => engine.setDistortion(v / 100),
            'fx-filter': v => engine.setFilter(v),
            'swing-amount': v => seq.setSwing(v),
            'master-volume': v => engine.setVolume(v / 100)
        };

        Object.keys(fxMap).forEach(id => {
            const el = $(`#${id}`);
            if (!el) return;
            el.addEventListener('input', () => {
                const val = parseFloat(el.value);
                fxMap[id](val);
                // Update label
                const label = $(`#${id}-val`) || $(`#${id.replace('fx-', '').replace('-amount', '')}-val`);
                if (label) {
                    label.textContent = id === 'fx-filter'
                        ? (val >= 10000 ? (val / 1000).toFixed(0) + 'k' : val.toFixed(0))
                        : Math.round(val);
                }
            });
        });
    }

    /* ====== SEQUENCER GRID ====== */
    function _buildSequencer() {
        const gridEl = $('#seq-grid');
        const tracks = seq.getTracks();
        const labels = seq.getLabels();
        const steps = seq.getSteps();
        const grid = seq.getGrid();
        gridEl.innerHTML = '';

        // Track color palette
        const colors = ['#ef4444','#f59e0b','#00f0ff','#3b82f6','#a855f7','#f472b6','#10b981','#06b6d4','#eab308','#6366f1'];

        tracks.forEach((t, ti) => {
            const row = document.createElement('div');
            row.className = 'seq-row';

            // Label
            const lbl = document.createElement('div');
            lbl.className = 'seq-lbl';
            lbl.innerHTML = `<span class="dot" style="background:${colors[ti % colors.length]}"></span><span class="nm">${labels[t] || t}</span>`;
            lbl.addEventListener('click', () => seq.triggerDrum(t));
            row.appendChild(lbl);

            // Steps container
            const stepsWrap = document.createElement('div');
            stepsWrap.className = 'seq-steps';
            for (let s = 0; s < steps; s++) {
                const cell = document.createElement('div');
                cell.className = 'seq-cell';
                cell.dataset.track = t;
                cell.dataset.step = s;
                if (grid[t] && grid[t][s]) cell.classList.add('on');
                if (s % 4 === 0) cell.classList.add('beat');
                cell.style.setProperty('--trk-color', colors[ti % colors.length]);

                cell.addEventListener('click', () => {
                    seq.toggleStep(t, s);
                    cell.classList.toggle('on');
                });
                stepsWrap.appendChild(cell);
            }
            row.appendChild(stepsWrap);
            gridEl.appendChild(row);
        });

        // Step count buttons (avoid duplicate listeners with event delegation)
        $$('.step-cnt').forEach(btn => {
            btn.onclick = () => {
                $$('.step-cnt').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                seq.setSteps(parseInt(btn.dataset.steps));
                _buildSequencer();
            };
        });

        // Pattern presets
        const pp = $('#pattern-preset');
        pp.onchange = () => {
            const key = pp.value;
            if (!key) return;
            const p = pat.get(key);
            if (p) { seq.loadPattern(p); $('#bpm-input').value = seq.getBPM(); _buildSequencer(); }
        };

        // Clear
        const clr = $('#clear-seq');
        if (clr) clr.onclick = () => { seq.clearGrid(); _buildSequencer(); };
    }

    /* ====== PAD GRID ====== */
    function _buildPads() {
        const gridEl = $('#pad-grid');
        gridEl.innerHTML = '';

        const banks = inst.PAD_BANKS;
        const bank = banks[padBank];
        if (!bank) return;

        bank.forEach(item => {
            const pad = document.createElement('button');
            pad.className = 'pad';
            pad.innerHTML = `<span class="p-name">${item.label}</span>`;

            const _play = (e) => {
                e.preventDefault();
                engine.resume();
                pad.classList.add('hit');
                setTimeout(() => pad.classList.remove('hit'), 150);
                $('#pad-name').textContent = item.label;

                const c = engine.getContext();
                const dest = engine.getDestination();
                if (item.drum) {
                    inst.playDrum(c, dest, item.drum, c.currentTime);
                } else if (item.note) {
                    inst.playSynth(c, dest, item.note, c.currentTime, 0.4, 0.7, item.synth || 'bass');
                }

                if (mt.isRecording()) {
                    mt.recordEvent({
                        type: item.drum ? 'drum' : 'synth',
                        instrument: item.drum || item.synth,
                        note: item.note || '', velocity: 0.7, time: c.currentTime
                    });
                }
            };

            pad.addEventListener('touchstart', _play);
            pad.addEventListener('mousedown', _play);
            gridEl.appendChild(pad);
        });

        // Bank switcher
        $$('.bank').forEach(btn => {
            btn.onclick = () => {
                padBank = btn.dataset.bank;
                $$('.bank').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                _buildPads();
            };
        });
    }

    /* ====== PIANO KEYBOARD ====== */
    function _buildKeyboard() {
        const kb = $('#piano-kb');
        kb.innerHTML = '';

        const whiteNotes = ['C','D','E','F','G','A','B'];
        const blackMap = { C:'C#', D:'D#', F:'F#', G:'G#', A:'A#' };

        for (let octOff = 0; octOff < 2; octOff++) {
            const oct = keysOctave + octOff;
            whiteNotes.forEach(note => {
                const noteName = note + oct;
                const key = document.createElement('div');
                key.className = 'p-key w';
                key.dataset.note = noteName;
                key.innerHTML = `<span>${note}${oct}</span>`;

                const _play = (e) => { e.preventDefault(); _playKey(noteName, key); };
                key.addEventListener('touchstart', _play);
                key.addEventListener('mousedown', _play);
                key.addEventListener('touchend', () => key.classList.remove('pressed'));
                key.addEventListener('mouseup', () => key.classList.remove('pressed'));
                key.addEventListener('mouseleave', () => key.classList.remove('pressed'));
                kb.appendChild(key);

                if (blackMap[note]) {
                    const bn = blackMap[note] + oct;
                    const bk = document.createElement('div');
                    bk.className = 'p-key b';
                    bk.dataset.note = bn;

                    const _playB = (e) => { e.preventDefault(); _playKey(bn, bk); };
                    bk.addEventListener('touchstart', _playB);
                    bk.addEventListener('mousedown', _playB);
                    bk.addEventListener('touchend', () => bk.classList.remove('pressed'));
                    bk.addEventListener('mouseup', () => bk.classList.remove('pressed'));
                    bk.addEventListener('mouseleave', () => bk.classList.remove('pressed'));
                    kb.appendChild(bk);
                }
            });
        }

        // Instrument selector
        const ki = $('#keys-inst');
        ki.onchange = () => { keysInst = ki.value; };

        // Octave controls
        const od = $('#oct-down'), ou = $('#oct-up');
        od.onclick = () => { keysOctave = Math.max(1, keysOctave - 1); $('#oct-disp').textContent = keysOctave; _buildKeyboard(); };
        ou.onclick = () => { keysOctave = Math.min(7, keysOctave + 1); $('#oct-disp').textContent = keysOctave; _buildKeyboard(); };
    }

    function _playKey(note, el) {
        engine.resume();
        el.classList.add('pressed');
        const c = engine.getContext();
        inst.playSynth(c, engine.getDestination(), note, c.currentTime, 0.5, 0.65, keysInst);

        if (mt.isRecording()) {
            mt.recordEvent({ type: 'synth', instrument: keysInst, note, velocity: 0.65, duration: 0.5, time: c.currentTime });
        }
    }

    /* ====== TOUCH INSTRUMENTS ====== */
    function _initTouch() {
        touch.init($('#touch-canvas'));

        $$('.tmode').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.tmode').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                touch.setMode(btn.dataset.mode);
            });
        });

        $('#touch-inst').addEventListener('change', () => touch.setInstrument($('#touch-inst').value));
        $('#touch-scale').addEventListener('change', () => touch.setScale($('#touch-scale').value));
    }

    /* ====== MULTITRACK ====== */
    function _setupMultitrack() {
        mt.setOnTrackAdded(() => _renderTracks());
    }

    function _renderTracks() {
        const tracks = mt.getTracks();
        const el = $('#mt-tracks');
        const empty = $('#mt-empty');

        if (tracks.length === 0) {
            el.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');
        el.innerHTML = '';

        const colors = ['#00f0ff','#a855f7','#f59e0b','#10b981','#f472b6','#3b82f6'];

        tracks.forEach((t, i) => {
            const row = document.createElement('div');
            row.className = 'mt-track';
            const color = colors[i % colors.length];

            row.innerHTML = `
                <div class="mt-color" style="background:${color}"></div>
                <div class="mt-info">
                    <div class="mt-name">${t.name}</div>
                    <div class="mt-wave"><canvas></canvas></div>
                </div>
                <div class="mt-btns">
                    <button class="mt-btn ${t.muted ? 'active-m' : ''}" data-action="mute" data-id="${t.id}" title="Mute">M</button>
                    <button class="mt-btn ${t.solo ? 'active-s' : ''}" data-action="solo" data-id="${t.id}" title="Solo">S</button>
                    <button class="mt-btn" data-action="delete" data-id="${t.id}" title="Delete">✕</button>
                </div>
            `;
            el.appendChild(row);

            // Draw waveform
            const canvas = row.querySelector('.mt-wave canvas');
            if (canvas) _drawTrackWaveform(canvas, color);
        });

        // Event delegation
        el.onclick = e => {
            const btn = e.target.closest('.mt-btn');
            if (!btn) return;
            const id = parseInt(btn.dataset.id);
            switch (btn.dataset.action) {
                case 'mute': mt.toggleMute(id); break;
                case 'solo': mt.toggleSolo(id); break;
                case 'delete': mt.deleteTrack(id); break;
            }
            _renderTracks();
        };
    }

    function _drawTrackWaveform(canvas, color) {
        const w = canvas.parentElement.clientWidth || 200;
        canvas.width = w * 2;
        canvas.height = 60;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        const c2d = canvas.getContext('2d');
        c2d.fillStyle = color.replace(')', ',0.3)').replace('rgb', 'rgba');
        if (!color.startsWith('rgba')) {
            // hex to rgba
            c2d.fillStyle = color + '55';
        }
        const bars = 80;
        for (let i = 0; i < bars; i++) {
            const h = (Math.random() * 0.6 + 0.2) * 60;
            c2d.fillRect(i * (canvas.width / bars), (60 - h) / 2, canvas.width / bars - 1, h);
        }
    }

    /* ====== MIXER UI ====== */
    function _setupMixerUI() {
        $$('.mix-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.mix-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.mode;
                const mta = $('#mt-area'), mxa = $('#mixer-area');
                mta.classList.toggle('hidden', mode !== 'tracks');
                mxa.classList.toggle('hidden', mode !== 'mixer');
                if (mode === 'mixer') _renderMixer();
            });
        });
    }

    function _renderMixer() {
        const el = $('#mixer-ch');
        const channels = mixer.getChannels();
        el.innerHTML = '';

        const wrap = document.createElement('div');
        wrap.className = 'mixer-ch-wrap';

        channels.forEach((ch, i) => {
            const strip = document.createElement('div');
            strip.className = 'mix-ch' + (ch.isMaster ? ' master' : '');

            strip.innerHTML = `
                <div class="mix-ch-name">${ch.name}</div>
                <div class="mix-meter"><div class="mix-meter-fill" data-ch="${i}" style="height:0%"></div></div>
                <input type="range" class="mix-fader" orient="vertical" min="0" max="100" value="${ch.gain}" data-ch="${i}">
                <div class="mix-btn-row">
                    <button class="mix-btn ${ch.muted ? 'mute-on' : ''}" data-action="mute" data-ch="${i}">M</button>
                    <button class="mix-btn ${ch.solo ? 'solo-on' : ''}" data-action="solo" data-ch="${i}">S</button>
                </div>
            `;
            wrap.appendChild(strip);
        });

        el.appendChild(wrap);

        // Events
        el.addEventListener('input', e => {
            if (e.target.classList.contains('mix-fader')) {
                mixer.setChannelGain(parseInt(e.target.dataset.ch), parseInt(e.target.value));
            }
        });
        el.addEventListener('click', e => {
            const btn = e.target.closest('.mix-btn');
            if (!btn) return;
            const i = parseInt(btn.dataset.ch);
            if (btn.dataset.action === 'mute') mixer.toggleChannelMute(i);
            if (btn.dataset.action === 'solo') mixer.toggleChannelSolo(i);
            _renderMixer();
        });

        _animateMeters();
    }

    let meterAnim = null;
    function _animateMeters() {
        cancelAnimationFrame(meterAnim);
        function tick() {
            meterAnim = requestAnimationFrame(tick);
            mixer.getChannels().forEach((ch, i) => {
                const meter = $(`.mix-meter-fill[data-ch="${i}"]`);
                if (meter) meter.style.height = (ch.level * 100) + '%';
            });
        }
        tick();
    }

    /* ====== EXPORT ====== */
    function _setupExport() {
        const dlg = $('#export-dialog');
        const expBtn = $('#export-btn');
        if (expBtn) expBtn.addEventListener('click', () => dlg.classList.remove('hidden'));

        $('#export-cancel').addEventListener('click', () => dlg.classList.add('hidden'));

        $('#export-confirm').addEventListener('click', async () => {
            const loops = parseInt($('#export-loops').value) || 4;
            const filename = $('#export-filename').value || 'beatforge-track';
            const prog = $('#export-progress');
            prog.classList.remove('hidden');
            $('#export-confirm').disabled = true;

            rec.setOnProgress(p => {
                $('#progress-fill').style.width = (p * 100) + '%';
                if (p >= 1) $('#progress-text').textContent = 'Done!';
            });

            try {
                let blob;
                if (mt.getTracks().length > 0) blob = await mt.mixdown();
                if (!blob) blob = await rec.renderWAV(loops);
                rec.download(blob, filename);
            } catch (err) {
                console.error('Export failed:', err);
                $('#progress-text').textContent = 'Export failed';
            }

            setTimeout(() => {
                prog.classList.add('hidden');
                $('#export-confirm').disabled = false;
                dlg.classList.add('hidden');
                $('#progress-fill').style.width = '0%';
                $('#progress-text').textContent = 'Rendering…';
            }, 1500);
        });

        dlg.addEventListener('click', e => { if (e.target === dlg) dlg.classList.add('hidden'); });
    }

})();
