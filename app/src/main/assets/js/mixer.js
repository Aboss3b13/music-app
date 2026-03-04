/**
 * BeatForge Studio - Mixer
 * Visual mixer with meters, faders, and controls
 */

window.BeatForge = window.BeatForge || {};

BeatForge.Mixer = (function () {
    const engine = BeatForge.AudioEngine;
    const instruments = BeatForge.Instruments;
    const sequencer = BeatForge.Sequencer;

    let meterAnimFrame = null;
    let meterCanvases = {};

    function buildMixerUI() {
        const container = document.getElementById('mixer-channels');
        if (!container) return;
        container.innerHTML = '';

        const tracks = instruments.DEFAULT_TRACKS;

        tracks.forEach(track => {
            const info = track.type === 'drum'
                ? instruments.DRUM_INSTRUMENTS[track.instrument]
                : instruments.SYNTH_INSTRUMENTS[track.instrument];

            const ch = document.createElement('div');
            ch.className = 'mixer-channel';
            ch.dataset.trackId = track.id;

            ch.innerHTML = `
                <div class="mixer-channel-name" style="color:${info.color}">${info.name}</div>
                <div class="mixer-meter">
                    <div class="mixer-meter-fill" id="meter-${track.id}" style="height:0%"></div>
                </div>
                <input type="range" class="mixer-fader" orient="vertical"
                    min="0" max="100" value="80"
                    data-track="${track.id}" data-control="volume"
                    title="Volume">
                <div style="font-size:9px;color:var(--text-muted)">Pan</div>
                <input type="range" class="mixer-pan"
                    min="-100" max="100" value="0"
                    data-track="${track.id}" data-control="pan"
                    title="Pan">
                <div class="mixer-btn-group">
                    <button class="mixer-btn" data-track="${track.id}" data-control="mute" title="Mute">M</button>
                    <button class="mixer-btn" data-track="${track.id}" data-control="solo" title="Solo">S</button>
                </div>
            `;

            container.appendChild(ch);
        });

        // Master channel
        const master = document.createElement('div');
        master.className = 'mixer-channel master';
        master.innerHTML = `
            <div class="mixer-channel-name" style="color:var(--accent-cyan)">MASTER</div>
            <div class="mixer-meter">
                <div class="mixer-meter-fill" id="meter-master" style="height:0%"></div>
            </div>
            <input type="range" class="mixer-fader" orient="vertical"
                min="0" max="100" value="80"
                data-control="master-volume"
                title="Master Volume">
            <div style="font-size:8px;color:var(--text-secondary);text-align:center;margin-top:4px">Master</div>
        `;
        container.appendChild(master);

        // Attach events
        container.querySelectorAll('.mixer-fader').forEach(fader => {
            fader.addEventListener('input', handleFaderChange);
        });
        container.querySelectorAll('.mixer-pan').forEach(pan => {
            pan.addEventListener('input', handlePanChange);
        });
        container.querySelectorAll('.mixer-btn').forEach(btn => {
            btn.addEventListener('click', handleMixerButton);
        });
    }

    function handleFaderChange(e) {
        const control = e.target.dataset.control;
        const value = parseInt(e.target.value);

        if (control === 'master-volume') {
            engine.setMasterVolume(value);
            const valDisplay = document.getElementById('master-vol-val');
            if (valDisplay) valDisplay.textContent = value + '%';
        } else if (control === 'volume') {
            const trackId = e.target.dataset.track;
            sequencer.setTrackVolume(trackId, value / 100);
        }
    }

    function handlePanChange(e) {
        const trackId = e.target.dataset.track;
        const value = parseInt(e.target.value) / 100;
        sequencer.setTrackPan(trackId, value);
    }

    function handleMixerButton(e) {
        const trackId = e.target.dataset.track;
        const control = e.target.dataset.control;

        if (control === 'mute') {
            e.target.classList.toggle('mute-active');
            sequencer.setTrackMute(trackId, e.target.classList.contains('mute-active'));
        } else if (control === 'solo') {
            e.target.classList.toggle('solo-active');
            sequencer.setTrackSolo(trackId, e.target.classList.contains('solo-active'));
        }
    }

    // Meter animation
    function startMeters() {
        if (meterAnimFrame) return;
        _animateMeters();
    }

    function stopMeters() {
        if (meterAnimFrame) {
            cancelAnimationFrame(meterAnimFrame);
            meterAnimFrame = null;
        }
    }

    function _animateMeters() {
        const analyser = engine.getAnalyser();
        if (!analyser) {
            meterAnimFrame = requestAnimationFrame(_animateMeters);
            return;
        }

        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(data);

        // Calculate overall level
        let sum = 0;
        for (let i = 0; i < bufLen; i++) {
            sum += data[i];
        }
        const avg = sum / bufLen;
        const level = Math.min(100, (avg / 255) * 150); // Amplify for visual

        // Update master meter
        const masterMeter = document.getElementById('meter-master');
        if (masterMeter) {
            masterMeter.style.height = level + '%';
        }

        // Approximate per-track levels (simulated based on master)
        const tracks = instruments.DEFAULT_TRACKS;
        tracks.forEach((track, i) => {
            const meter = document.getElementById('meter-' + track.id);
            if (meter) {
                // Use different frequency bands for different tracks
                const bandStart = Math.floor((i / tracks.length) * bufLen);
                const bandEnd = Math.floor(((i + 1) / tracks.length) * bufLen);
                let bandSum = 0;
                for (let j = bandStart; j < bandEnd; j++) {
                    bandSum += data[j];
                }
                const bandAvg = bandEnd > bandStart ? bandSum / (bandEnd - bandStart) : 0;
                const trackLevel = Math.min(100, (bandAvg / 255) * 150);
                meter.style.height = trackLevel + '%';
            }
        });

        meterAnimFrame = requestAnimationFrame(_animateMeters);
    }

    return {
        buildMixerUI,
        startMeters,
        stopMeters,
    };
})();
