/**
 * BeatForge Studio — Instruments
 * All synthesized instruments: drums, synths, world, 808
 */
window.BeatForge = window.BeatForge || {};

BeatForge.Instruments = (function () {
    const NOTES = {};
    const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    for (let o = 0; o <= 8; o++) for (let i = 0; i < 12; i++) {
        NOTES[NAMES[i] + o] = 440 * Math.pow(2, (o * 12 + i - 57) / 12);
    }
    function freq(n) { return NOTES[n] || 440; }
    function midi2freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    /* ====== DRUMS ====== */
    function kick(c, d, t, v = .9) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(35, t + .08);
        g.gain.setValueAtTime(v * 1.2, t); g.gain.exponentialRampToValueAtTime(.001, t + .4);
        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.type = 'sine'; o2.frequency.setValueAtTime(80, t); o2.frequency.exponentialRampToValueAtTime(30, t + .1);
        g2.gain.setValueAtTime(v * .8, t); g2.gain.exponentialRampToValueAtTime(.001, t + .5);
        const cl = c.createOscillator(), cg = c.createGain();
        cl.type = 'square'; cl.frequency.setValueAtTime(800, t); cl.frequency.exponentialRampToValueAtTime(100, t + .02);
        cg.gain.setValueAtTime(v * .3, t); cg.gain.exponentialRampToValueAtTime(.001, t + .02);
        o.connect(g).connect(d); o2.connect(g2).connect(d); cl.connect(cg).connect(d);
        o.start(t); o.stop(t + .5); o2.start(t); o2.stop(t + .6); cl.start(t); cl.stop(t + .03);
    }

    function snare(c, d, t, v = .8) {
        const buf = c.createBuffer(1, c.sampleRate * .2, c.sampleRate);
        const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
        const n = c.createBufferSource(); n.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1000;
        const ng = c.createGain(); ng.gain.setValueAtTime(v * .7, t); ng.gain.exponentialRampToValueAtTime(.001, t + .18);
        n.connect(f).connect(ng).connect(d);
        const o = c.createOscillator(), og = c.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(120, t + .03);
        og.gain.setValueAtTime(v * .6, t); og.gain.exponentialRampToValueAtTime(.001, t + .1);
        o.connect(og).connect(d);
        n.start(t); n.stop(t + .2); o.start(t); o.stop(t + .12);
    }

    function hihat(c, d, t, v = .6) {
        const buf = c.createBuffer(1, c.sampleRate * .05, c.sampleRate);
        const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
        const n = c.createBufferSource(); n.buffer = buf;
        const f1 = c.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = 7000;
        const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 10000; f2.Q.value = 1;
        const g = c.createGain(); g.gain.setValueAtTime(v * .4, t); g.gain.exponentialRampToValueAtTime(.001, t + .05);
        n.connect(f1).connect(f2).connect(g).connect(d); n.start(t); n.stop(t + .06);
    }

    function ohihat(c, d, t, v = .6) {
        const buf = c.createBuffer(1, c.sampleRate * .4, c.sampleRate);
        const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
        const n = c.createBufferSource(); n.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
        const g = c.createGain(); g.gain.setValueAtTime(v * .45, t); g.gain.exponentialRampToValueAtTime(.001, t + .35);
        n.connect(f).connect(g).connect(d); n.start(t); n.stop(t + .4);
    }

    function clap(c, d, t, v = .7) {
        for (let j = 0; j < 3; j++) {
            const buf = c.createBuffer(1, c.sampleRate * .02, c.sampleRate);
            const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
            const n = c.createBufferSource(); n.buffer = buf;
            const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2500; f.Q.value = 3;
            const g = c.createGain(); const off = j * .01;
            g.gain.setValueAtTime(0, t + off); g.gain.linearRampToValueAtTime(v * .5, t + off + .001);
            g.gain.exponentialRampToValueAtTime(.001, t + off + .08);
            n.connect(f).connect(g).connect(d); n.start(t + off); n.stop(t + off + .1);
        }
        const buf2 = c.createBuffer(1, c.sampleRate * .15, c.sampleRate);
        const bd2 = buf2.getChannelData(0); for (let i = 0; i < bd2.length; i++) bd2[i] = Math.random() * 2 - 1;
        const n2 = c.createBufferSource(); n2.buffer = buf2;
        const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 2500; f2.Q.value = 2;
        const g2 = c.createGain(); g2.gain.setValueAtTime(v * .35, t + .03); g2.gain.exponentialRampToValueAtTime(.001, t + .15);
        n2.connect(f2).connect(g2).connect(d); n2.start(t + .03); n2.stop(t + .16);
    }

    function tom(c, d, t, v = .7, p = 1) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(100 * p * 2, t); o.frequency.exponentialRampToValueAtTime(100 * p, t + .06);
        g.gain.setValueAtTime(v * .8, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
        o.connect(g).connect(d); o.start(t); o.stop(t + .35);
    }

    function crash(c, d, t, v = .6) {
        const buf = c.createBuffer(2, c.sampleRate * 1.5, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const dd = buf.getChannelData(ch); for (let i = 0; i < dd.length; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / dd.length, 1.5); }
        const n = c.createBufferSource(); n.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4000;
        const g = c.createGain(); g.gain.setValueAtTime(v * .4, t); g.gain.exponentialRampToValueAtTime(.001, t + 1.2);
        n.connect(f).connect(g).connect(d); n.start(t); n.stop(t + 1.5);
    }

    function ride(c, d, t, v = .5) {
        const buf = c.createBuffer(1, c.sampleRate * .6, c.sampleRate);
        const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
        const n = c.createBufferSource(); n.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 8000; f.Q.value = 2;
        const g = c.createGain(); g.gain.setValueAtTime(v * .3, t); g.gain.exponentialRampToValueAtTime(.001, t + .5);
        n.connect(f).connect(g).connect(d); n.start(t); n.stop(t + .6);
    }

    function rim(c, d, t, v = .7) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'square'; o.frequency.value = 800;
        g.gain.setValueAtTime(v * .3, t); g.gain.exponentialRampToValueAtTime(.001, t + .02);
        o.connect(g).connect(d); o.start(t); o.stop(t + .03);
    }

    function perc(c, d, t, v = .6) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(1200, t); o.frequency.exponentialRampToValueAtTime(400, t + .03);
        g.gain.setValueAtTime(v * .4, t); g.gain.exponentialRampToValueAtTime(.001, t + .08);
        o.connect(g).connect(d); o.start(t); o.stop(t + .1);
    }

    function shaker(c, d, t, v = .4) {
        const buf = c.createBuffer(1, c.sampleRate * .06, c.sampleRate);
        const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
        const n = c.createBufferSource(); n.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 12000; f.Q.value = 5;
        const g = c.createGain(); g.gain.setValueAtTime(v * .25, t); g.gain.exponentialRampToValueAtTime(.001, t + .04);
        n.connect(f).connect(g).connect(d); n.start(t); n.stop(t + .06);
    }

    function cowbell(c, d, t, v = .5) {
        const o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
        o1.type = 'square'; o1.frequency.value = 587; o2.type = 'square'; o2.frequency.value = 845;
        g.gain.setValueAtTime(v * .3, t); g.gain.exponentialRampToValueAtTime(.001, t + .15);
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 3;
        o1.connect(f); o2.connect(f); f.connect(g).connect(d);
        o1.start(t); o1.stop(t + .16); o2.start(t); o2.stop(t + .16);
    }

    /* ====== 808 DRUMS ====== */
    function kick808(c, d, t, v = .9) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(30, t + .15);
        g.gain.setValueAtTime(v * 1.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .8);
        const dist = c.createWaveShaper(); dist.curve = _softClip(); dist.oversample = '2x';
        o.connect(dist).connect(g).connect(d); o.start(t); o.stop(t + .9);
    }

    function snare808(c, d, t, v = .8) {
        const o = c.createOscillator(), og = c.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(80, t + .05);
        og.gain.setValueAtTime(v * .7, t); og.gain.exponentialRampToValueAtTime(.001, t + .15);
        o.connect(og).connect(d); o.start(t); o.stop(t + .18);
        const buf = c.createBuffer(1, c.sampleRate * .25, c.sampleRate);
        const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
        const n = c.createBufferSource(); n.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2000;
        const ng = c.createGain(); ng.gain.setValueAtTime(v * .6, t); ng.gain.exponentialRampToValueAtTime(.001, t + .22);
        n.connect(f).connect(ng).connect(d); n.start(t); n.stop(t + .25);
    }

    function hat808(c, d, t, v = .5) {
        // 6 square oscillators at metallic frequencies
        const freqs = [204, 298, 367, 533, 680, 812];
        const master = c.createGain();
        master.gain.setValueAtTime(v * .3, t); master.gain.exponentialRampToValueAtTime(.001, t + .06);
        const bp = c.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 8000;
        bp.connect(master).connect(d);
        freqs.forEach(fr => {
            const o = c.createOscillator(); o.type = 'square'; o.frequency.value = fr;
            const g = c.createGain(); g.gain.value = .08;
            o.connect(g).connect(bp); o.start(t); o.stop(t + .08);
        });
    }

    function clap808(c, d, t, v = .7) {
        // Multiple filtered noise bursts
        for (let j = 0; j < 4; j++) {
            const buf = c.createBuffer(1, c.sampleRate * .015, c.sampleRate);
            const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
            const n = c.createBufferSource(); n.buffer = buf;
            const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2;
            const g = c.createGain(); const off = j * .012;
            g.gain.setValueAtTime(v * .5, t + off); g.gain.exponentialRampToValueAtTime(.001, t + off + .04);
            n.connect(f).connect(g).connect(d); n.start(t + off); n.stop(t + off + .05);
        }
    }

    function _softClip() {
        const n = 256, c = new Float32Array(n);
        for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = Math.tanh(x * 2); }
        return c;
    }

    /* ====== WORLD PERCUSSION ====== */
    function conga(c, d, t, v = .7) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(200, t + .05);
        g.gain.setValueAtTime(v * .7, t); g.gain.exponentialRampToValueAtTime(.001, t + .25);
        o.connect(g).connect(d); o.start(t); o.stop(t + .3);
    }

    function bongo(c, d, t, v = .7) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(280, t + .03);
        g.gain.setValueAtTime(v * .6, t); g.gain.exponentialRampToValueAtTime(.001, t + .12);
        o.connect(g).connect(d); o.start(t); o.stop(t + .15);
    }

    function djembe(c, d, t, v = .8) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(250, t); o.frequency.exponentialRampToValueAtTime(80, t + .1);
        g.gain.setValueAtTime(v * .9, t); g.gain.exponentialRampToValueAtTime(.001, t + .4);
        // Slap component
        const buf = c.createBuffer(1, c.sampleRate * .03, c.sampleRate);
        const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
        const n = c.createBufferSource(); n.buffer = buf;
        const ng = c.createGain(); ng.gain.setValueAtTime(v * .3, t); ng.gain.exponentialRampToValueAtTime(.001, t + .03);
        o.connect(g).connect(d); n.connect(ng).connect(d);
        o.start(t); o.stop(t + .5); n.start(t); n.stop(t + .04);
    }

    function tabla(c, d, t, v = .7) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(400, t);
        o.frequency.setValueAtTime(350, t + .01); o.frequency.exponentialRampToValueAtTime(200, t + .15);
        g.gain.setValueAtTime(v * .6, t); g.gain.exponentialRampToValueAtTime(.001, t + .35);
        o.connect(g).connect(d); o.start(t); o.stop(t + .4);
    }

    function steelDrum(c, d, t, v = .6) {
        const master = c.createGain();
        master.gain.setValueAtTime(0, t); master.gain.linearRampToValueAtTime(v * .5, t + .002);
        master.gain.exponentialRampToValueAtTime(.001, t + .6);
        [1, 2, 3, 4.16].forEach((h, i) => {
            const o = c.createOscillator(), g = c.createGain();
            o.type = 'sine'; o.frequency.value = 440 * h;
            g.gain.setValueAtTime(.15 / (i + 1), t); g.gain.exponentialRampToValueAtTime(.001, t + .4 / (i + 1));
            o.connect(g).connect(master); o.start(t); o.stop(t + .7);
        });
        master.connect(d);
    }

    function guiro(c, d, t, v = .5) {
        for (let j = 0; j < 8; j++) {
            const buf = c.createBuffer(1, c.sampleRate * .01, c.sampleRate);
            const bd = buf.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
            const n = c.createBufferSource(); n.buffer = buf;
            const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 5000 + j * 300; f.Q.value = 8;
            const g = c.createGain(); const off = j * .015;
            g.gain.setValueAtTime(v * .2, t + off); g.gain.exponentialRampToValueAtTime(.001, t + off + .015);
            n.connect(f).connect(g).connect(d); n.start(t + off); n.stop(t + off + .02);
        }
    }

    /* ====== SYNTH INSTRUMENTS ====== */
    function synth(c, d, note, t, dur, v, type) {
        const f = typeof note === 'string' ? freq(note) : midi2freq(note);
        const fns = { piano: _piano, epiano: _epiano, bass: _bass, lead: _lead, pad: _pad,
            strings: _strings, pluck: _pluck, nebula: _nebula, organ: _organ, marimba: _marimba, acid: _acid };
        (fns[type] || _piano)(c, d, f, t, dur || .3, v || .6);
    }

    function _piano(c, d, f, t, dur, v) {
        const m = c.createGain();
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .5, t + .005);
        m.gain.setTargetAtTime(v * .3, t + .005, .1); m.gain.setTargetAtTime(.001, t + dur * .7, dur * .3);
        [[f, .6, 'triangle'], [f * 2, .2, 'sine'], [f * 3, .05, 'sine']].forEach(([fr, vol, tp]) => {
            const o = c.createOscillator(), g = c.createGain();
            o.type = tp; o.frequency.value = fr; g.gain.value = vol;
            o.connect(g).connect(m); o.start(t); o.stop(t + dur + .5);
        });
        m.connect(d);
    }

    function _epiano(c, d, f, t, dur, v) {
        const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), m = c.createGain();
        car.type = 'sine'; car.frequency.value = f;
        mod.type = 'sine'; mod.frequency.value = f * 7;
        mg.gain.setValueAtTime(f * 4, t); mg.gain.exponentialRampToValueAtTime(f * .5, t + dur * .5);
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .4, t + .003);
        m.gain.setTargetAtTime(v * .2, t + .003, .15); m.gain.setTargetAtTime(.001, t + dur * .5, dur * .3);
        mod.connect(mg); mg.connect(car.frequency); car.connect(m).connect(d);
        car.start(t); car.stop(t + dur + .5); mod.start(t); mod.stop(t + dur + .5);
    }

    function _bass(c, d, f, t, dur, v) {
        const m = c.createGain(), fl = c.createBiquadFilter();
        fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 8, t); fl.frequency.exponentialRampToValueAtTime(f * 2, t + .1); fl.Q.value = 5;
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .7, t + .01);
        m.gain.setTargetAtTime(v * .5, t + .01, .05); m.gain.setTargetAtTime(.001, t + dur * .8, .1);
        const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = f;
        const o2 = c.createOscillator(), sg = c.createGain(); o2.type = 'sine'; o2.frequency.value = f / 2; sg.gain.value = .5;
        o1.connect(fl); o2.connect(sg).connect(fl); fl.connect(m).connect(d);
        o1.start(t); o1.stop(t + dur + .3); o2.start(t); o2.stop(t + dur + .3);
    }

    function _lead(c, d, f, t, dur, v) {
        const m = c.createGain(), fl = c.createBiquadFilter();
        fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 3, t); fl.frequency.setTargetAtTime(f * 6, t, dur * .3); fl.Q.value = 3;
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .4, t + .01);
        m.gain.setTargetAtTime(v * .3, t + .01, .05); m.gain.setTargetAtTime(.001, t + dur * .8, .1);
        const o1 = c.createOscillator(), o2 = c.createOscillator();
        o1.type = 'sawtooth'; o1.frequency.value = f; o1.detune.value = -12;
        o2.type = 'sawtooth'; o2.frequency.value = f; o2.detune.value = 12;
        const g1 = c.createGain(), g2 = c.createGain(); g1.gain.value = .35; g2.gain.value = .35;
        o1.connect(g1).connect(fl); o2.connect(g2).connect(fl);
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 5; lg.gain.value = 3;
        lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
        fl.connect(m).connect(d);
        const end = t + dur + .2;
        o1.start(t); o1.stop(end); o2.start(t); o2.stop(end); lfo.start(t); lfo.stop(end);
    }

    function _pad(c, d, f, t, dur, v) {
        const m = c.createGain(), fl = c.createBiquadFilter();
        fl.type = 'lowpass'; fl.frequency.value = f * 4; fl.Q.value = 1;
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .25, t + dur * .3);
        m.gain.setTargetAtTime(v * .2, t + dur * .3, .2); m.gain.setTargetAtTime(.001, t + dur * .7, dur * .3);
        [-15, -7, 0, 7, 15].forEach(dt => {
            const o = c.createOscillator(), g = c.createGain();
            o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; g.gain.value = .12;
            o.connect(g).connect(fl); o.start(t); o.stop(t + dur + 1);
        });
        fl.connect(m).connect(d);
    }

    function _strings(c, d, f, t, dur, v) {
        const m = c.createGain(), fl = c.createBiquadFilter();
        fl.type = 'lowpass'; fl.frequency.value = f * 3; fl.Q.value = .5;
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .3, t + dur * .2);
        m.gain.setTargetAtTime(v * .25, t + dur * .2, .3); m.gain.setTargetAtTime(.001, t + dur * .6, dur * .4);
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 5.5; lg.gain.value = 2; lfo.connect(lg);
        [{d:-8,t:'sawtooth',v:.15},{d:5,t:'sawtooth',v:.15},{d:-3,t:'triangle',v:.1},{d:10,t:'sawtooth',v:.12}].forEach(cfg => {
            const o = c.createOscillator(), g = c.createGain();
            o.type = cfg.t; o.frequency.value = f; o.detune.value = cfg.d; lg.connect(o.frequency);
            g.gain.value = cfg.v; o.connect(g).connect(fl); o.start(t); o.stop(t + dur + .8);
        });
        fl.connect(m).connect(d); lfo.start(t); lfo.stop(t + dur + .8);
    }

    function _pluck(c, d, f, t, dur, v) {
        const m = c.createGain(), fl = c.createBiquadFilter();
        fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 12, t); fl.frequency.exponentialRampToValueAtTime(f * 1.5, t + .15); fl.Q.value = 2;
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .5, t + .003);
        m.gain.exponentialRampToValueAtTime(.001, t + Math.min(dur, .4));
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
        o.connect(fl).connect(m).connect(d); o.start(t); o.stop(t + dur + .1);
    }

    function _organ(c, d, f, t, dur, v) {
        const m = c.createGain();
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .35, t + .01);
        m.gain.setTargetAtTime(v * .3, t + .01, .02); m.gain.setTargetAtTime(.001, t + dur * .9, .05);
        // Drawbar harmonics
        [1, 2, 3, 4, 6, 8].forEach((h, i) => {
            const o = c.createOscillator(), g = c.createGain();
            o.type = 'sine'; o.frequency.value = f * h;
            g.gain.value = [.3, .2, .15, .1, .05, .03][i];
            o.connect(g).connect(m); o.start(t); o.stop(t + dur + .1);
        });
        // Leslie vibrato
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 6.5; lg.gain.value = 3;
        lfo.connect(lg);
        m.connect(d); lfo.start(t); lfo.stop(t + dur + .1);
    }

    function _marimba(c, d, f, t, dur, v) {
        const m = c.createGain();
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .6, t + .002);
        m.gain.exponentialRampToValueAtTime(.001, t + .6);
        // Fundamental + 4th harmonic (characteristic marimba overtone)
        const o1 = c.createOscillator(), o2 = c.createOscillator();
        o1.type = 'sine'; o1.frequency.value = f;
        o2.type = 'sine'; o2.frequency.value = f * 4;
        const g1 = c.createGain(), g2 = c.createGain();
        g1.gain.value = .5; g2.gain.setValueAtTime(.3, t); g2.gain.exponentialRampToValueAtTime(.01, t + .1);
        o1.connect(g1).connect(m); o2.connect(g2).connect(m);
        m.connect(d);
        o1.start(t); o1.stop(t + .7); o2.start(t); o2.stop(t + .2);
    }

    function _acid(c, d, f, t, dur, v) {
        const m = c.createGain(), fl = c.createBiquadFilter();
        fl.type = 'lowpass'; fl.Q.value = 15;
        fl.frequency.setValueAtTime(f * 1.5, t); fl.frequency.exponentialRampToValueAtTime(f * 10, t + .05);
        fl.frequency.exponentialRampToValueAtTime(f * 1.2, t + dur);
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .5, t + .005);
        m.gain.setTargetAtTime(v * .4, t + .005, .03); m.gain.setTargetAtTime(.001, t + dur * .8, .08);
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
        o.connect(fl).connect(m).connect(d);
        o.start(t); o.stop(t + dur + .1);
    }

    function _nebula(c, d, f, t, dur, v) {
        const m = c.createGain(), fl = c.createBiquadFilter();
        fl.type = 'lowpass'; fl.frequency.value = f * 5; fl.Q.value = 2;
        m.gain.setValueAtTime(0, t); m.gain.linearRampToValueAtTime(v * .2, t + dur * .25);
        m.gain.setTargetAtTime(v * .18, t + dur * .25, dur * .2); m.gain.setTargetAtTime(.001, t + dur * .6, dur * .5);
        const flfo = c.createOscillator(), flg = c.createGain();
        flfo.frequency.value = .3 + Math.random() * .5; flg.gain.value = f * 2;
        flfo.connect(flg).connect(fl.frequency);
        const waves = ['sine','triangle','sawtooth','sine','triangle','sine','sawtooth','sine'];
        const harms = [1, 1.001, 2, 2.997, 4, 5.01, .5, 1.5];
        const oscs = [];
        for (let i = 0; i < 8; i++) {
            const o = c.createOscillator(), og = c.createGain();
            o.type = waves[i]; o.frequency.value = f * harms[i]; o.detune.value = (Math.random() - .5) * 30;
            og.gain.value = (.04 + Math.random() * .03) * (i < 4 ? 1 : .5);
            const lfo = c.createOscillator(), lg = c.createGain();
            lfo.frequency.value = .1 + Math.random() * 2; lg.gain.value = f * harms[i] * (.003 + Math.random() * .01);
            lfo.connect(lg).connect(o.frequency);
            o.connect(og).connect(fl);
            oscs.push(o, lfo);
        }
        // Shimmer
        const sh = c.createOscillator(), sg = c.createGain();
        sh.type = 'sine'; sh.frequency.value = f * 8;
        sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(v * .02, t + dur * .4);
        sg.gain.setTargetAtTime(0, t + dur * .5, dur * .3);
        sh.connect(sg).connect(fl); oscs.push(sh);
        // Noise texture
        const nLen = Math.max(c.sampleRate * (dur + 1), 1);
        const nBuf = c.createBuffer(1, nLen, c.sampleRate);
        const nd = nBuf.getChannelData(0); for (let i = 0; i < nLen; i++) nd[i] = (Math.random() * 2 - 1) * .02;
        const ns = c.createBufferSource(); ns.buffer = nBuf;
        const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = f * 3; nf.Q.value = 10;
        const ng = c.createGain(); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(v * .04, t + dur * .3);
        ng.gain.setTargetAtTime(.001, t + dur * .6, dur * .3);
        ns.connect(nf).connect(ng).connect(fl);
        fl.connect(m).connect(d);
        const end = t + dur + 1.5;
        oscs.forEach(o => { o.start(t); o.stop(end); });
        flfo.start(t); flfo.stop(end); ns.start(t); ns.stop(end);
    }

    /* ====== METRONOME ====== */
    function metronome(c, d, t, accent) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = accent ? 1200 : 800;
        g.gain.setValueAtTime(accent ? .3 : .15, t); g.gain.exponentialRampToValueAtTime(.001, t + .03);
        o.connect(g).connect(d); o.start(t); o.stop(t + .04);
    }

    /* ====== REGISTRY ====== */
    const DRUMS = {
        kick: { name: 'Kick', play: kick, color: '#ef4444' },
        snare: { name: 'Snare', play: snare, color: '#f59e0b' },
        hihat: { name: 'Hi-Hat', play: hihat, color: '#10b981' },
        ohihat: { name: 'Open HH', play: ohihat, color: '#059669' },
        clap: { name: 'Clap', play: clap, color: '#a855f7' },
        tom_hi: { name: 'Tom Hi', play: (c,d,t,v) => tom(c,d,t,v,1.5), color: '#3b82f6' },
        tom_mid: { name: 'Tom Mid', play: (c,d,t,v) => tom(c,d,t,v,1.0), color: '#2563eb' },
        tom_lo: { name: 'Tom Lo', play: (c,d,t,v) => tom(c,d,t,v,.6), color: '#1d4ed8' },
        crash: { name: 'Crash', play: crash, color: '#f472b6' },
        ride: { name: 'Ride', play: ride, color: '#fb923c' },
        rim: { name: 'Rim', play: rim, color: '#94a3b8' },
        perc: { name: 'Perc', play: perc, color: '#06b6d4' },
        shaker: { name: 'Shaker', play: shaker, color: '#84cc16' },
        cowbell: { name: 'Cowbell', play: cowbell, color: '#eab308' },
    };

    const DRUMS_808 = {
        kick808: { name: '808 Kick', play: kick808, color: '#dc2626' },
        snare808: { name: '808 Snare', play: snare808, color: '#d97706' },
        hat808: { name: '808 Hat', play: hat808, color: '#059669' },
        clap808: { name: '808 Clap', play: clap808, color: '#7c3aed' },
    };

    const WORLD = {
        conga: { name: 'Conga', play: conga, color: '#b45309' },
        bongo: { name: 'Bongo', play: bongo, color: '#a16207' },
        djembe: { name: 'Djembe', play: djembe, color: '#92400e' },
        tabla: { name: 'Tabla', play: tabla, color: '#78350f' },
        steelDrum: { name: 'Steel Drum', play: steelDrum, color: '#0891b2' },
        guiro: { name: 'Guiro', play: guiro, color: '#4d7c0f' },
    };

    const SYNTHS = {
        piano: { name: 'Piano', color: '#e8eaf0' },
        epiano: { name: 'E-Piano', color: '#60a5fa' },
        bass: { name: 'Bass', color: '#ef4444' },
        lead: { name: 'Lead', color: '#f59e0b' },
        pad: { name: 'Pad', color: '#a855f7' },
        strings: { name: 'Strings', color: '#f472b6' },
        pluck: { name: 'Pluck', color: '#10b981' },
        organ: { name: 'Organ', color: '#fb923c' },
        marimba: { name: 'Marimba', color: '#eab308' },
        acid: { name: 'Acid 303', color: '#84cc16' },
        nebula: { name: 'Nebula', color: '#00f0ff' },
    };

    const DEFAULT_TRACKS = [
        { id:'kick', type:'drum', instrument:'kick', note:null },
        { id:'snare', type:'drum', instrument:'snare', note:null },
        { id:'hihat', type:'drum', instrument:'hihat', note:null },
        { id:'ohihat', type:'drum', instrument:'ohihat', note:null },
        { id:'clap', type:'drum', instrument:'clap', note:null },
        { id:'tom_hi', type:'drum', instrument:'tom_hi', note:null },
        { id:'crash', type:'drum', instrument:'crash', note:null },
        { id:'ride', type:'drum', instrument:'ride', note:null },
        { id:'rim', type:'drum', instrument:'rim', note:null },
        { id:'shaker', type:'drum', instrument:'shaker', note:null },
        { id:'perc', type:'drum', instrument:'perc', note:null },
        { id:'cowbell', type:'drum', instrument:'cowbell', note:null },
        { id:'bass', type:'synth', instrument:'bass', note:'C3' },
        { id:'lead', type:'synth', instrument:'lead', note:'C5' },
        { id:'pad', type:'synth', instrument:'pad', note:'C4' },
        { id:'nebula', type:'synth', instrument:'nebula', note:'C4' },
    ];

    const PAD_BANKS = {
        drums: ['kick','snare','hihat','ohihat','clap','tom_hi','tom_mid','tom_lo','crash','ride','rim','perc','shaker','cowbell','kick','snare'],
        bass: ['C2','D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4'],
        synth: ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6','D6'],
        nebula: ['C3','E3','G3','B3','C4','E4','G4','B4','C5','D5','E5','F#5','G5','A5','B5','C6'],
        '808': ['kick808','snare808','hat808','clap808','kick808','snare808','hat808','clap808','kick808','snare808','hat808','clap808','kick808','snare808','hat808','clap808'],
        world: ['conga','bongo','djembe','tabla','steelDrum','guiro','conga','bongo','djembe','tabla','steelDrum','guiro','conga','bongo','djembe','tabla'],
    };

    function playDrum(c, d, id, t, v) {
        const dr = DRUMS[id] || DRUMS_808[id] || WORLD[id];
        if (dr) dr.play(c, d, t, v);
    }

    return {
        NOTES, NAMES, freq, midi2freq,
        DRUMS, DRUMS_808, WORLD, SYNTHS,
        DEFAULT_TRACKS, PAD_BANKS,
        playDrum,
        playSynth: synth,
        playMetronome: metronome,
    };
})();
