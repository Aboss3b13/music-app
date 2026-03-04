/**
 * BeatForge Studio — Recorder / WAV Export
 * Renders the sequencer loop offline to a WAV file.
 */
window.BeatForge = window.BeatForge || {};

BeatForge.Recorder = (function () {
    const engine = BeatForge.AudioEngine;
    const inst   = BeatForge.Instruments;
    const seq    = BeatForge.Sequencer;

    let onProgress = null;

    function setOnProgress(fn) { onProgress = fn; }

    /* Render sequencer loops to WAV blob */
    async function renderWAV(loops) {
        loops = loops || 4;
        const bpm = seq.getBPM();
        const steps = seq.getSteps();
        const grid = seq.getGrid();
        const tracks = seq.getTracks();

        const secPerStep = 60.0 / bpm / 4;
        const loopDur = steps * secPerStep;
        const totalDur = loopDur * loops + 1;  // +1s tail
        const sr = 44100;
        const offline = new OfflineAudioContext(2, Math.ceil(totalDur * sr), sr);

        // Re-create effect chain in offline context
        const offGain = offline.createGain();
        offGain.gain.value = 0.8;
        const comp = offline.createDynamicsCompressor();
        offGain.connect(comp).connect(offline.destination);

        // Schedule all steps
        for (let l = 0; l < loops; l++) {
            for (let s = 0; s < steps; s++) {
                const time = l * loopDur + s * secPerStep;
                tracks.forEach(t => {
                    if (grid[t] && grid[t][s]) {
                        inst.playDrum(offline, offGain, t, time);
                    }
                });
            }
            if (onProgress) onProgress(((l + 1) / loops) * 0.8);
        }

        const rendered = await offline.startRendering();
        if (onProgress) onProgress(0.95);

        const wav = _toWAV(rendered);
        if (onProgress) onProgress(1.0);
        return wav;
    }

    function _toWAV(buffer) {
        const numCh = buffer.numberOfChannels;
        const sr = buffer.sampleRate;
        const len = buffer.length * numCh * 2 + 44;
        const out = new ArrayBuffer(len);
        const v = new DataView(out);
        let off = 0;

        function s(str) { for (let i = 0; i < str.length; i++) v.setUint8(off++, str.charCodeAt(i)); }
        function w16(n) { v.setInt16(off, n, true); off += 2; }
        function w32(n) { v.setInt32(off, n, true); off += 4; }

        s('RIFF'); w32(len - 8); s('WAVE');
        s('fmt '); w32(16); w16(1); w16(numCh);
        w32(sr); w32(sr * numCh * 2); w16(numCh * 2); w16(16);
        s('data'); w32(buffer.length * numCh * 2);

        const ch = [];
        for (let c = 0; c < numCh; c++) ch.push(buffer.getChannelData(c));

        for (let i = 0; i < buffer.length; i++) {
            for (let c = 0; c < numCh; c++) {
                const val = Math.max(-1, Math.min(1, ch[c][i]));
                w16(val < 0 ? val * 0x8000 : val * 0x7FFF);
            }
        }
        return new Blob([out], { type: 'audio/wav' });
    }

    /* Trigger download */
    function download(blob, filename) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (filename || 'beatforge-track') + '.wav';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 200);
    }

    return { renderWAV, download, setOnProgress };
})();
