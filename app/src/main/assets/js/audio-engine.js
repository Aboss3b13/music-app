/**
 * BeatForge Studio — Audio Engine
 * Web Audio API core: routing, effects, analysis
 */
window.BeatForge = window.BeatForge || {};

BeatForge.AudioEngine = (function () {
    let ctx = null;
    let masterGain, masterComp, masterLimiter, analyser, waveAnalyser;
    let reverbNode, reverbGain, delayNode, delayFB, delayGain, distNode, filterNode;
    let recordDest = null;   // MediaStreamDestination for live recording

    function init() {
        ctx = new (window.AudioContext || window.webkitAudioContext)();

        masterGain = ctx.createGain();
        masterGain.gain.value = 0.8;

        masterComp = ctx.createDynamicsCompressor();
        masterComp.threshold.value = -6; masterComp.knee.value = 10;
        masterComp.ratio.value = 4; masterComp.attack.value = 0.003; masterComp.release.value = 0.25;

        masterLimiter = ctx.createDynamicsCompressor();
        masterLimiter.threshold.value = -1; masterLimiter.knee.value = 0;
        masterLimiter.ratio.value = 20; masterLimiter.attack.value = 0.001; masterLimiter.release.value = 0.1;

        analyser = ctx.createAnalyser();
        analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.8;
        waveAnalyser = ctx.createAnalyser();
        waveAnalyser.fftSize = 2048; waveAnalyser.smoothingTimeConstant = 0.85;

        filterNode = ctx.createBiquadFilter();
        filterNode.type = 'lowpass'; filterNode.frequency.value = 20000; filterNode.Q.value = 0;

        // Reverb
        reverbGain = ctx.createGain(); reverbGain.gain.value = 0.2;
        reverbNode = ctx.createConvolver();
        _buildReverb(2.5, 2.0);

        // Delay
        delayNode = ctx.createDelay(2.0); delayNode.delayTime.value = 0.375;
        delayFB = ctx.createGain(); delayFB.gain.value = 0.35;
        delayGain = ctx.createGain(); delayGain.gain.value = 0;

        // Distortion
        distNode = ctx.createWaveShaper();
        distNode.curve = _distCurve(0); distNode.oversample = '4x';

        // Routing
        filterNode.connect(masterComp);
        filterNode.connect(reverbNode); reverbNode.connect(reverbGain); reverbGain.connect(masterComp);
        filterNode.connect(delayNode); delayNode.connect(delayFB); delayFB.connect(delayNode);
        delayNode.connect(delayGain); delayGain.connect(masterComp);

        masterComp.connect(masterLimiter);
        masterLimiter.connect(masterGain);
        masterGain.connect(analyser);
        analyser.connect(waveAnalyser);
        waveAnalyser.connect(ctx.destination);

        // Recording destination
        if (ctx.createMediaStreamDestination) {
            recordDest = ctx.createMediaStreamDestination();
            masterGain.connect(recordDest);
        }

        return ctx;
    }

    function _buildReverb(dur, decay) {
        const rate = ctx.sampleRate, len = rate * dur;
        const buf = ctx.createBuffer(2, len, rate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
            }
        }
        reverbNode.buffer = buf;
    }

    function _distCurve(amount) {
        const n = 44100, c = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            c[i] = amount === 0 ? x : ((3 + amount) * x * 20 * Math.PI / 180) / (Math.PI + amount * Math.abs(x));
        }
        return c;
    }

    function getContext()        { return ctx; }
    function getDestination()    { return filterNode; }
    function getAnalyser()       { return analyser; }
    function getWaveAnalyser()   { return waveAnalyser; }
    function getRecordStream()   { return recordDest ? recordDest.stream : null; }

    function setMasterVolume(v)  { masterGain && masterGain.gain.setTargetAtTime(v / 100, ctx.currentTime, 0.01); }
    function setReverb(v)        { reverbGain && reverbGain.gain.setTargetAtTime(v / 100, ctx.currentTime, 0.02); }
    function setDelay(v)         { delayGain && delayGain.gain.setTargetAtTime(v / 100 * 0.6, ctx.currentTime, 0.02); }
    function setDistortion(v)    { distNode && (distNode.curve = _distCurve(v * 4)); }
    function setFilter(f, q)     { filterNode && filterNode.frequency.setTargetAtTime(f, ctx.currentTime, 0.02); if (q !== undefined) filterNode.Q.setTargetAtTime(q, ctx.currentTime, 0.02); }
    function setDelayTime(bpm)   { delayNode && delayNode.delayTime.setTargetAtTime(60 / bpm / 2, ctx.currentTime, 0.02); }

    function createTrackChannel() {
        const g = ctx.createGain(), p = ctx.createStereoPanner();
        g.connect(p); p.connect(filterNode);
        return { gain: g, panner: p };
    }

    function resume() {
        return ctx && ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
    }

    return {
        init, getContext, getDestination, getAnalyser, getWaveAnalyser, getRecordStream,
        setMasterVolume, setReverb, setDelay, setDistortion, setFilter, setDelayTime,
        createTrackChannel, resume
    };
})();
