/**
 * BeatForge Studio - Audio Engine
 * Core Web Audio API setup, routing, and effects processing
 */

window.BeatForge = window.BeatForge || {};

BeatForge.AudioEngine = (function () {
    let ctx = null;
    let masterGain = null;
    let masterCompressor = null;
    let masterLimiter = null;
    let analyserNode = null;
    let waveformAnalyser = null;

    // Effects nodes
    let reverbNode = null;
    let reverbGain = null;
    let delayNode = null;
    let delayFeedback = null;
    let delayGain = null;
    let distortionNode = null;
    let distortionGain = null;
    let filterNode = null;

    // Convolver buffer for reverb
    let reverbBuffer = null;

    function init() {
        ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Master chain: source → filter → distortion mix → delay mix → reverb mix → compressor → limiter → gain → destination
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.8;

        masterCompressor = ctx.createDynamicsCompressor();
        masterCompressor.threshold.value = -6;
        masterCompressor.knee.value = 10;
        masterCompressor.ratio.value = 4;
        masterCompressor.attack.value = 0.003;
        masterCompressor.release.value = 0.25;

        masterLimiter = ctx.createDynamicsCompressor();
        masterLimiter.threshold.value = -1;
        masterLimiter.knee.value = 0;
        masterLimiter.ratio.value = 20;
        masterLimiter.attack.value = 0.001;
        masterLimiter.release.value = 0.1;

        // Analyzers
        analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;

        waveformAnalyser = ctx.createAnalyser();
        waveformAnalyser.fftSize = 2048;
        waveformAnalyser.smoothingTimeConstant = 0.85;

        // Filter
        filterNode = ctx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 20000;
        filterNode.Q.value = 0;

        // Reverb
        reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.2;
        reverbNode = ctx.createConvolver();
        createReverbImpulse(2.5, 2.0);

        // Delay
        delayNode = ctx.createDelay(2.0);
        delayNode.delayTime.value = 0.375; // dotted eighth at 120bpm
        delayFeedback = ctx.createGain();
        delayFeedback.gain.value = 0.35;
        delayGain = ctx.createGain();
        delayGain.gain.value = 0;

        // Distortion
        distortionNode = ctx.createWaveShaper();
        distortionNode.curve = makeDistortionCurve(0);
        distortionNode.oversample = '4x';
        distortionGain = ctx.createGain();
        distortionGain.gain.value = 0;

        // Dry path
        let dryGain = ctx.createGain();
        dryGain.gain.value = 1;

        // ROUTING
        // Main bus → filter
        filterNode.connect(masterCompressor);

        // Reverb send
        filterNode.connect(reverbNode);
        reverbNode.connect(reverbGain);
        reverbGain.connect(masterCompressor);

        // Delay send (with feedback loop)
        filterNode.connect(delayNode);
        delayNode.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayNode.connect(delayGain);
        delayGain.connect(masterCompressor);

        // Compressor → Limiter → Gain → Analyzers → Output
        masterCompressor.connect(masterLimiter);
        masterLimiter.connect(masterGain);
        masterGain.connect(analyserNode);
        analyserNode.connect(waveformAnalyser);
        waveformAnalyser.connect(ctx.destination);

        return ctx;
    }

    function createReverbImpulse(duration, decay) {
        const rate = ctx.sampleRate;
        const length = rate * duration;
        const impulse = ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const t = i / rate;
            const env = Math.pow(1 - t / duration, decay);
            left[i] = (Math.random() * 2 - 1) * env;
            right[i] = (Math.random() * 2 - 1) * env;
        }

        reverbNode.buffer = impulse;
    }

    function makeDistortionCurve(amount) {
        const k = amount;
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            if (k === 0) {
                curve[i] = x;
            } else {
                curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
            }
        }
        return curve;
    }

    function getContext() { return ctx; }
    function getMasterGain() { return masterGain; }
    function getFilterNode() { return filterNode; }
    function getDestination() { return filterNode; } // All sounds connect here
    function getAnalyser() { return analyserNode; }
    function getWaveformAnalyser() { return waveformAnalyser; }

    function setMasterVolume(value) {
        // value: 0-100
        if (masterGain) {
            masterGain.gain.setTargetAtTime(value / 100, ctx.currentTime, 0.01);
        }
    }

    function setReverb(value) {
        // value: 0-100
        if (reverbGain) {
            reverbGain.gain.setTargetAtTime(value / 100, ctx.currentTime, 0.02);
        }
    }

    function setDelay(value) {
        // value: 0-100
        if (delayGain) {
            delayGain.gain.setTargetAtTime(value / 100 * 0.6, ctx.currentTime, 0.02);
        }
    }

    function setDistortion(value) {
        // value: 0-100
        if (distortionNode) {
            distortionNode.curve = makeDistortionCurve(value * 4);
        }
        if (distortionGain) {
            distortionGain.gain.setTargetAtTime(value / 100, ctx.currentTime, 0.02);
        }
    }

    function setFilter(freq, resonance) {
        if (filterNode) {
            filterNode.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02);
            if (resonance !== undefined) {
                filterNode.Q.setTargetAtTime(resonance, ctx.currentTime, 0.02);
            }
        }
    }

    function setDelayTime(bpm) {
        if (delayNode) {
            // Sync delay to 1/8 note
            const eighthNote = 60 / bpm / 2;
            delayNode.delayTime.setTargetAtTime(eighthNote, ctx.currentTime, 0.02);
        }
    }

    // Create a track gain node
    function createTrackChannel() {
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner();
        gain.connect(panner);
        panner.connect(filterNode);
        return { gain, panner };
    }

    // Resume context (needed for mobile)
    function resume() {
        if (ctx && ctx.state === 'suspended') {
            return ctx.resume();
        }
        return Promise.resolve();
    }

    return {
        init,
        getContext,
        getMasterGain,
        getFilterNode,
        getDestination,
        getAnalyser,
        getWaveformAnalyser,
        setMasterVolume,
        setReverb,
        setDelay,
        setDistortion,
        setFilter,
        setDelayTime,
        createTrackChannel,
        resume,
    };
})();
