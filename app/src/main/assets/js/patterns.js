/**
 * BeatForge Studio - Pre-built Patterns
 * Genre-specific beat and instrument patterns
 */

window.BeatForge = window.BeatForge || {};

BeatForge.Patterns = (function () {
    // Pattern format: 16-step arrays where 1 = active, 0 = inactive

    const PRESETS = {

        // =====================================================
        // HIP-HOP
        // =====================================================

        'hiphop-boom': {
            name: 'Boom Bap',
            bpm: 92,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0],
                snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                hihat:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                ohihat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
                clap:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
                ride:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
                bass:   [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
            }
        },

        'hiphop-trap': {
            name: 'Trap Beat',
            bpm: 140,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
                snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                hihat:  [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
                ohihat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
                clap:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                rim:    [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
                bass:   [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
            }
        },

        'hiphop-lofi': {
            name: 'Lo-Fi Chill',
            bpm: 85,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
                snare:  [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
                hihat:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                shaker: [1,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1],
                rim:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,1,0,0],
                pad:    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
                bass:   [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
            }
        },

        // =====================================================
        // ELECTRONIC
        // =====================================================

        'edm-house': {
            name: 'House',
            bpm: 124,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
                snare:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
                clap:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                hihat:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                ohihat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
                shaker: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
                bass:   [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
            }
        },

        'edm-techno': {
            name: 'Techno',
            bpm: 130,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
                hihat:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                clap:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                ride:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                rim:    [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
                perc:   [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
                bass:   [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,1],
                lead:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
            }
        },

        'edm-dubstep': {
            name: 'Dubstep',
            bpm: 140,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
                snare:  [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
                hihat:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                clap:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
                bass:   [1,0,0,1, 0,0,1,0, 0,0,0,0, 1,0,0,1],
                lead:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,1,0],
                nebula: [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            }
        },

        'edm-dnb': {
            name: 'Drum & Bass',
            bpm: 174,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
                snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
                hihat:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                ride:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
                bass:   [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
            }
        },

        'edm-trance': {
            name: 'Trance',
            bpm: 138,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
                clap:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                hihat:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                ohihat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
                ride:   [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
                pad:    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
                bass:   [1,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0],
                lead:   [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
            }
        },

        // =====================================================
        // WORLD & OTHER
        // =====================================================

        'reggaeton': {
            name: 'Reggaeton',
            bpm: 95,
            steps: 16,
            tracks: {
                kick:   [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
                snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                hihat:  [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
                clap:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                rim:    [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                bass:   [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0],
            }
        },

        'afrobeats': {
            name: 'Afrobeats',
            bpm: 108,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
                snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                hihat:  [1,0,1,1, 0,0,1,0, 1,0,1,1, 0,0,1,0],
                shaker: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
                perc:   [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
                cowbell: [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
                tom_hi: [0,0,1,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
                bass:   [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,1],
            }
        },

        'rock': {
            name: 'Rock',
            bpm: 120,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
                snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                hihat:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                crash:  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
                ride:   [0,0,0,0, 0,0,0,0, 1,0,1,0, 1,0,1,0],
                bass:   [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0],
            }
        },

        'jazz': {
            name: 'Jazz Swing',
            bpm: 110,
            steps: 16,
            tracks: {
                kick:   [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
                snare:  [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
                ride:   [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
                hihat:  [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
                bass:   [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,1,0,0],
                pad:    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            }
        },
    };

    function getPreset(id) {
        return PRESETS[id] || null;
    }

    function getPresetList() {
        return Object.keys(PRESETS).map(id => ({
            id,
            name: PRESETS[id].name,
            bpm: PRESETS[id].bpm,
        }));
    }

    function loadPreset(id, sequencer) {
        const preset = PRESETS[id];
        if (!preset) return false;

        sequencer.setBPM(preset.bpm);

        if (preset.steps && preset.steps !== sequencer.getSteps()) {
            sequencer.setSteps(preset.steps);
        }

        // Clear current pattern
        sequencer.clearPattern();

        // Load preset tracks into pattern
        const currentPattern = sequencer.getPattern();
        Object.keys(preset.tracks).forEach(trackId => {
            if (currentPattern[trackId] !== undefined) {
                const steps = preset.tracks[trackId];
                for (let i = 0; i < steps.length && i < sequencer.getSteps(); i++) {
                    sequencer.setStep(trackId, i, steps[i]);
                }
            }
        });

        return true;
    }

    return {
        getPreset,
        getPresetList,
        loadPreset,
        PRESETS,
    };
})();
