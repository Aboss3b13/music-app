/**
 * BeatForge Studio — Multitrack Recorder
 * Records live audio from the engine's MediaStreamDestination into track lanes.
 * Supports overdub, per-track mute/solo/volume, and mixdown export.
 */
window.BeatForge = window.BeatForge || {};

BeatForge.Multitrack = (function () {
    const engine = BeatForge.AudioEngine;

    let tracks = [];       // { id, name, blob, url, audio, muted, solo, volume, events }
    let recording = false;
    let recorder = null;
    let chunks = [];
    let recordStartTime = 0;
    let events = [];
    let trackCounter = 0;
    let onTrackAdded = null;

    function isRecording() { return recording; }

    function startRecording() {
        engine.resume();
        const stream = engine.getRecordStream();
        if (!stream) { console.warn('No record stream'); return; }

        recorder = new MediaRecorder(stream, { mimeType: _getMime() });
        chunks = [];
        events = [];
        recordStartTime = engine.getContext().currentTime;

        recorder.ondataavailable = function (e) {
            if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = function () {
            const blob = new Blob(chunks, { type: _getMime() });
            _addTrack(blob);
            chunks = [];
        };

        recorder.start(100);
        recording = true;
    }

    function stopRecording() {
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
        }
        recording = false;
    }

    function recordEvent(ev) {
        if (!recording) return;
        ev.recordTime = engine.getContext().currentTime - recordStartTime;
        events.push(ev);
    }

    function _getMime() {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
        if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
        return '';
    }

    function _addTrack(blob) {
        trackCounter++;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = 'auto';

        const track = {
            id: trackCounter,
            name: 'Track ' + trackCounter,
            blob, url, audio,
            muted: false,
            solo: false,
            volume: 0.8,
            events: [...events]
        };
        tracks.push(track);
        if (onTrackAdded) onTrackAdded(track);
    }

    function getTracks() { return tracks; }

    function deleteTrack(id) {
        const idx = tracks.findIndex(t => t.id === id);
        if (idx >= 0) {
            URL.revokeObjectURL(tracks[idx].url);
            tracks.splice(idx, 1);
        }
    }

    function toggleMute(id) {
        const t = tracks.find(tr => tr.id === id);
        if (t) { t.muted = !t.muted; t.audio.muted = t.muted; }
    }

    function toggleSolo(id) {
        const t = tracks.find(tr => tr.id === id);
        if (t) {
            t.solo = !t.solo;
            // If any track is solo'd, mute all others
            const anySolo = tracks.some(tr => tr.solo);
            tracks.forEach(tr => {
                if (anySolo) {
                    tr.audio.muted = !tr.solo;
                } else {
                    tr.audio.muted = tr.muted;
                }
            });
        }
    }

    function setTrackVolume(id, vol) {
        const t = tracks.find(tr => tr.id === id);
        if (t) { t.volume = vol; t.audio.volume = vol; }
    }

    function renameTrack(id, name) {
        const t = tracks.find(tr => tr.id === id);
        if (t) t.name = name;
    }

    function playAll() {
        const anySolo = tracks.some(t => t.solo);
        tracks.forEach(t => {
            t.audio.currentTime = 0;
            t.audio.volume = t.volume;
            if (anySolo) {
                t.audio.muted = !t.solo;
            } else {
                t.audio.muted = t.muted;
            }
            t.audio.play().catch(() => {});
        });
    }

    function stopAll() {
        tracks.forEach(t => {
            t.audio.pause();
            t.audio.currentTime = 0;
        });
    }

    function pauseAll() {
        tracks.forEach(t => t.audio.pause());
    }

    /* Mixdown: combine all tracks into one audio blob */
    async function mixdown() {
        if (tracks.length === 0) return null;

        // Use OfflineAudioContext
        // First determine max duration
        const durations = await Promise.all(tracks.map(t => {
            return new Promise(resolve => {
                const a = new Audio(t.url);
                a.addEventListener('loadedmetadata', () => resolve(a.duration));
                a.addEventListener('error', () => resolve(0));
            });
        }));

        const maxDur = Math.max(...durations, 1);
        const sampleRate = 44100;
        const offline = new OfflineAudioContext(2, Math.ceil(maxDur * sampleRate), sampleRate);

        const buffers = await Promise.all(tracks.map(async (t) => {
            const response = await fetch(t.url);
            const arrayBuf = await response.arrayBuffer();
            try {
                return await offline.decodeAudioData(arrayBuf);
            } catch {
                return null;
            }
        }));

        const anySolo = tracks.some(t => t.solo);
        buffers.forEach((buf, i) => {
            if (!buf) return;
            const t = tracks[i];
            if (anySolo && !t.solo) return;
            if (!anySolo && t.muted) return;

            const src = offline.createBufferSource();
            src.buffer = buf;
            const gain = offline.createGain();
            gain.gain.value = t.volume;
            src.connect(gain);
            gain.connect(offline.destination);
            src.start(0);
        });

        const rendered = await offline.startRendering();
        return _audioBufferToWav(rendered);
    }

    function _audioBufferToWav(buffer) {
        const numCh = buffer.numberOfChannels;
        const sr = buffer.sampleRate;
        const length = buffer.length * numCh * 2 + 44;
        const out = new ArrayBuffer(length);
        const view = new DataView(out);
        let offset = 0;

        function writeStr(s) { for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i)); }
        function write16(v) { view.setInt16(offset, v, true); offset += 2; }
        function write32(v) { view.setInt32(offset, v, true); offset += 4; }

        writeStr('RIFF');
        write32(length - 8);
        writeStr('WAVE');
        writeStr('fmt ');
        write32(16);
        write16(1);
        write16(numCh);
        write32(sr);
        write32(sr * numCh * 2);
        write16(numCh * 2);
        write16(16);
        writeStr('data');
        write32(buffer.length * numCh * 2);

        const channels = [];
        for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));

        for (let i = 0; i < buffer.length; i++) {
            for (let c = 0; c < numCh; c++) {
                const s = Math.max(-1, Math.min(1, channels[c][i]));
                write16(s < 0 ? s * 0x8000 : s * 0x7FFF);
            }
        }
        return new Blob([out], { type: 'audio/wav' });
    }

    function setOnTrackAdded(fn) { onTrackAdded = fn; }

    return {
        isRecording, startRecording, stopRecording, recordEvent,
        getTracks, deleteTrack, toggleMute, toggleSolo,
        setTrackVolume, renameTrack,
        playAll, stopAll, pauseAll,
        mixdown, setOnTrackAdded
    };
})();
