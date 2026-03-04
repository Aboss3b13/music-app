/**
 * BeatForge Studio — Step Sequencer (mobile-friendly)
 * Drives the drum-machine grid with Web Audio scheduling.
 */
window.BeatForge = window.BeatForge || {};

BeatForge.Sequencer = (function () {
    const engine = BeatForge.AudioEngine;
    const inst   = BeatForge.Instruments;

    const DRUM_TRACKS = ['kick','snare','hihat','ohihat','clap','rim','shaker','ride','tom','crash'];
    const TRACK_LABELS = {
        kick:'Kick', snare:'Snare', hihat:'HiHat', ohihat:'OH',
        clap:'Clap', rim:'Rim', shaker:'Shake', ride:'Ride',
        tom:'Tom', crash:'Crash'
    };

    let bpm = 120, steps = 16, swing = 0;
    let playing = false, paused = false;
    let curStep = -1;
    let grid = {};          // grid[track][step] = 0|1
    let timerID = null;
    let nextNoteTime = 0;
    let scheduleAheadTime = 0.1;
    let lookAhead = 25;     // ms
    let metronome = false;
    let onStep = null;      // callback(step)

    function init() {
        _resetGrid();
    }

    function _resetGrid() {
        DRUM_TRACKS.forEach(t => {
            grid[t] = grid[t] || [];
            while (grid[t].length < steps) grid[t].push(0);
            grid[t].length = steps;
        });
    }

    function setSteps(n) {
        steps = n;
        _resetGrid();
    }

    function setBPM(b) { bpm = Math.max(40, Math.min(300, b)); }
    function getBPM() { return bpm; }
    function getSteps() { return steps; }
    function setSwing(s) { swing = s; } // 0–100
    function setMetronome(m) { metronome = m; }
    function isPlaying() { return playing; }
    function getCurrentStep() { return curStep; }

    function toggleStep(track, step) {
        if (!grid[track]) grid[track] = new Array(steps).fill(0);
        grid[track][step] = grid[track][step] ? 0 : 1;
    }

    function getGrid() { return grid; }
    function getTracks() { return DRUM_TRACKS; }
    function getLabels() { return TRACK_LABELS; }

    function loadPattern(pat) {
        if (pat.bpm) bpm = pat.bpm;
        if (pat.steps) { steps = pat.steps; }
        DRUM_TRACKS.forEach(t => {
            grid[t] = pat.tracks && pat.tracks[t]
                ? pat.tracks[t].slice(0, steps)
                : new Array(steps).fill(0);
            while (grid[t].length < steps) grid[t].push(0);
        });
    }

    function clearGrid() {
        DRUM_TRACKS.forEach(t => grid[t] = new Array(steps).fill(0));
    }

    /* ====== SCHEDULING ====== */
    function play() {
        if (playing && !paused) return;
        engine.resume();
        if (paused) { paused = false; _schedule(); return; }
        playing = true;
        paused = false;
        curStep = -1;
        nextNoteTime = engine.getContext().currentTime;
        _schedule();
    }

    function pause() {
        if (!playing) return;
        paused = true;
        clearTimeout(timerID);
    }

    function stop() {
        playing = false;
        paused = false;
        curStep = -1;
        clearTimeout(timerID);
        if (onStep) onStep(-1);
    }

    function _schedule() {
        const c = engine.getContext();
        while (nextNoteTime < c.currentTime + scheduleAheadTime) {
            curStep = (curStep + 1) % steps;
            _triggerStep(curStep, nextNoteTime);
            if (onStep) onStep(curStep);

            const secPerBeat = 60.0 / bpm;
            let stepDur = secPerBeat / 4;
            // Swing on even-numbered eighth notes (steps 1, 3, 5 …)
            if (swing > 0 && curStep % 2 === 1) {
                stepDur *= 1 + (swing / 100) * 0.3;
            }
            nextNoteTime += stepDur;
        }
        timerID = setTimeout(_schedule, lookAhead);
    }

    function _triggerStep(step, time) {
        const c = engine.getContext();
        const dest = engine.getDestination();

        DRUM_TRACKS.forEach(t => {
            if (grid[t] && grid[t][step]) {
                inst.playDrum(c, dest, t, time);
            }
        });

        if (metronome) {
            const osc = c.createOscillator();
            const g = c.createGain();
            osc.frequency.value = step % 4 === 0 ? 1200 : 900;
            g.gain.setValueAtTime(0.08, time);
            g.gain.exponentialDecayToValueAtTime
                ? g.gain.exponentialDecayToValueAtTime(0.001, time + 0.05)
                : g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            osc.connect(g).connect(dest);
            osc.start(time);
            osc.stop(time + 0.06);
        }
    }

    /* Manually trigger a drum from pads */
    function triggerDrum(name) {
        engine.resume();
        inst.playDrum(engine.getContext(), engine.getDestination(), name, engine.getContext().currentTime);
    }

    /* Manually trigger a synth note from keys/touch */
    function triggerSynth(note, dur, vel, synthName) {
        engine.resume();
        const c = engine.getContext();
        inst.playSynth(c, engine.getDestination(), note, c.currentTime, dur || 0.4, vel || 0.6, synthName || 'piano');
    }

    function setOnStep(fn) { onStep = fn; }

    return {
        init, play, pause, stop, isPlaying, getCurrentStep,
        setBPM, getBPM, setSteps, getSteps, setSwing, setMetronome,
        toggleStep, getGrid, getTracks, getLabels,
        loadPattern, clearGrid,
        triggerDrum, triggerSynth,
        setOnStep
    };
})();
