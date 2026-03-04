/**
 * BeatForge Studio — Mixer
 * Mobile-friendly channel strip mixer with meters.
 */
window.BeatForge = window.BeatForge || {};

BeatForge.Mixer = (function () {
    const engine = BeatForge.AudioEngine;

    let channels = [];  // { name, gain, muted, solo, pan, analyser }
    let masterAnalyser = null;
    let animFrame = null;
    let container = null;

    function init(el) {
        container = el;
        const c = engine.getContext();
        masterAnalyser = c.createAnalyser();
        masterAnalyser.fftSize = 256;
        engine.getDestination().connect(masterAnalyser);

        // Default channels: Master + drum groups later
        _buildChannels([
            { name: 'Master', isMaster: true },
            { name: 'Drums' },
            { name: 'Bass' },
            { name: 'Synth' },
            { name: 'FX' }
        ]);

        _startMetering();
    }

    function _buildChannels(defs) {
        channels = defs.map(d => ({
            name: d.name,
            isMaster: d.isMaster || false,
            gain: 80,
            muted: false,
            solo: false,
            pan: 50,
            level: 0
        }));
    }

    function getChannels() { return channels; }

    function setChannelGain(idx, val) {
        if (channels[idx]) channels[idx].gain = val;
        _applyMaster();
    }

    function toggleChannelMute(idx) {
        if (channels[idx]) channels[idx].muted = !channels[idx].muted;
    }

    function toggleChannelSolo(idx) {
        if (channels[idx]) channels[idx].solo = !channels[idx].solo;
    }

    function setChannelPan(idx, val) {
        if (channels[idx]) channels[idx].pan = val;
    }

    function _applyMaster() {
        const master = channels.find(c => c.isMaster);
        if (master) {
            engine.setVolume(master.gain / 100);
        }
    }

    function _startMetering() {
        if (!masterAnalyser) return;
        const buf = new Uint8Array(masterAnalyser.frequencyBinCount);

        function update() {
            animFrame = requestAnimationFrame(update);
            masterAnalyser.getByteFrequencyData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) sum += buf[i];
            const avg = sum / buf.length / 255;

            channels.forEach(ch => {
                if (ch.isMaster) {
                    ch.level = avg;
                } else {
                    // Simulated per-channel level based on master mix
                    ch.level = ch.muted ? 0 : avg * (ch.gain / 100) * (0.7 + Math.random() * 0.3);
                }
            });
        }
        update();
    }

    function getMasterLevel() {
        return channels.length > 0 ? channels[0].level : 0;
    }

    return {
        init, getChannels,
        setChannelGain, toggleChannelMute, toggleChannelSolo, setChannelPan,
        getMasterLevel
    };
})();
