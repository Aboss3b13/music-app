/**
 * BeatForge Studio - Sequencer
 * Step sequencer engine with precise Web Audio scheduling
 */

window.BeatForge = window.BeatForge || {};

BeatForge.Sequencer = (function () {
    const engine = BeatForge.AudioEngine;
    const instruments = BeatForge.Instruments;

    let bpm = 120;
    let stepsPerBar = 16;
    let isPlaying = false;
    let currentStep = 0;
    let swing = 0; // 0-100

    let metronomeEnabled = false;
    let loopEnabled = true;

    // Scheduling
    let nextStepTime = 0;
    let scheduleAheadTime = 0.1; // seconds
    let lookAhead = 25; // ms
    let timerID = null;

    // Pattern data: { trackId: [0,0,1,0,...] }
    let pattern = {};
    let trackVolumes = {};   // trackId → 0-1
    let trackMutes = {};     // trackId → boolean
    let trackSolos = {};     // trackId → boolean
    let trackChannels = {};  // trackId → { gain, panner }

    // Callbacks
    let onStepCallback = null;
    let onStopCallback = null;

    function init() {
        // Initialize pattern with default tracks
        instruments.DEFAULT_TRACKS.forEach(track => {
            pattern[track.id] = new Array(stepsPerBar).fill(0);
            trackVolumes[track.id] = 0.8;
            trackMutes[track.id] = false;
            trackSolos[track.id] = false;
            trackChannels[track.id] = engine.createTrackChannel();
        });
    }

    function setSteps(steps) {
        stepsPerBar = steps;
        // Resize all patterns
        Object.keys(pattern).forEach(trackId => {
            const old = pattern[trackId];
            pattern[trackId] = new Array(steps).fill(0);
            for (let i = 0; i < Math.min(old.length, steps); i++) {
                pattern[trackId][i] = old[i];
            }
        });
    }

    function setBPM(newBPM) {
        bpm = Math.max(40, Math.min(300, newBPM));
        engine.setDelayTime(bpm);
    }

    function getBPM() { return bpm; }
    function getSteps() { return stepsPerBar; }
    function getCurrentStep() { return currentStep; }
    function getIsPlaying() { return isPlaying; }

    function setSwing(value) { swing = value; }
    function setMetronome(enabled) { metronomeEnabled = enabled; }
    function setLoop(enabled) { loopEnabled = enabled; }
    function getLoop() { return loopEnabled; }
    function getMetronome() { return metronomeEnabled; }

    function toggleStep(trackId, step) {
        if (!pattern[trackId]) return;
        pattern[trackId][step] = pattern[trackId][step] ? 0 : 1;
        return pattern[trackId][step];
    }

    function setStep(trackId, step, value) {
        if (!pattern[trackId]) return;
        pattern[trackId][step] = value;
    }

    function getStep(trackId, step) {
        return pattern[trackId] ? pattern[trackId][step] : 0;
    }

    function getPattern() { return pattern; }

    function setPattern(newPattern) {
        Object.keys(newPattern).forEach(trackId => {
            if (pattern[trackId] !== undefined) {
                pattern[trackId] = newPattern[trackId].slice();
            }
        });
    }

    function clearPattern() {
        Object.keys(pattern).forEach(trackId => {
            pattern[trackId] = new Array(stepsPerBar).fill(0);
        });
    }

    function setTrackVolume(trackId, vol) {
        trackVolumes[trackId] = vol;
        if (trackChannels[trackId]) {
            trackChannels[trackId].gain.gain.setTargetAtTime(
                vol, engine.getContext().currentTime, 0.01
            );
        }
    }

    function setTrackMute(trackId, muted) {
        trackMutes[trackId] = muted;
        _updateTrackAudibility(trackId);
    }

    function setTrackSolo(trackId, solo) {
        trackSolos[trackId] = solo;
        // Update all tracks
        Object.keys(trackChannels).forEach(id => _updateTrackAudibility(id));
    }

    function _updateTrackAudibility(trackId) {
        const hasSolo = Object.values(trackSolos).some(s => s);
        const ctx = engine.getContext();
        const ch = trackChannels[trackId];
        if (!ch) return;

        let audible = true;
        if (trackMutes[trackId]) audible = false;
        if (hasSolo && !trackSolos[trackId]) audible = false;

        const targetVol = audible ? trackVolumes[trackId] : 0;
        ch.gain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.01);
    }

    function setTrackPan(trackId, pan) {
        if (trackChannels[trackId]) {
            trackChannels[trackId].panner.pan.setTargetAtTime(
                pan, engine.getContext().currentTime, 0.01
            );
        }
    }

    function onStep(callback) { onStepCallback = callback; }
    function onStop(callback) { onStopCallback = callback; }

    function play() {
        if (isPlaying) return;
        const ctx = engine.getContext();
        engine.resume();
        isPlaying = true;
        currentStep = 0;
        nextStepTime = ctx.currentTime + 0.05;
        _scheduler();
    }

    function stop() {
        isPlaying = false;
        currentStep = 0;
        if (timerID) {
            clearTimeout(timerID);
            timerID = null;
        }
        if (onStopCallback) onStopCallback();
    }

    function pause() {
        isPlaying = false;
        if (timerID) {
            clearTimeout(timerID);
            timerID = null;
        }
    }

    function _scheduler() {
        if (!isPlaying) return;
        const ctx = engine.getContext();

        while (nextStepTime < ctx.currentTime + scheduleAheadTime) {
            _scheduleStep(currentStep, nextStepTime);
            _advanceStep();
        }

        timerID = setTimeout(_scheduler, lookAhead);
    }

    function _scheduleStep(step, time) {
        const ctx = engine.getContext();

        // Apply swing to odd steps
        let actualTime = time;
        if (step % 2 === 1 && swing > 0) {
            const stepDuration = 60 / bpm / 4;
            actualTime += stepDuration * (swing / 100) * 0.5;
        }

        // Notify UI
        if (onStepCallback) {
            const delay = Math.max(0, (actualTime - ctx.currentTime) * 1000);
            setTimeout(() => {
                if (isPlaying) onStepCallback(step);
            }, delay);
        }

        // Metronome
        if (metronomeEnabled) {
            const isDownbeat = step % 4 === 0;
            instruments.playMetronome(ctx, engine.getDestination(), actualTime, isDownbeat);
        }

        // Play active steps
        const tracks = instruments.DEFAULT_TRACKS;
        const hasSolo = Object.values(trackSolos).some(s => s);

        tracks.forEach(track => {
            if (!pattern[track.id] || !pattern[track.id][step]) return;
            if (trackMutes[track.id]) return;
            if (hasSolo && !trackSolos[track.id]) return;

            const ch = trackChannels[track.id];
            if (!ch) return;
            const dest = ch.gain;

            if (track.type === 'drum') {
                instruments.playDrum(ctx, dest, track.instrument, actualTime, 0.8);
            } else {
                // Synth track - play the assigned note
                const stepDuration = 60 / bpm / 4;
                const noteDuration = stepDuration * 0.9;
                instruments.playSynth(
                    ctx, dest, track.note, actualTime,
                    noteDuration, 0.7, track.instrument
                );
            }
        });
    }

    function _advanceStep() {
        const stepDuration = 60 / bpm / 4; // 16th note duration
        nextStepTime += stepDuration;
        currentStep++;

        if (currentStep >= stepsPerBar) {
            if (loopEnabled) {
                currentStep = 0;
            } else {
                stop();
            }
        }
    }

    // Play a single sound immediately (for pad/key triggering)
    function triggerDrum(instrument, velocity) {
        const ctx = engine.getContext();
        engine.resume();
        instruments.playDrum(ctx, engine.getDestination(), instrument, ctx.currentTime, velocity || 0.8);
    }

    function triggerSynth(instrumentType, note, duration, velocity) {
        const ctx = engine.getContext();
        engine.resume();
        instruments.playSynth(
            ctx, engine.getDestination(), note, ctx.currentTime,
            duration || 0.5, velocity || 0.7, instrumentType
        );
    }

    return {
        init,
        setBPM,
        getBPM,
        setSteps,
        getSteps,
        getCurrentStep,
        getIsPlaying,
        setSwing,
        setMetronome,
        getMetronome,
        setLoop,
        getLoop,
        toggleStep,
        setStep,
        getStep,
        getPattern,
        setPattern,
        clearPattern,
        setTrackVolume,
        setTrackMute,
        setTrackSolo,
        setTrackPan,
        play,
        stop,
        pause,
        onStep,
        onStop,
        triggerDrum,
        triggerSynth,
    };
})();
