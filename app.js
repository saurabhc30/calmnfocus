/* Calm & Focus – tools logic */
(function () {
    // Helper DOM & Storage Selectors
    var $ = function (selector) { return document.querySelector(selector); };
    var $$ = function (selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); };
    var store = {
        get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
        del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
    };

    var TABS = ['reflex', 'focus', 'breathe', 'relief', 'sound', 'brain', 'bubbles', 'ground'];
    var URLS = { "reflex": "index.html#reflex", "focus": "index.html#focus", "breathe": "index.html#breathe", "relief": "index.html#relief", "sound": "index.html#sound", "brain": "index.html#brain", "bubbles": "index.html#bubbles", "ground": "index.html#ground" };
    var NAMES = { reflex: 'Reaction Time Test', focus: 'Schulte Table Focus Trainer', breathe: 'Guided Breathing Exercises', relief: 'Stress Relief & Thought Shredder', sound: 'Relaxing Sounds & Binaural Beats', brain: 'Brain Training Games', bubbles: 'Virtual Bubble Wrap Popper', ground: '5-4-3-2-1 Grounding Exercise' };

    function stopBreathSession() {
        breathRunning = false;
        clearTimeout(breathTimer);
        var orb = $('#breathing-orb');
        if (orb) {
            orb.style.transitionDuration = '1s';
            orb.style.transform = 'scale(0.6)';
            orb.textContent = 'Ready';
        }
        var btn = $('#breath-toggle');
        if (btn) btn.textContent = 'Start Breathing Session';
    }

    function keyFromPath() {
        var k = location.hash.replace('#', '');
        return TABS.indexOf(k) > -1 ? k : null;
    }

    function applyRoute(key, scrollTop, userNav) {
        var t = TABS.indexOf(key) > -1 ? key : 'reflex';
        $$('section.tool-container').forEach(function (s) { s.classList.toggle('active', s.id === 't-' + t); });
        $$('#main-tabs button').forEach(function (btn) {
            var on = btn.dataset.t === t;
            btn.setAttribute('aria-selected', on);
            if (on && btn.scrollIntoView) { try { btn.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) { } }
        });
        if (t !== 'breathe') stopBreathSession();
        if (userNav) {
            document.title = NAMES[t] + ' – Calm & Focus';
            var h = $('h1.main-heading'); if (h) h.textContent = NAMES[t];
        }
        if (scrollTop) window.scrollTo(0, 0);
    }

    $$('#main-tabs button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var t = btn.dataset.t;
            try { history.pushState({ t: t }, '', URLS[t]); } catch (e) { try { location.hash = t; } catch (e2) { } }
            applyRoute(t, true, true);
        });
    });
    window.addEventListener('popstate', function () { applyRoute(keyFromPath() || location.hash.replace('#', ''), true, true); });
    window.addEventListener('hashchange', function () { applyRoute(location.hash.replace('#', ''), true, true); });

    /* --- 1. REFLEX TIMER LOGIC --- */
    var reflexState = 'idle', reflexTimeout, reflexStartTime;
    var reflexTimes = [], reflexBest = +store.get('cnf-reflex-best') || 0;
    var reflexPad = $('#reflex-pad');

    function updateReflexStats() {
        $('#stat-best').textContent = reflexBest ? reflexBest + 'ms' : '–';
        if (reflexTimes.length) {
            var avg = Math.round(reflexTimes.reduce(function (a, b) { return a + b; }, 0) / reflexTimes.length);
            $('#stat-avg').textContent = avg + 'ms';
        } else {
            $('#stat-avg').textContent = '–';
        }
    }

    reflexPad.addEventListener('click', function () {
        if (reflexState === 'idle') {
            reflexState = 'waiting';
            reflexPad.className = 'waiting';
            reflexPad.textContent = 'Wait for Green Signal…';
            reflexTimeout = setTimeout(function () {
                reflexState = 'go';
                reflexPad.className = 'go';
                reflexPad.textContent = 'PRESS NOW!';
                reflexStartTime = performance.now();
            }, 1500 + Math.random() * 2500);
        } else if (reflexState === 'waiting') {
            clearTimeout(reflexTimeout);
            reflexState = 'idle';
            reflexPad.className = '';
            reflexPad.textContent = 'Too early! Click to try again.';
        } else if (reflexState === 'go') {
            var elapsed = Math.round(performance.now() - reflexStartTime);
            reflexState = 'idle';
            reflexPad.className = '';
            reflexPad.textContent = elapsed + ' ms! Click to repeat.';
            $('#stat-last').textContent = elapsed + 'ms';
            if (window.cnfScore) cnfScore('reflex', elapsed);
            reflexTimes.push(elapsed);
            if (reflexTimes.length > 10) reflexTimes.shift();
            if (!reflexBest || elapsed < reflexBest) {
                reflexBest = elapsed;
                store.set('cnf-reflex-best', elapsed);
            }
            updateReflexStats();
        }
    });

    $('#reset-reflex').addEventListener('click', function () {
        reflexTimes = [];
        reflexBest = 0;
        store.del('cnf-reflex-best');
        $('#stat-last').textContent = '–';
        updateReflexStats();
        clearTimeout(reflexTimeout);
        reflexState = 'idle';
        reflexPad.className = '';
        reflexPad.textContent = 'Click Here to Start Test';
    });
    updateReflexStats();

    /* --- 2. SCHULTE FOCUS GRID LOGIC --- */
    var schulteTarget = 1, schulteTimer = null, schulteElapsed = 0;
    var schulteBest = +store.get('cnf-schulte-best') || 0;

    if (schulteBest) $('#schulte-best').textContent = (schulteBest / 1000).toFixed(1) + 's';

    function initSchulteGrid() {
        clearInterval(schulteTimer);
        schulteTimer = null;
        schulteTarget = 1;
        schulteElapsed = 0;
        $('#schulte-next').textContent = '1';
        $('#schulte-time').textContent = '0.0s';

        var nums = [];
        for (var i = 1; i <= 25; i++) nums.push(i);
        nums.sort(function () { return Math.random() - 0.5; });

        var board = $('#schulte-board');
        board.innerHTML = '';

        nums.forEach(function (num) {
            var cell = document.createElement('button');
            cell.className = 'schulte-cell';
            cell.textContent = num;
            cell.addEventListener('click', function () {
                if (num === schulteTarget) {
                    if (schulteTarget === 1) {
                        var startTime = Date.now();
                        schulteTimer = setInterval(function () {
                            schulteElapsed = Date.now() - startTime;
                            $('#schulte-time').textContent = (schulteElapsed / 1000).toFixed(1) + 's';
                        }, 100);
                    }
                    schulteTarget++;
                    $('#schulte-next').textContent = schulteTarget <= 25 ? schulteTarget : 'Complete!';
                    cell.style.opacity = '0.25';
                    cell.style.pointerEvents = 'none';

                    if (schulteTarget > 25) {
                        clearInterval(schulteTimer);
                        if (window.cnfScore) cnfScore('schulte', schulteElapsed);
                        if (!schulteBest || schulteElapsed < schulteBest) {
                            schulteBest = schulteElapsed;
                            store.set('cnf-schulte-best', schulteElapsed);
                            $('#schulte-best').textContent = (schulteElapsed / 1000).toFixed(1) + 's';
                        }
                    }
                }
            });
            board.appendChild(cell);
        });
    }

    $('#schulte-reset').addEventListener('click', initSchulteGrid);
    initSchulteGrid();

    /* --- 3. GUIDED BREATHING ENGINE --- */
    var breathPatterns = {
        box: [['Breathe In', 4, 1], ['Hold Breath', 4, 1], ['Breathe Out', 4, 0.6], ['Hold', 4, 0.6]],
        '478': [['Breathe In', 4, 1], ['Hold Breath', 7, 1], ['Exhale Slow', 8, 0.6]],
        calm: [['Breathe In', 5, 1], ['Breathe Out', 5, 0.6]]
    };
    var activePattern = 'box', breathTimer = null, breathRunning = false;
    var breathingOrb = $('#breathing-orb');

    function runBreathStep(index) {
        if (!breathRunning) return;
        var seq = breathPatterns[activePattern];
        var step = seq[index % seq.length];
        breathingOrb.textContent = step[0];
        breathingOrb.style.transitionDuration = step[1] + 's';
        breathingOrb.style.transform = 'scale(' + step[2] + ')';
        breathTimer = setTimeout(function () {
            runBreathStep(index + 1);
        }, step[1] * 1000);
    }

    function startBreathSession() {
        breathRunning = true;
        $('#breath-toggle').textContent = 'Stop Breathing Session';
        runBreathStep(0);
    }

    $('#breath-toggle').addEventListener('click', function () {
        breathRunning ? stopBreathSession() : startBreathSession();
    });

    $$('#breath-patterns button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            activePattern = btn.dataset.p;
            $$('#breath-patterns button').forEach(function (b) {
                b.setAttribute('aria-pressed', b === btn);
            });
            if (breathRunning) {
                stopBreathSession();
                startBreathSession();
            }
        });
    });

    /* --- 4. STRESS RELIEF & THOUGHT SHREDDER --- */
    var stressTasks = [
        'Unclench your jaw and drop shoulders away from your ears.',
        'Drink a glass of cold water mindfully.',
        'Stretch both arms overhead for 10 seconds.',
        'Tense your hands into fists for 5 seconds, then release.',
        'Look out a window at a distant object for 20 seconds.',
        'Take three deep exhales emptying your lungs completely.',
        'Stand up and walk slowly for one minute.',
        'Acknowledge one anxiety you will set aside for tomorrow.'
    ];

    var taskContainer = $('#stress-tasks');
    stressTasks.forEach(function (taskText) {
        var li = document.createElement('li');
        li.innerHTML = '<label><input type="checkbox"><span></span></label>';
        li.querySelector('span').textContent = taskText;
        li.querySelector('input').addEventListener('change', function () {
            var checkedCount = $$('#stress-tasks input:checked').length;
            $('#task-progress').textContent = checkedCount + ' of ' + stressTasks.length + ' completed';
        });
        taskContainer.appendChild(li);
    });

    $('#shred-btn').addEventListener('click', function () {
        var input = $('#thought-input');
        if (!input.value.trim()) {
            $('#shred-status').textContent = 'Please type a thought first.';
            return;
        }
        input.classList.add('shredding');
        $('#shred-status').textContent = '';
        setTimeout(function () {
            input.value = '';
            input.classList.remove('shredding');
            $('#shred-status').textContent = 'Thought shredded! Take one slow exhale.';
        }, 2100);
    });

    /* --- 5. BROWSER WEB AUDIO SYNTHESIZER --- */
    var audioCtx = null, masterGain = null, activeAudioSources = {};

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = ($('#master-vol').value / 100) * 0.6;
            masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function generateNoiseBuffer(ctx, soundKey) {
        var bufferSize = ctx.sampleRate * 3;
        var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        var output = buffer.getChannelData(0);
        var lastOut = 0.0;
        for (var i = 0; i < bufferSize; i++) {
            var white = Math.random() * 2 - 1;
            if (soundKey === 'hum' || soundKey === 'ocean') {
                lastOut = (lastOut + 0.02 * white) / 1.02;
                output[i] = lastOut * 3.5;
            } else {
                output[i] = white;
            }
        }
        var src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        return src;
    }

    function playSyntheticTone(freq, duration, vol) {
        var ctx = getAudioContext();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var now = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + duration + 0.1);
    }

    function scheduleLoop(fn, minMs, maxMs) {
        var timer, active = true;
        (function loop() {
            if (!active) return;
            fn();
            timer = setTimeout(loop, minMs + Math.random() * (maxMs - minMs));
        })();
        return function () { active = false; clearTimeout(timer); };
    }

    function createAudioStream(soundKey) {
        var ctx = getAudioContext();
        var cleanups = [];

        if (soundKey === 'chimes') {
            var scale = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3];
            return scheduleLoop(function () {
                playSyntheticTone(scale[Math.floor(Math.random() * scale.length)], 4.5, 0.15);
            }, 2000, 5000);
        }
        if (soundKey === 'bowl') {
            return scheduleLoop(function () {
                [220, 607, 1188].forEach(function (f, i) {
                    playSyntheticTone(f, 9 - i * 2, 0.2 / (i + 1));
                });
            }, 8000, 11000);
        }
        if (soundKey === 'binaural') {
            var oscL = ctx.createOscillator(), oscR = ctx.createOscillator();
            var g = ctx.createGain();
            oscL.frequency.value = 200;
            oscR.frequency.value = 210; // 10Hz Alpha difference
            g.gain.value = 0.15;
            oscL.connect(g); oscR.connect(g); g.connect(masterGain);
            oscL.start(); oscR.start();
            return function () { oscL.stop(); oscR.stop(); g.disconnect(); };
        }
        if (soundKey === 'pad') {
            [110, 164.8, 220, 277.2].forEach(function (f) {
                var osc = ctx.createOscillator(), g = ctx.createGain();
                osc.frequency.value = f;
                g.gain.value = 0.04;
                osc.connect(g); g.connect(masterGain);
                osc.start();
                cleanups.push(function () { osc.stop(); g.disconnect(); });
            });
            return function () { cleanups.forEach(function (c) { c(); }); };
        }
        if (soundKey === 'fire') {
            return scheduleLoop(function () {
                playSyntheticTone(150 + Math.random() * 800, 0.04, 0.08);
            }, 80, 250);
        }

        var filter = ctx.createBiquadFilter();
        var gainNode = ctx.createGain();
        var noiseSrc = generateNoiseBuffer(ctx, soundKey);

        if (soundKey === 'rain') { filter.type = 'highpass'; filter.frequency.value = 1300; gainNode.gain.value = 0.35; }
        if (soundKey === 'wind') { filter.type = 'bandpass'; filter.frequency.value = 480; gainNode.gain.value = 0.3; }
        if (soundKey === 'ocean') { filter.type = 'lowpass'; filter.frequency.value = 550; gainNode.gain.value = 0.5; }
        if (soundKey === 'hum') { filter.type = 'lowpass'; filter.frequency.value = 140; gainNode.gain.value = 1.1; }
        if (soundKey === 'stream') { filter.type = 'bandpass'; filter.frequency.value = 950; gainNode.gain.value = 0.35; }
        if (soundKey === 'thunder') { filter.type = 'lowpass'; filter.frequency.value = 80; gainNode.gain.value = 1.2; }

        noiseSrc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);
        noiseSrc.start();

        return function () { noiseSrc.stop(); gainNode.disconnect(); };
    }

    function toggleAudioStream(soundKey, forceState) {
        var btn = $('#sound-cards [data-s="' + soundKey + '"]');
        if (!btn) return;

        var isRunning = !!activeAudioSources[soundKey];
        var shouldRun = forceState !== undefined ? forceState : !isRunning;

        if (shouldRun && !isRunning) {
            try {
                activeAudioSources[soundKey] = createAudioStream(soundKey);
                btn.setAttribute('aria-pressed', 'true');
            } catch (e) { }
        } else if (!shouldRun && isRunning) {
            activeAudioSources[soundKey]();
            delete activeAudioSources[soundKey];
            btn.setAttribute('aria-pressed', 'false');
        }
    }

    $$('#sound-cards button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            toggleAudioStream(btn.dataset.s);
        });
    });

    $('#master-vol').addEventListener('input', function (e) {
        if (masterGain) masterGain.gain.value = (e.target.value / 100) * 0.6;
    });

    $$('#sound-presets button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            Object.keys(activeAudioSources).forEach(function (k) { toggleAudioStream(k, false); });
            btn.dataset.pr.split(',').forEach(function (k) { toggleAudioStream(k, true); });
        });
    });

    $('#stop-sounds').addEventListener('click', function () {
        Object.keys(activeAudioSources).forEach(function (k) { toggleAudioStream(k, false); });
    });

    /* --- 6. BRAIN TRAINING GAMES LOGIC --- */
    /* In-page result dialog (replaces alert()). window.cnfModal({icon, title, big, text, actions:[{label, primary, run}]}) */
    (function () {
        var css = '.cnf-modal{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,16,28,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .18s}' +
            '.cnf-modal.show{opacity:1}' +
            '.cnf-modal-card{width:min(360px,100%);box-sizing:border-box;background:var(--surface-card,#fff);color:var(--ink,#1c273b);border:1.5px solid var(--line,#d9dee7);border-radius:20px;padding:26px 24px 22px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.3);transform:translateY(12px) scale(.97);transition:transform .2s}' +
            '.cnf-modal.show .cnf-modal-card{transform:none}' +
            '.cnf-modal-icon{font-size:2.3rem;line-height:1}' +
            '.cnf-modal-card h3{margin:10px 0 6px;font-size:1.3rem}' +
            '.cnf-modal-big{margin:4px 0 6px;font-size:1.9rem;font-weight:800;letter-spacing:.14em;color:var(--sea,#3a8a77);word-break:break-all}' +
            '.cnf-modal-card p{margin:0 0 20px;color:var(--muted,#667085);line-height:1.5}' +
            '.cnf-modal-card .btn-row{justify-content:center;margin-top:0}' +
            '@media (prefers-reduced-motion:reduce){.cnf-modal,.cnf-modal-card{transition:none}}';
        var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

        var box = null, prevFocus = null, keyH = null;
        function close() {
            if (!box) return;
            var b = box; box = null;
            document.removeEventListener('keydown', keyH, true);
            b.classList.remove('show');
            setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 180);
            if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) { } }
        }
        window.cnfModal = function (o) {
            close();
            prevFocus = document.activeElement;
            box = document.createElement('div');
            box.className = 'cnf-modal';
            var card = document.createElement('div');
            card.className = 'cnf-modal-card';
            card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-label', o.title || 'Result');
            var html = '';
            if (o.icon) html += '<div class="cnf-modal-icon" aria-hidden="true">' + o.icon + '</div>';
            html += '<h3></h3>';
            if (o.big) html += '<div class="cnf-modal-big"></div>';
            if (o.text) html += '<p></p>';
            html += '<div class="btn-row"></div>';
            card.innerHTML = html;
            card.querySelector('h3').textContent = o.title || '';
            if (o.big) card.querySelector('.cnf-modal-big').textContent = o.big;
            if (o.text) card.querySelector('p').textContent = o.text;
            var row = card.querySelector('.btn-row'), primary = null;
            (o.actions && o.actions.length ? o.actions : [{ label: 'OK', primary: true }]).forEach(function (a) {
                var b = document.createElement('button');
                b.type = 'button'; b.className = a.primary ? 'btn' : 'btn ghost'; b.textContent = a.label;
                b.addEventListener('click', function () { close(); if (a.run) a.run(); });
                if (a.primary && !primary) primary = b;
                row.appendChild(b);
            });
            box.appendChild(card);
            box.addEventListener('mousedown', function (e) { if (e.target === box) close(); });
            keyH = function (e) {
                if (e.key === 'Escape') { e.stopPropagation(); close(); }
                else if (e.key === 'Tab') {   // keep focus inside the dialog
                    var f = card.querySelectorAll('button'); if (!f.length) return;
                    var first = f[0], last = f[f.length - 1];
                    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
                }
            };
            document.addEventListener('keydown', keyH, true);
            document.body.appendChild(box);
            var shown = box; requestAnimationFrame(function () { shown.classList.add('show'); });
            (primary || row.querySelector('button')).focus();
        };
    })();

    // Game Sub-tabs Switcher
    $$('#brain-game-tabs button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            $$('#brain-game-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b === btn); });
            $$('.brain-game-container').forEach(function (c) { c.classList.toggle('active', c.id === 'g-' + btn.dataset.g); });
        });
    });

    // Game A: Sequence Memory (Simon-style)
    var seqPattern = [], seqStep = 0;
    var seqPads = $$('.seq-pad');

    function flashPad(index, cb) {
        if (!seqPads[index]) return;
        seqPads[index].classList.add('lit');
        playBubblePopSound();
        setTimeout(function () {
            seqPads[index].classList.remove('lit');
            if (cb) setTimeout(cb, 150);
        }, 300);
    }

    function playSeqPattern() {
        var i = 0;
        function next() {
            if (i < seqPattern.length) {
                flashPad(seqPattern[i], function () { i++; next(); });
            }
        }
        next();
    }

    $('#seq-start').addEventListener('click', function () {
        seqPattern = [Math.floor(Math.random() * 9)];
        seqStep = 0;
        $('#seq-level').textContent = seqPattern.length;
        playSeqPattern();
    });

    seqPads.forEach(function (pad) {
        pad.addEventListener('click', function () {
            if (!seqPattern.length) return;
            var clicked = +pad.dataset.i;
            if (clicked === seqPattern[seqStep]) {
                flashPad(clicked);
                seqStep++;
                if (seqStep >= seqPattern.length) {
                    seqPattern.push(Math.floor(Math.random() * 9));
                    $('#seq-level').textContent = seqPattern.length;
                    seqStep = 0;
                    setTimeout(playSeqPattern, 800);
                }
            } else {
                if (window.cnfScore) cnfScore('seq', seqPattern.length);
                var reached = seqPattern.length;
                seqPattern = [];
                $('#seq-level').textContent = '1';
                window.cnfModal({
                    icon: '🧠', title: 'Wrong sequence', big: 'Level ' + reached,
                    text: 'That was the highest level you reached this round.',
                    actions: [
                        { label: 'Play again', primary: true, run: function () { $('#seq-start').click(); } },
                        { label: 'Close' }
                    ]
                });
            }
        });
    });

    // Game B: Stroop Color Focus
    var colors = ['red', 'blue', 'green', 'yellow'];
    var colorMap = { red: '#f87171', blue: '#60a5fa', green: '#4ade80', yellow: '#facc15' };
    var stroopWordColor = '', stroopScore = 0, stroopBest = +store.get('cnf-stroop-best') || 0;

    $('#stroop-best').textContent = stroopBest;

    function nextStroop() {
        var text = colors[Math.floor(Math.random() * colors.length)];
        stroopWordColor = colors[Math.floor(Math.random() * colors.length)];
        var el = $('#stroop-word');
        el.textContent = text.toUpperCase();
        el.style.color = colorMap[stroopWordColor];
    }

    $$('#stroop-buttons button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (btn.dataset.color === stroopWordColor) {
                stroopScore++;
                $('#stroop-score').textContent = stroopScore;
                if (window.cnfScore) cnfScore('stroop', stroopScore);
                if (stroopScore > stroopBest) {
                    stroopBest = stroopScore;
                    store.set('cnf-stroop-best', stroopBest);
                    $('#stroop-best').textContent = stroopBest;
                }
                nextStroop();
            } else {
                stroopScore = 0;
                $('#stroop-score').textContent = '0';
                nextStroop();
            }
        });
    });
    nextStroop();

    // Game C: Number Span Memory
    // Each round is manual: after a result the player chooses when the next level starts.
    var numCurrent = '', numLen = 3, numReady = false, numTimer = null;

    function startNumRound() {
        clearTimeout(numTimer);
        numReady = false;
        numCurrent = '';
        for (var i = 0; i < numLen; i++) numCurrent += Math.floor(Math.random() * 10);
        $('#num-display').textContent = numCurrent;
        $('#num-input').value = '';
        $('#num-input').disabled = true;
        $('#num-start').style.display = 'none';
        $('#num-submit').style.display = 'none';

        numTimer = setTimeout(function () {
            $('#num-display').textContent = '???';
            $('#num-input').disabled = false;
            $('#num-input').focus();
            $('#num-submit').style.display = 'inline-flex';
            numReady = true;
        }, 2000);
    }

    function endNumRound(label) {
        numReady = false;
        $('#num-input').disabled = true;
        $('#num-submit').style.display = 'none';
        $('#num-start').textContent = label;
        $('#num-start').style.display = 'inline-flex';
    }

    function submitNum() {
        if (!numReady) return;
        var ans = $('#num-input').value.trim();
        var shown = numCurrent;
        $('#num-display').textContent = shown;
        if (ans === shown) {
            if (window.cnfScore) cnfScore('num', numLen);
            numLen++;
            $('#num-len').textContent = numLen;
            endNumRound('Start level ' + numLen);
            window.cnfModal({
                icon: '✅', title: 'Correct', big: shown,
                text: 'Next level has ' + numLen + ' digits. Start whenever you are ready.',
                actions: [
                    { label: 'Start level ' + numLen, primary: true, run: startNumRound },
                    { label: 'Not yet' }
                ]
            });
        } else {
            numLen = 3;
            $('#num-len').textContent = numLen;
            endNumRound('Begin Test');
            window.cnfModal({
                icon: '💭', title: 'Not quite', big: shown,
                text: ans ? 'You typed ' + ans + '. Back to 3 digits.' : 'No answer entered. Back to 3 digits.',
                actions: [
                    { label: 'Try again', primary: true, run: startNumRound },
                    { label: 'Close' }
                ]
            });
        }
    }

    $('#num-start').addEventListener('click', startNumRound);
    $('#num-submit').addEventListener('click', submitNum);
    $('#num-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submitNum(); } });

    /* --- 7. BUBBLE WRAP LOGIC --- */
    var totalPopped = 0, remainingBubbles = 0;
    var bubbleGrid = $('#bubble-board');

    function playBubblePopSound() {
        try {
            var ctx = getAudioContext();
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            var now = ctx.currentTime;
            osc.frequency.setValueAtTime(400 + Math.random() * 300, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
            g.gain.setValueAtTime(0.25, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(g); g.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.11);
        } catch (e) { }
    }

    function populateBubbleGrid() {
        bubbleGrid.innerHTML = '';
        remainingBubbles = 24;
        for (var i = 0; i < 24; i++) {
            (function () {
                var b = document.createElement('button');
                b.className = 'bubble-btn';
                b.setAttribute('aria-label', 'Pop bubble');
                b.addEventListener('click', function () {
                    if (b.classList.contains('popped')) return;
                    b.classList.add('popped');
                    playBubblePopSound();
                    totalPopped++;
                    remainingBubbles--;
                    $('#popped-count').textContent = 'Total Popped: ' + totalPopped;
                    if (remainingBubbles === 0) {
                        setTimeout(populateBubbleGrid, 400);
                    }
                });
                bubbleGrid.appendChild(b);
            })();
        }
    }
    populateBubbleGrid();

    /* --- 8. MIND REFRESH 5-4-3-2-1 GROUNDING --- */
    var groundingSteps = [
        ['Acknowledge 5 things you can see around you.', 'Look for subtle details, shadows, or textures.'],
        ['Acknowledge 4 things you can physically touch.', 'Feel your seat back, keyboard keys, or clothing texture.'],
        ['Acknowledge 3 distinct sounds you can hear.', 'Listen carefully for ambient room noise or distant wind.'],
        ['Acknowledge 2 things you can smell right now.', 'Take a gentle breath in.'],
        ['Acknowledge 1 thing you can taste.', 'Notice your palate or take a slow sip of water.']
    ];
    var groundIndex = -1;

    $('#ground-btn').addEventListener('click', function () {
        groundIndex++;
        if (groundIndex >= 0 && groundIndex < groundingSteps.length) {
            $('#ground-card').textContent = groundingSteps[groundIndex][0];
            $('#ground-sub').textContent = groundingSteps[groundIndex][1];
            $('#ground-btn').textContent = groundIndex < groundingSteps.length - 1 ? 'Next Step' : 'Complete Reset';
        } else {
            $('#ground-card').textContent = 'You are anchored in the present moment.';
            $('#ground-sub').textContent = 'Take one slow exhale before returning to your day.';
            $('#ground-btn').textContent = 'Start Over';
            groundIndex = -1;
        }
    });

    // Initial Route Execution
    applyRoute(keyFromPath() || document.body.dataset.tool, false, !!keyFromPath());
})();