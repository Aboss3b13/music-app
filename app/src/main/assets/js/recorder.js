/**
 * BeatForge Studio - Recorder / Exporter
 * Renders patterns to WAV audio files for export
 */

window.BeatForge = window.BeatForge || {};

BeatForge.Recorder = (function () {
    const instruments = BeatForge.Instruments;

    let isRendering = false;

    /**
     * Render the current pattern to an AudioBuffer using OfflineAudioContext
     */
    async function renderPattern(options) {
        const {
            bpm,
            steps,
            pattern,
            trackConfigs,
            loops = 4,
            sampleRate = 44100,
            onProgress,
        } = options;

        const stepDuration = 60 / bpm / 4; // 16th note
        const patternDuration = steps * stepDuration;
        const totalDuration = patternDuration * loops;
        const totalSamples = Math.ceil(totalDuration * sampleRate) + sampleRate; // +1s tail

        isRendering = true;

        const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

        // Create master chain for offline context
        const masterGain = offlineCtx.createGain();
        masterGain.gain.value = 0.8;

        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.value = -6;
        compressor.knee.value = 10;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        // Simple reverb for offline
        const reverbGain = offlineCtx.createGain();
        reverbGain.gain.value = 0.15;
        const reverbDur = 2.0;
        const reverbLen = sampleRate * reverbDur;
        const reverbBuf = offlineCtx.createBuffer(2, reverbLen, sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = reverbBuf.getChannelData(ch);
            for (let i = 0; i < reverbLen; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.0);
            }
        }
        const convolver = offlineCtx.createConvolver();
        convolver.buffer = reverbBuf;

        // Routing
        masterGain.connect(compressor);
        compressor.connect(offlineCtx.destination);

        // Reverb send
        const reverbSend = offlineCtx.createGain();
        reverbSend.gain.value = 0.2;
        reverbSend.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(compressor);

        // Schedule all notes
        for (let loop = 0; loop < loops; loop++) {
            const loopOffset = loop * patternDuration;

            if (onProgress) {
                onProgress(loop / loops * 0.3); // 0-30% for scheduling
            }

            trackConfigs.forEach(track => {
                const trackPattern = pattern[track.id];
                if (!trackPattern) return;

                for (let step = 0; step < steps; step++) {
                    if (!trackPattern[step]) continue;

                    const time = loopOffset + step * stepDuration;

                    if (track.type === 'drum') {
                        instruments.playDrum(offlineCtx, masterGain, track.instrument, time, 0.8);
                        // Also send to reverb
                        instruments.playDrum(offlineCtx, reverbSend, track.instrument, time, 0.3);
                    } else {
                        const noteDur = stepDuration * 0.9;
                        instruments.playSynth(
                            offlineCtx, masterGain, track.note, time,
                            noteDur, 0.7, track.instrument
                        );
                        instruments.playSynth(
                            offlineCtx, reverbSend, track.note, time,
                            noteDur, 0.2, track.instrument
                        );
                    }
                }
            });
        }

        if (onProgress) onProgress(0.4);

        // Render
        const renderedBuffer = await offlineCtx.startRendering();

        if (onProgress) onProgress(0.8);

        isRendering = false;
        return renderedBuffer;
    }

    /**
     * Convert AudioBuffer to WAV Blob
     */
    function audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const dataLength = buffer.length * blockAlign;
        const headerLength = 44;
        const totalLength = headerLength + dataLength;

        const arrayBuffer = new ArrayBuffer(totalLength);
        const view = new DataView(arrayBuffer);

        // WAV header
        writeString(view, 0, 'RIFF');
        view.setUint32(4, totalLength - 8, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // chunk size
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // Interleave channels and write samples
        const channels = [];
        for (let ch = 0; ch < numChannels; ch++) {
            channels.push(buffer.getChannelData(ch));
        }

        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                let sample = channels[ch][i];
                // Clamp
                sample = Math.max(-1, Math.min(1, sample));
                // Convert to 16-bit integer
                const intSample = sample < 0 ? sample * 32768 : sample * 32767;
                view.setInt16(offset, intSample, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Export pattern as WAV file
     */
    async function exportWAV(options) {
        const {
            bpm, steps, pattern, trackConfigs, loops, filename, onProgress
        } = options;

        const buffer = await renderPattern({
            bpm, steps, pattern, trackConfigs, loops,
            onProgress: (p) => onProgress && onProgress(p * 0.8),
        });

        const wavBlob = audioBufferToWav(buffer);

        if (onProgress) onProgress(0.9);

        const finalFilename = (filename || 'beatforge-track') + '.wav';

        // Check if Android native export is available
        if (window.AndroidExport) {
            const reader = new FileReader();
            reader.onloadend = function () {
                const base64 = reader.result.split(',')[1];
                window.AndroidExport.saveFile(base64, finalFilename, 'audio/wav');
                if (onProgress) onProgress(1.0);
            };
            reader.readAsDataURL(wavBlob);
        } else {
            // Web fallback: trigger download
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = finalFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (onProgress) onProgress(1.0);
        }

        return wavBlob;
    }

    /**
     * Share exported file (Android only)
     */
    async function shareFile(options) {
        const { bpm, steps, pattern, trackConfigs, loops, filename, onProgress } = options;

        const buffer = await renderPattern({
            bpm, steps, pattern, trackConfigs, loops,
            onProgress: (p) => onProgress && onProgress(p * 0.8),
        });

        const wavBlob = audioBufferToWav(buffer);
        const finalFilename = (filename || 'beatforge-track') + '.wav';

        if (window.AndroidExport) {
            const reader = new FileReader();
            reader.onloadend = function () {
                const base64 = reader.result.split(',')[1];
                window.AndroidExport.shareFile(base64, finalFilename, 'audio/wav');
                if (onProgress) onProgress(1.0);
            };
            reader.readAsDataURL(wavBlob);
        }
    }

    return {
        renderPattern,
        audioBufferToWav,
        exportWAV,
        shareFile,
        isRendering: () => isRendering,
    };
})();
