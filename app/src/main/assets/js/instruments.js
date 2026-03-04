/**
 * BeatForge Studio - Instruments
 * All synthesized instrument definitions using Web Audio API
 */

window.BeatForge = window.BeatForge || {};

BeatForge.Instruments = (function () {

    // Note frequency table
    const NOTE_FREQS = {};
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let oct = 0; oct <= 8; oct++) {
        for (let i = 0; i < 12; i++) {
            const noteNum = oct * 12 + i;
            const freq = 440 * Math.pow(2, (noteNum - 57) / 12);
            NOTE_FREQS[NOTE_NAMES[i] + oct] = freq;
        }
    }

    function getFreq(note) {
        return NOTE_FREQS[note] || 440;
    }

    function noteToFreq(noteNum) {
        return 440 * Math.pow(2, (noteNum - 69) / 12);
    }

    // =====================================================
    // DRUM INSTRUMENTS
    // =====================================================

    function playKick(ctx, dest, time, velocity = 0.9) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);
        gain.gain.setValueAtTime(velocity * 1.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

        // Sub layer
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(80, time);
        osc2.frequency.exponentialRampToValueAtTime(30, time + 0.1);
        gain2.gain.setValueAtTime(velocity * 0.8, time);
        gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        // Click transient
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(800, time);
        clickOsc.frequency.exponentialRampToValueAtTime(100, time + 0.02);
        clickGain.gain.setValueAtTime(velocity * 0.3, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(gain).connect(dest);
        osc2.connect(gain2).connect(dest);
        clickOsc.connect(clickGain).connect(dest);

        osc.start(time);
        osc.stop(time + 0.5);
        osc2.start(time);
        osc2.stop(time + 0.6);
        clickOsc.start(time);
        clickOsc.stop(time + 0.03);
    }

    function playSnare(ctx, dest, time, velocity = 0.8) {
        // Noise component
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(velocity * 0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        noise.connect(noiseFilter).connect(noiseGain).connect(dest);

        // Body component
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.exponentialRampToValueAtTime(120, time + 0.03);
        oscGain.gain.setValueAtTime(velocity * 0.6, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(oscGain).connect(dest);

        noise.start(time);
        noise.stop(time + 0.2);
        osc.start(time);
        osc.stop(time + 0.12);
    }

    function playHiHatClosed(ctx, dest, time, velocity = 0.6) {
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'bandpass';
        filter2.frequency.value = 10000;
        filter2.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        noise.connect(filter).connect(filter2).connect(gain).connect(dest);
        noise.start(time);
        noise.stop(time + 0.06);
    }

    function playHiHatOpen(ctx, dest, time, velocity = 0.6) {
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.45, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        noise.connect(filter).connect(gain).connect(dest);
        noise.start(time);
        noise.stop(time + 0.4);
    }

    function playClap(ctx, dest, time, velocity = 0.7) {
        // Multiple noise bursts for clap texture
        for (let j = 0; j < 3; j++) {
            const bufferSize = ctx.sampleRate * 0.02;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2500;
            filter.Q.value = 3;

            const gain = ctx.createGain();
            const offset = j * 0.01;
            gain.gain.setValueAtTime(0, time + offset);
            gain.gain.linearRampToValueAtTime(velocity * 0.5, time + offset + 0.001);
            gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.08);

            noise.connect(filter).connect(gain).connect(dest);
            noise.start(time + offset);
            noise.stop(time + offset + 0.1);
        }

        // Tail
        const tailSize = ctx.sampleRate * 0.15;
        const tailBuf = ctx.createBuffer(1, tailSize, ctx.sampleRate);
        const tailData = tailBuf.getChannelData(0);
        for (let i = 0; i < tailSize; i++) {
            tailData[i] = Math.random() * 2 - 1;
        }
        const tailNoise = ctx.createBufferSource();
        tailNoise.buffer = tailBuf;
        const tailFilter = ctx.createBiquadFilter();
        tailFilter.type = 'bandpass';
        tailFilter.frequency.value = 2500;
        tailFilter.Q.value = 2;
        const tailGain = ctx.createGain();
        tailGain.gain.setValueAtTime(velocity * 0.35, time + 0.03);
        tailGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        tailNoise.connect(tailFilter).connect(tailGain).connect(dest);
        tailNoise.start(time + 0.03);
        tailNoise.stop(time + 0.16);
    }

    function playTom(ctx, dest, time, velocity = 0.7, pitch = 1.0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const baseFreq = 100 * pitch;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * 2, time);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.06);

        gain.gain.setValueAtTime(velocity * 0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        osc.connect(gain).connect(dest);
        osc.start(time);
        osc.stop(time + 0.35);
    }

    function playCrash(ctx, dest, time, velocity = 0.6) {
        const bufferSize = ctx.sampleRate * 1.5;
        const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
            }
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 4000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

        noise.connect(filter).connect(gain).connect(dest);
        noise.start(time);
        noise.stop(time + 1.5);
    }

    function playRide(ctx, dest, time, velocity = 0.5) {
        const bufferSize = ctx.sampleRate * 0.6;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 8000;
        filter.Q.value = 2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        noise.connect(filter).connect(gain).connect(dest);
        noise.start(time);
        noise.stop(time + 0.6);
    }

    function playRim(ctx, dest, time, velocity = 0.7) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, time);
        gain.gain.setValueAtTime(velocity * 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        osc.connect(gain).connect(dest);
        osc.start(time);
        osc.stop(time + 0.03);
    }

    function playPerc(ctx, dest, time, velocity = 0.6) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, time);
        osc.frequency.exponentialRampToValueAtTime(400, time + 0.03);
        gain.gain.setValueAtTime(velocity * 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.connect(gain).connect(dest);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    function playShaker(ctx, dest, time, velocity = 0.4) {
        const bufferSize = ctx.sampleRate * 0.06;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 12000;
        filter.Q.value = 5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        noise.connect(filter).connect(gain).connect(dest);
        noise.start(time);
        noise.stop(time + 0.06);
    }

    function playCowbell(ctx, dest, time, velocity = 0.5) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.value = 587;
        osc2.type = 'square';
        osc2.frequency.value = 845;
        gain.gain.setValueAtTime(velocity * 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 700;
        filter.Q.value = 3;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain).connect(dest);
        osc1.start(time);
        osc1.stop(time + 0.16);
        osc2.start(time);
        osc2.stop(time + 0.16);
    }

    // =====================================================
    // SYNTH INSTRUMENTS
    // =====================================================

    function playSynthNote(ctx, dest, note, time, duration, velocity, type, opts = {}) {
        const freq = typeof note === 'string' ? getFreq(note) : noteToFreq(note);
        const v = velocity || 0.6;
        const dur = duration || 0.3;

        switch (type) {
            case 'piano': return _playPiano(ctx, dest, freq, time, dur, v);
            case 'epiano': return _playEPiano(ctx, dest, freq, time, dur, v);
            case 'bass': return _playBass(ctx, dest, freq, time, dur, v);
            case 'lead': return _playLead(ctx, dest, freq, time, dur, v);
            case 'pad': return _playPad(ctx, dest, freq, time, dur, v);
            case 'strings': return _playStrings(ctx, dest, freq, time, dur, v);
            case 'pluck': return _playPluck(ctx, dest, freq, time, dur, v);
            case 'nebula': return _playNebula(ctx, dest, freq, time, dur, v);
            default: return _playPiano(ctx, dest, freq, time, dur, v);
        }
    }

    function _playPiano(ctx, dest, freq, time, dur, vel) {
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, time);
        master.gain.linearRampToValueAtTime(vel * 0.5, time + 0.005);
        master.gain.setTargetAtTime(vel * 0.3, time + 0.005, 0.1);
        master.gain.setTargetAtTime(0.001, time + dur * 0.7, dur * 0.3);

        // Fundamental
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.value = freq;
        const g1 = ctx.createGain();
        g1.gain.value = 0.6;
        osc1.connect(g1).connect(master);

        // 2nd harmonic
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;
        const g2 = ctx.createGain();
        g2.gain.value = 0.2;
        osc2.connect(g2).connect(master);

        // 3rd harmonic
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = freq * 3;
        const g3 = ctx.createGain();
        g3.gain.value = 0.05;
        osc3.connect(g3).connect(master);

        master.connect(dest);

        const end = time + dur + 0.5;
        osc1.start(time); osc1.stop(end);
        osc2.start(time); osc2.stop(end);
        osc3.start(time); osc3.stop(end);
    }

    function _playEPiano(ctx, dest, freq, time, dur, vel) {
        // FM synthesis: modulator modifies carrier frequency
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        const master = ctx.createGain();

        carrier.type = 'sine';
        carrier.frequency.value = freq;

        modulator.type = 'sine';
        modulator.frequency.value = freq * 7; // Ratio of 7 for bell-like tone
        modGain.gain.setValueAtTime(freq * 4, time);
        modGain.gain.exponentialRampToValueAtTime(freq * 0.5, time + dur * 0.5);

        master.gain.setValueAtTime(0, time);
        master.gain.linearRampToValueAtTime(vel * 0.4, time + 0.003);
        master.gain.setTargetAtTime(vel * 0.2, time + 0.003, 0.15);
        master.gain.setTargetAtTime(0.001, time + dur * 0.5, dur * 0.3);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(master).connect(dest);

        const end = time + dur + 0.5;
        carrier.start(time); carrier.stop(end);
        modulator.start(time); modulator.stop(end);
    }

    function _playBass(ctx, dest, freq, time, dur, vel) {
        const master = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 8, time);
        filter.frequency.exponentialRampToValueAtTime(freq * 2, time + 0.1);
        filter.Q.value = 5;

        master.gain.setValueAtTime(0, time);
        master.gain.linearRampToValueAtTime(vel * 0.7, time + 0.01);
        master.gain.setTargetAtTime(vel * 0.5, time + 0.01, 0.05);
        master.gain.setTargetAtTime(0.001, time + dur * 0.8, 0.1);

        // Saw oscillator
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = freq;

        // Sub oscillator (one octave down)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq / 2;
        const subGain = ctx.createGain();
        subGain.gain.value = 0.5;

        osc1.connect(filter);
        osc2.connect(subGain).connect(filter);
        filter.connect(master).connect(dest);

        const end = time + dur + 0.3;
        osc1.start(time); osc1.stop(end);
        osc2.start(time); osc2.stop(end);
    }

    function _playLead(ctx, dest, freq, time, dur, vel) {
        const master = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3, time);
        filter.frequency.setTargetAtTime(freq * 6, time, dur * 0.3);
        filter.Q.value = 3;

        master.gain.setValueAtTime(0, time);
        master.gain.linearRampToValueAtTime(vel * 0.4, time + 0.01);
        master.gain.setTargetAtTime(vel * 0.3, time + 0.01, 0.05);
        master.gain.setTargetAtTime(0.001, time + dur * 0.8, 0.1);

        // Detuned saws
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = freq;
        osc1.detune.value = -12;

        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.value = freq;
        osc2.detune.value = 12;

        const g1 = ctx.createGain(); g1.gain.value = 0.35;
        const g2 = ctx.createGain(); g2.gain.value = 0.35;

        osc1.connect(g1).connect(filter);
        osc2.connect(g2).connect(filter);
        filter.connect(master).connect(dest);

        // LFO for vibrato
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = 3;
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        const end = time + dur + 0.2;
        osc1.start(time); osc1.stop(end);
        osc2.start(time); osc2.stop(end);
        lfo.start(time); lfo.stop(end);
    }

    function _playPad(ctx, dest, freq, time, dur, vel) {
        const master = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = freq * 4;
        filter.Q.value = 1;

        // Slow attack, slow release
        master.gain.setValueAtTime(0, time);
        master.gain.linearRampToValueAtTime(vel * 0.25, time + dur * 0.3);
        master.gain.setTargetAtTime(vel * 0.2, time + dur * 0.3, 0.2);
        master.gain.setTargetAtTime(0.001, time + dur * 0.7, dur * 0.3);

        // Multiple detuned oscillators
        const detunes = [-15, -7, 0, 7, 15];
        const oscs = detunes.map(d => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = d;
            const g = ctx.createGain();
            g.gain.value = 0.12;
            osc.connect(g).connect(filter);
            return osc;
        });

        filter.connect(master).connect(dest);

        const end = time + dur + 1.0;
        oscs.forEach(o => { o.start(time); o.stop(end); });
    }

    function _playStrings(ctx, dest, freq, time, dur, vel) {
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, time);
        master.gain.linearRampToValueAtTime(vel * 0.3, time + dur * 0.2);
        master.gain.setTargetAtTime(vel * 0.25, time + dur * 0.2, 0.3);
        master.gain.setTargetAtTime(0.001, time + dur * 0.6, dur * 0.4);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 5.5;
        lfoGain.gain.value = 2;
        lfo.connect(lfoGain);

        // String ensemble (4 oscillators)
        const configs = [
            { detune: -8, type: 'sawtooth', vol: 0.15 },
            { detune: 5, type: 'sawtooth', vol: 0.15 },
            { detune: -3, type: 'triangle', vol: 0.1 },
            { detune: 10, type: 'sawtooth', vol: 0.12 },
        ];

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = freq * 3;
        filter.Q.value = 0.5;

        const oscs = configs.map(c => {
            const osc = ctx.createOscillator();
            osc.type = c.type;
            osc.frequency.value = freq;
            osc.detune.value = c.detune;
            lfoGain.connect(osc.frequency);
            const g = ctx.createGain();
            g.gain.value = c.vol;
            osc.connect(g).connect(filter);
            return osc;
        });

        filter.connect(master).connect(dest);

        const end = time + dur + 0.8;
        oscs.forEach(o => { o.start(time); o.stop(end); });
        lfo.start(time); lfo.stop(end);
    }

    function _playPluck(ctx, dest, freq, time, dur, vel) {
        const master = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 12, time);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + 0.15);
        filter.Q.value = 2;

        master.gain.setValueAtTime(0, time);
        master.gain.linearRampToValueAtTime(vel * 0.5, time + 0.003);
        master.gain.exponentialRampToValueAtTime(0.001, time + Math.min(dur, 0.4));

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        osc.connect(filter).connect(master).connect(dest);

        const end = time + dur + 0.1;
        osc.start(time); osc.stop(end);
    }

    // =====================================================
    // NEBULA SYNTH - Unique Instrument!
    // Creates ethereal, evolving cosmic textures
    // =====================================================

    function _playNebula(ctx, dest, freq, time, dur, vel) {
        const master = ctx.createGain();

        // Very slow, dreamy envelope
        master.gain.setValueAtTime(0, time);
        master.gain.linearRampToValueAtTime(vel * 0.2, time + dur * 0.25);
        master.gain.setTargetAtTime(vel * 0.18, time + dur * 0.25, dur * 0.2);
        master.gain.setTargetAtTime(0.001, time + dur * 0.6, dur * 0.5);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = freq * 5;
        filter.Q.value = 2;

        // Filter LFO for movement
        const filterLFO = ctx.createOscillator();
        const filterLFOGain = ctx.createGain();
        filterLFO.frequency.value = 0.3 + Math.random() * 0.5;
        filterLFOGain.gain.value = freq * 2;
        filterLFO.connect(filterLFOGain).connect(filter.frequency);

        // 8 oscillators with different behaviors - the Nebula core
        const oscCount = 8;
        const waveforms = ['sine', 'triangle', 'sawtooth', 'sine', 'triangle', 'sine', 'sawtooth', 'sine'];
        const oscs = [];

        for (let i = 0; i < oscCount; i++) {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();

            osc.type = waveforms[i];

            // Each oscillator targets a different harmonic with random detuning
            const harmonic = [1, 1.001, 2, 2.997, 4, 5.01, 0.5, 1.5][i];
            const randomDetune = (Math.random() - 0.5) * 30;
            osc.frequency.value = freq * harmonic;
            osc.detune.value = randomDetune;

            oscGain.gain.value = (0.04 + Math.random() * 0.03) * (i < 4 ? 1 : 0.5);

            // Individual LFO for each oscillator (random modulation)
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = 0.1 + Math.random() * 2;
            lfoGain.gain.value = freq * harmonic * (0.003 + Math.random() * 0.01);
            lfo.connect(lfoGain).connect(osc.frequency);

            // Amplitude modulation for shimmer
            const ampLfo = ctx.createOscillator();
            const ampLfoGain = ctx.createGain();
            ampLfo.frequency.value = 0.5 + Math.random() * 3;
            ampLfoGain.gain.value = 0.02;
            ampLfo.connect(ampLfoGain).connect(oscGain.gain);

            osc.connect(oscGain).connect(filter);
            oscs.push({ osc, lfo, ampLfo });
        }

        // Shimmer layer: high pitched, quiet sine that fades in and out
        const shimmer = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.value = freq * 8;
        shimmerGain.gain.setValueAtTime(0, time);
        shimmerGain.gain.linearRampToValueAtTime(vel * 0.02, time + dur * 0.4);
        shimmerGain.gain.setTargetAtTime(0, time + dur * 0.5, dur * 0.3);
        shimmer.connect(shimmerGain).connect(filter);

        // Noise layer for texture
        const noiseLen = Math.max(ctx.sampleRate * (dur + 1), 1);
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.02;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = freq * 3;
        noiseFilter.Q.value = 10;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, time);
        noiseGain.gain.linearRampToValueAtTime(vel * 0.04, time + dur * 0.3);
        noiseGain.gain.setTargetAtTime(0.001, time + dur * 0.6, dur * 0.3);
        noiseSource.connect(noiseFilter).connect(noiseGain).connect(filter);

        filter.connect(master).connect(dest);

        const end = time + dur + 1.5;
        oscs.forEach(o => {
            o.osc.start(time); o.osc.stop(end);
            o.lfo.start(time); o.lfo.stop(end);
            o.ampLfo.start(time); o.ampLfo.stop(end);
        });
        shimmer.start(time); shimmer.stop(end);
        filterLFO.start(time); filterLFO.stop(end);
        noiseSource.start(time); noiseSource.stop(end);
    }

    // =====================================================
    // METRONOME
    // =====================================================

    function playMetronomeClick(ctx, dest, time, accent) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = accent ? 1200 : 800;
        gain.gain.setValueAtTime(accent ? 0.3 : 0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        osc.connect(gain).connect(dest);
        osc.start(time);
        osc.stop(time + 0.04);
    }

    // =====================================================
    // INSTRUMENT REGISTRY
    // =====================================================

    const DRUM_INSTRUMENTS = {
        kick:     { name: 'Kick',       play: playKick,         color: '#ef4444' },
        snare:    { name: 'Snare',      play: playSnare,        color: '#f59e0b' },
        hihat:    { name: 'Hi-Hat C',   play: playHiHatClosed,  color: '#10b981' },
        ohihat:   { name: 'Hi-Hat O',   play: playHiHatOpen,    color: '#059669' },
        clap:     { name: 'Clap',       play: playClap,         color: '#a855f7' },
        tom_hi:   { name: 'Tom Hi',     play: (c, d, t, v) => playTom(c, d, t, v, 1.5), color: '#3b82f6' },
        tom_mid:  { name: 'Tom Mid',    play: (c, d, t, v) => playTom(c, d, t, v, 1.0), color: '#2563eb' },
        tom_lo:   { name: 'Tom Lo',     play: (c, d, t, v) => playTom(c, d, t, v, 0.6), color: '#1d4ed8' },
        crash:    { name: 'Crash',      play: playCrash,        color: '#f472b6' },
        ride:     { name: 'Ride',       play: playRide,         color: '#fb923c' },
        rim:      { name: 'Rim',        play: playRim,          color: '#94a3b8' },
        perc:     { name: 'Perc',       play: playPerc,         color: '#06b6d4' },
        shaker:   { name: 'Shaker',     play: playShaker,       color: '#84cc16' },
        cowbell:  { name: 'Cowbell',    play: playCowbell,      color: '#eab308' },
    };

    const SYNTH_INSTRUMENTS = {
        piano:   { name: 'Piano',        color: '#e8eaf0' },
        epiano:  { name: 'Electric Piano', color: '#60a5fa' },
        bass:    { name: 'Bass Synth',   color: '#ef4444' },
        lead:    { name: 'Lead Synth',   color: '#f59e0b' },
        pad:     { name: 'Pad',          color: '#a855f7' },
        strings: { name: 'Strings',      color: '#f472b6' },
        pluck:   { name: 'Pluck',        color: '#10b981' },
        nebula:  { name: '✨ Nebula Synth', color: '#00f0ff' },
    };

    // Default sequencer tracks
    const DEFAULT_TRACKS = [
        { id: 'kick',    type: 'drum', instrument: 'kick',    note: null },
        { id: 'snare',   type: 'drum', instrument: 'snare',   note: null },
        { id: 'hihat',   type: 'drum', instrument: 'hihat',   note: null },
        { id: 'ohihat',  type: 'drum', instrument: 'ohihat',  note: null },
        { id: 'clap',    type: 'drum', instrument: 'clap',    note: null },
        { id: 'tom_hi',  type: 'drum', instrument: 'tom_hi',  note: null },
        { id: 'crash',   type: 'drum', instrument: 'crash',   note: null },
        { id: 'ride',    type: 'drum', instrument: 'ride',    note: null },
        { id: 'rim',     type: 'drum', instrument: 'rim',     note: null },
        { id: 'shaker',  type: 'drum', instrument: 'shaker',  note: null },
        { id: 'perc',    type: 'drum', instrument: 'perc',    note: null },
        { id: 'cowbell', type: 'drum', instrument: 'cowbell',  note: null },
        { id: 'bass',    type: 'synth', instrument: 'bass',   note: 'C3' },
        { id: 'lead',    type: 'synth', instrument: 'lead',   note: 'C5' },
        { id: 'pad',     type: 'synth', instrument: 'pad',    note: 'C4' },
        { id: 'nebula',  type: 'synth', instrument: 'nebula', note: 'C4' },
    ];

    // Pad sound assignments
    const PAD_BANKS = {
        drums: [
            'kick', 'snare', 'hihat', 'ohihat',
            'clap', 'tom_hi', 'tom_mid', 'tom_lo',
            'crash', 'ride', 'rim', 'perc',
            'shaker', 'cowbell', 'kick', 'snare'
        ],
        bass: [
            'C2', 'D2', 'E2', 'F2',
            'G2', 'A2', 'B2', 'C3',
            'D3', 'E3', 'F3', 'G3',
            'A3', 'B3', 'C4', 'D4'
        ],
        synth: [
            'C4', 'D4', 'E4', 'F4',
            'G4', 'A4', 'B4', 'C5',
            'D5', 'E5', 'F5', 'G5',
            'A5', 'B5', 'C6', 'D6'
        ],
        nebula: [
            'C3', 'E3', 'G3', 'B3',
            'C4', 'E4', 'G4', 'B4',
            'C5', 'D5', 'E5', 'F#5',
            'G5', 'A5', 'B5', 'C6'
        ],
    };

    return {
        NOTE_FREQS,
        NOTE_NAMES,
        getFreq,
        noteToFreq,
        DRUM_INSTRUMENTS,
        SYNTH_INSTRUMENTS,
        DEFAULT_TRACKS,
        PAD_BANKS,
        playDrum: function (ctx, dest, instrument, time, velocity) {
            const drum = DRUM_INSTRUMENTS[instrument];
            if (drum) drum.play(ctx, dest, time, velocity);
        },
        playSynth: playSynthNote,
        playMetronome: playMetronomeClick,
    };
})();
