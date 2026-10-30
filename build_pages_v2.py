#!/usr/bin/env python3
"""
Calm & Focus – build one real page per tool/game from the single-page index.html.

  python3 build_pages_v2.py  original_index.html  site

Output: index.html (hub), 14 tool pages, sitemap.xml
Bundled tabs are split: Brain Training -> 3 pages, Mindful Games -> 2 pages, Stress Relief -> 2 pages.
The other games stay in each page's DOM (hidden) so app.js / cnf.js keep finding the element ids they expect.
"""
import re, sys, json, pathlib

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
OUT = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "site")
OUT.mkdir(parents=True, exist_ok=True)
BASE = "https://calmnfocus.site"
NOTE = ('<p class="note">Calm &amp; Focus tools are for relaxation and self-awareness, not medical diagnosis or '
        'treatment.</p>')
NOTE_SAFETY = ('<p class="note">Calm &amp; Focus tools are for relaxation and self-awareness, not medical diagnosis or '
               'treatment. If you feel unsafe or overwhelmed, please contact a mental health professional or local '
               'emergency services.</p>')

# ----------------------------------------------------------------------------------------------
# Page definitions. 'base' = id of the original section. 'sub' = which part to show (None = whole).
# 'article' = new article HTML (None = keep the original article).
# ----------------------------------------------------------------------------------------------
P = {}
def page(key, **kw): P[key] = kw

page("reflex", base="reflex", group="Focus & productivity", slug="reaction-time-test.html", name="Reaction Time Test",
     label="⚡ Reflex Timer", cat="HealthApplication", rel=["focus", "seq", "stroop"],
     title="Reaction Time Test – Free Online Visual Reflex Speed Test | Calm & Focus",
     desc="Free online reaction time test. Click when the pad turns green, see your speed in milliseconds and track your average and personal best. No signup.")
page("pomodoro", base="pomodoro", group="Focus & productivity", slug="zen-pomodoro-timer.html", name="Zen Pomodoro Timer",
     label="⏱️ Zen Pomodoro", cat="HealthApplication", rel=["focus", "breathe", "sound"],
     title="Zen Pomodoro Timer – Free 25-Minute Focus Timer Online | Calm & Focus",
     desc="Free online Pomodoro timer with 25-minute focus sessions, short breaks and a soft chime. Runs in your browser, no signup.")
page("focus", base="focus", group="Focus & productivity", slug="schulte-table.html", name="Schulte Table Trainer",
     label="🎯 Schulte Grid", cat="HealthApplication", rel=["pomodoro", "reflex", "seq"],
     title="Schulte Table Online – Free 5×5 Focus & Visual Scanning Trainer | Calm & Focus",
     desc="Play the Schulte table online: find numbers 1–25 in order to train focus, visual scanning and peripheral awareness. Free, no signup.")

page("breathe", base="breathe", group="Calm & relax", slug="breathing-exercises.html", name="Guided Breathing",
     label="🫁 Breathe", cat="HealthApplication", rel=["ground", "sound", "shredder"],
     title="Guided Breathing Exercises – Box, 4-7-8 & 5-5 Breathing Online | Calm & Focus",
     desc="Free guided breathing exercises with a smooth expanding orb. Try box breathing, 4-7-8 or 5-5 breathing for a calmer minute. No signup.")
page("ground", base="ground", group="Calm & relax", slug="5-4-3-2-1-grounding-exercise.html", name="5-4-3-2-1 Grounding",
     label="🌱 Mind Refresh", cat="HealthApplication", rel=["breathe", "shredder", "tasks"],
     title="5-4-3-2-1 Grounding Exercise – Guided Sensory Reset | Calm & Focus",
     desc="A guided 5-4-3-2-1 grounding exercise to bring attention back to the present moment. Free, private, no signup.")
page("sound", base="sound", group="Calm & relax", slug="relaxing-sounds.html", name="Relaxing Sounds & Binaural Beats",
     label="🎧 Relaxing Sounds", cat="HealthApplication", rel=["breathe", "pomodoro", "sand"],
     title="Relaxing Sounds & Binaural Beats – Rain, Ocean, 10Hz Alpha | Calm & Focus",
     desc="Mix rain, ocean waves, chimes, singing bowl and a 10Hz binaural tone, synthesized live in your browser. Free, no download.")

page("shredder", base="relief", sub="shredder", group="Calm & relax", slug="thought-shredder.html", name="Thought Shredder",
     label="💭 Thought Shredder", cat="HealthApplication", rel=["breathe", "tasks", "ground"],
     title="Thought Shredder – Write a Worry and Let It Go, Free & Private | Calm & Focus",
     desc="Type the thought that keeps looping, then shred it. A free, private online thought shredder – nothing you write is saved or sent.",
     h1="Thought Shredder: Write the Worry, Then Let It Go",
     sub_text="Type a persistent worry or intrusive thought, then shred it into a blur. Nothing is stored or sent anywhere.",
     card="Type the worry that keeps looping, shred it and let it dissolve. Private and instant.",
     hint="About the thought shredder",
     article="""
<h2>Thought Shredder: Why Writing a Worry Down Can Help</h2>
<p>A worry that loops in your head takes up space. Typing it out moves it from your working memory onto the screen, which is a form of cognitive offloading. The shredder adds a small ritual on top: you write the thought, then watch it blur away.</p>
<h3>How to use it</h3>
<ol>
<li>Type the thought that keeps coming back. Be specific: “the presentation on Friday” is easier to release than “everything”.</li>
<li>Press “Shred &amp; Release Thought” and watch it dissolve.</li>
<li>Take one slow breath, then write down one small next step if there is one you can actually take today.</li>
</ol>
<h3>What the research says</h3>
<p>Psychologist James Pennebaker studied expressive writing for decades and linked it with better emotional processing. A 2013 study in <em>Psychological Science</em> also found that physically discarding written thoughts reduced how much people were influenced by them, which is the idea behind this tool. These are small, general effects and not a treatment for anxiety.</p>
<h3>Good times to use it</h3>
<ul>
<li>At the end of the workday, to separate work from rest.</li>
<li>Before bed, when thoughts get louder.</li>
<li>Before a stressful meeting or exam, to clear mental clutter.</li>
</ul>
<h3>Privacy</h3>
<p>What you type stays in your browser. It is not sent to a server and it disappears when you shred it or leave the page.</p>
<h3>Common questions</h3>
<details class="faq-item"><summary>Does shredding thoughts really help?</summary><p>Many people find it gives a sense of closure. It is a coping aid, not a cure, and it does not replace support if you are struggling.</p></details>
<details class="faq-item"><summary>Is anything saved?</summary><p>No. Nothing you type in the shredder is transmitted or stored.</p></details>
<details class="faq-item"><summary>What if the same thought keeps returning?</summary><p>That is common. Shred it again, try a breathing exercise, or talk it through with someone you trust.</p></details>
""", note=NOTE_SAFETY)

page("tasks", base="relief", sub="tasks", group="Calm & relax", slug="stress-relief-tasks.html", name="Stress Relief Tasks",
     label="🧘 Stress Tasks", cat="HealthApplication", rel=["breathe", "shredder", "ground"],
     title="Quick Stress Relief Tasks – Small Resets for a Tense Moment | Calm & Focus",
     desc="A short checklist of small stress relief actions you can do at your desk in a couple of minutes. Free, no signup.",
     h1="Quick Stress Relief Tasks: Small Resets for a Tense Moment",
     sub_text="Work through a short checklist of tiny physical actions and tick each one off.",
     card="A short checklist of tiny physical resets you can do at your desk in two minutes.",
     hint="About the stress relief tasks",
     article="""
<h2>Stress Relief Tasks: Why Tiny Actions Work When Big Solutions Don’t</h2>
<p>When stress builds, big solutions feel out of reach. A short checklist of tiny, physical actions is easier to start, and each tick gives a small sense of progress. The list above has eight tasks and a counter that shows how many you have finished.</p>
<h3>A two-minute routine</h3>
<ol>
<li>Stop what you are doing and put your feet flat on the floor.</li>
<li>Work down the checklist and tick each task as you finish it.</li>
<li>Finish with one slow breath out, then go back to your work.</li>
</ol>
<h3>What counts as a micro-reset</h3>
<p>Resets of this kind are small and physical: unclenching your jaw, dropping your shoulders, stretching your neck or wrists, drinking water, or looking away from the screen. They are not meant to solve the cause of stress. They interrupt the tension for a moment so that you can think more clearly afterwards.</p>
<h3>Pair it with something else</h3>
<ul>
<li>Follow the checklist with a short breathing session if your heart is racing.</li>
<li>Use the thought shredder if one specific worry is the problem.</li>
<li>Try the 5-4-3-2-1 grounding exercise if your thoughts are spinning.</li>
</ul>
<h3>When a checklist is not enough</h3>
<p>If stress feels constant or overwhelming, talk to someone you trust or a health professional. Small resets are for ordinary tense moments, not a substitute for support.</p>
<h3>Common questions</h3>
<details class="faq-item"><summary>How long does it take?</summary><p>Most people finish the list in a couple of minutes.</p></details>
<details class="faq-item"><summary>Is my progress saved?</summary><p>The checklist is a quick reset tool, so treat it as something to run through whenever you need it.</p></details>
<details class="faq-item"><summary>How often should I do it?</summary><p>As often as it helps. Many people use it between meetings or after a long stretch at a screen.</p></details>
""", note=NOTE_SAFETY)

page("pebbles", base="games", sub="pebbles", group="Games & fidget", slug="pebble-stacking-game.html", name="Pebble Stacking Game",
     label="🪨 Pebble Stacking", cat="GameApplication", rel=["sand", "bubbles", "reflex"],
     title="Pebble Stacking Game – Free Online Stone Balancing Game | Calm & Focus",
     desc="Free pebble stacking game: tap to drop the swinging stone and balance a tower as high as you can. Works on phone and desktop.",
     h1="Pebble Stacking Game: Balance a Tower, One Stone at a Time",
     sub_text="A stone swings overhead. Tap to drop it and land it near the middle of the stone below.",
     card="Tap to drop a swinging stone and stack a tower that keeps standing.",
     hint="About the pebble stacking game",
     article="""
<h2>Pebble Stacking: A Calm Game of Timing and Balance</h2>
<p>Stone balancing is an old pastime: people stack pebbles on beaches and trails into small towers. This game turns that into a quick, forgiving timing task. There is one thing to do, one thing to watch, and a restart button when it all falls over.</p>
<h3>How to play</h3>
<ol>
<li>Tap the game area (or press Space or Enter) to start. A stone swings from side to side above the tower.</li>
<li>Tap again to drop it. Try to land it close to the middle of the stone below.</li>
<li>A near-perfect landing snaps into place and shows “Perfect!”.</li>
<li>Land too far off to the side and the stone falls. The tower is over and you can stack again.</li>
</ol>
<p>The swing gets faster as your tower grows, so the game stays challenging without any timer. Your height is shown as Stones, and your best tower is saved on this device only.</p>
<h3>Tips for a taller tower</h3>
<ul>
<li>Watch the rhythm of the swing instead of chasing the stone with your eyes.</li>
<li>The stone takes a moment to fall, so tap slightly before it is above the middle.</li>
<li>Accept the fall. A failed tower costs two seconds and a tap to restart.</li>
</ul>
<h3>Why people find it calming</h3>
<p>A single focus, a steady rhythm and no punishment for failing make it an easy way to rest your attention for a couple of minutes. It is a pleasant break, not a treatment.</p>
<h3>Common questions</h3>
<details class="faq-item"><summary>Can I play with a keyboard?</summary><p>Yes. Space or Enter drops the stone, and a tap or click works as well.</p></details>
<details class="faq-item"><summary>Is my best score saved?</summary><p>Yes, on this device only. Clearing your browser data resets it.</p></details>
<details class="faq-item"><summary>Why does it get harder?</summary><p>The swing speeds up as the tower grows, up to a limit, so each stone needs a little more timing.</p></details>
""", note=NOTE)

page("sand", base="games", sub="sand", group="Games & fidget", slug="zen-sand-garden.html", name="Zen Sand Garden",
     label="🎨 Sand Garden", cat="GameApplication", rel=["pebbles", "breathe", "sound"],
     title="Zen Sand Garden Online – Draw Calm Patterns in Digital Sand | Calm & Focus",
     desc="A free online zen sand garden. Drag your finger or mouse to rake patterns in digital sand, then smooth it and start again.",
     h1="Zen Sand Garden: Draw Calm Patterns in Digital Sand",
     sub_text="Drag your finger or mouse across the sand to rake lines and patterns. No score, no timer.",
     card="Rake patterns in digital sand with your finger or mouse. No score and no timer.",
     hint="About the zen sand garden",
     article="""
<h2>Zen Sand Garden: Slow Drawing With No Goal</h2>
<p>Dry gardens of raked gravel (<em>karesansui</em>) are a feature of Japanese temple gardens such as Ryōan-ji in Kyoto, where lines in the gravel suggest water. This page is a simple digital sketch inspired by that idea. It is not a religious practice, just a quiet drawing surface.</p>
<h3>How to use it</h3>
<ol>
<li>Drag your finger or mouse across the sand to leave a groove.</li>
<li>Draw slowly. Parallel lines and wide circles look best.</li>
<li>Press “Smooth Sand” to wipe the surface and begin again.</li>
</ol>
<h3>Ideas to try</h3>
<ul>
<li>Fill the sand with parallel lines, then draw a circle around an imaginary rock.</li>
<li>Draw one stroke for each slow breath out.</li>
<li>Make spirals from the centre outward.</li>
<li>Finish a pattern, look at it, then smooth the sand as a way of closing the break.</li>
</ul>
<h3>Why a goal-free game</h3>
<p>Nothing is scored and nothing is saved, so there is nothing to win or lose. Slow, repetitive hand movements give your mind a simple thing to follow, which many people find a gentle way to pause between tasks.</p>
<h3>Common questions</h3>
<details class="faq-item"><summary>Does it work on a phone?</summary><p>Yes. Drag with your finger. The page does not scroll while you draw on the sand.</p></details>
<details class="faq-item"><summary>Can I save my drawing?</summary><p>Not at the moment. Take a screenshot if you want to keep it.</p></details>
<details class="faq-item"><summary>Is there a way to change the pattern size?</summary><p>Not yet. The grooves have a fixed width, so slow strokes and spacing do the work.</p></details>
""", note=NOTE)

page("bubbles", base="bubbles", group="Games & fidget", slug="bubble-wrap-popper.html", name="Bubble Wrap Popper",
     label="🫧 Pop Bubbles", cat="GameApplication", rel=["pebbles", "sand", "tasks"],
     title="Bubble Wrap Popper – Free Online Pop Bubbles Game with Sound | Calm & Focus",
     desc="Pop endless virtual bubble wrap with satisfying sound. A quick fidget break for restless hands. Free, works on mobile.")

page("seq", base="brain", sub="seq", group="Brain training", slug="sequence-memory-test.html", name="Sequence Memory Test",
     label="🧠 Sequence Memory", cat="GameApplication", rel=["num", "stroop", "focus"],
     title="Sequence Memory Test – Free Online Pattern Memory Game | Calm & Focus",
     desc="Free sequence memory game: watch the pads light up, repeat the pattern and see how many levels you can reach. Works on phone and desktop.",
     h1="Sequence Memory Test: How Long a Pattern Can You Hold?",
     sub_text="Watch the pads light up, then repeat the pattern in the same order. Each level adds one step.",
     card="Watch the pads light up, repeat the pattern and see how many levels you can reach.",
     hint="About the sequence memory test",
     article="""
<h2>Sequence Memory Test: Remember the Order, Not Just the Pads</h2>
<p>Repeating a growing pattern of lights is one of the oldest memory games around. The electronic game Simon made it famous in the late 1970s. In this version, nine pads light up in a sequence and you tap them back in the same order. Each level adds a step, and your level is your score.</p>
<h3>How a round works</h3>
<ol>
<li>Press “Start Sequence Game” and watch the pads light up.</li>
<li>When the pattern ends, tap the same pads in the same order.</li>
<li>If you are right, the next level adds one more step. If you make a mistake, the run ends.</li>
</ol>
<h3>What it exercises</h3>
<p>This is a visual and spatial working-memory task: you hold a short series of positions in mind and repeat it in order. It is not the same as the card-matching memory game, where the challenge is remembering where pairs are hidden. Here the challenge is the order of the steps.</p>
<h3>Strategies that help</h3>
<ul>
<li><strong>Chunk the steps.</strong> Group them in twos or threes instead of holding each one separately.</li>
<li><strong>Trace a shape.</strong> Think of the pattern as a path across the grid.</li>
<li><strong>Name the positions.</strong> Silently saying “top-left, centre, bottom-right” gives you a second memory trail.</li>
<li><strong>Do not rush.</strong> Wait for the pattern to finish before you start tapping.</li>
</ul>
<h3>Common questions</h3>
<details class="faq-item"><summary>Why do I keep failing at the same level?</summary><p>Longer sequences stop fitting in working memory unless you chunk them. Try grouping the steps into pairs.</p></details>
<details class="faq-item"><summary>Do scores vary from day to day?</summary><p>Yes. Sleep, stress and distractions all matter, so compare yourself with your own earlier runs.</p></details>
<details class="faq-item"><summary>Will this improve my memory?</summary><p>Practice improves the game itself. Whether it carries over to everyday memory is still debated, so enjoy it as a warm-up.</p></details>
""", note=NOTE)

page("stroop", base="brain", sub="stroop", group="Brain training", slug="stroop-test.html", name="Stroop Test",
     label="🌈 Stroop Test", cat="GameApplication", rel=["seq", "num", "reflex"],
     title="Stroop Test Online – Free Colour & Word Attention Game | Calm & Focus",
     desc="Free online Stroop test: pick the ink colour of the word and ignore what it says. Track your score and best. Works on mobile.",
     h1="Stroop Test Online: Name the Ink Colour, Not the Word",
     sub_text="Select the ink colour of the word and ignore what it says.",
     card="Pick the ink colour and ignore the word. A classic attention-control challenge.",
     hint="About the Stroop test",
     article="""
<h2>The Stroop Test: Why Reading Gets in the Way</h2>
<p>You see the word BLUE written in red ink. The task is to pick the colour of the ink, not the word. It sounds easy, yet it is slower and more error-prone than it should be, because reading is automatic and you have to hold it back. This effect was described by John Ridley Stroop in 1935.</p>
<h3>How to play</h3>
<ol>
<li>A colour word appears on screen in a coloured ink.</li>
<li>Tap the button that matches the ink colour: Red, Blue, Green or Yellow.</li>
<li>Your score goes up with each correct answer, and your best score is saved on this device.</li>
</ol>
<h3>Why it is hard</h3>
<p>When the word and the ink disagree, two responses compete: reading the word, which is automatic, and naming the colour, which takes effort. Psychologists use this task as a classic example of interference and inhibitory control, which is the ability to suppress an automatic response.</p>
<h3>Tips</h3>
<ul>
<li>Soften your gaze and look slightly past the word so that you notice the colour first.</li>
<li>Say the colour silently before you tap.</li>
<li>Accuracy first, then speed. Rushing makes the automatic response win.</li>
</ul>
<h3>Things to keep in mind</h3>
<p>This is a casual game and not a clinical test. If you have colour-vision deficiency, red and green items can be hard to tell apart, and that is about perception rather than focus.</p>
<h3>Common questions</h3>
<details class="faq-item"><summary>Is this a diagnostic test?</summary><p>No. It is a short attention game for fun and practice, not a medical or psychological assessment.</p></details>
<details class="faq-item"><summary>Why is it slower when word and colour differ?</summary><p>Because you have to suppress automatic reading while you name the colour. That conflict takes extra processing time.</p></details>
<details class="faq-item"><summary>Are my scores saved?</summary><p>Your best score is stored locally on your device only.</p></details>
""", note=NOTE)

page("num", base="brain", sub="num", group="Brain training", slug="number-memory-test.html", name="Number Memory Test",
     label="🔢 Number Memory", cat="GameApplication", rel=["seq", "stroop", "focus"],
     title="Number Memory Test – Free Online Digit Span Practice | Calm & Focus",
     desc="Free number memory test: memorise the digits, type them back, and see how long a number you can hold. Works on phone and desktop.",
     h1="Number Memory Test: How Many Digits Can You Hold?",
     sub_text="Memorise the digits, then type them back. The number grows as you succeed.",
     card="Memorise the digits, type them back and see how long a number you can hold.",
     hint="About the number memory test",
     article="""
<h2>Number Memory Test: Digit Span Practice</h2>
<p>Digit span, remembering a string of digits and repeating it back, is one of the most familiar short-term memory tasks. Versions of it appear in well-known psychological test batteries. This game starts with three digits and gets longer as you succeed.</p>
<h3>How to play</h3>
<ol>
<li>Press “Begin Test” and look at the digits shown on screen.</li>
<li>When they disappear, type them into the box.</li>
<li>Press “Submit Answer”. If you are right, the next number is one digit longer.</li>
</ol>
<h3>How much can you hold?</h3>
<p>A classic 1956 paper by George Miller suggested that people can hold about seven items in short-term memory. More recent work points to a lower figure, nearer four chunks. The difference is chunking: if you group digits into meaningful pieces, each piece counts as one item.</p>
<h3>Chunking tips</h3>
<ul>
<li>Break digits into groups, for example 3-3-2 for an eight-digit number.</li>
<li>Look for patterns such as years, repeated digits or counting up.</li>
<li>Say the groups in a rhythm, the way phone numbers are spoken.</li>
<li>Do not stare at the number. Look once, group it, then rehearse it.</li>
</ul>
<h3>Common questions</h3>
<details class="faq-item"><summary>Why are phone numbers split into groups?</summary><p>For the same reason as chunking: groups of two to four digits are much easier to hold than a single long string.</p></details>
<details class="faq-item"><summary>Can I improve my score?</summary><p>Strategy helps a lot, especially chunking. Whether the underlying capacity can be increased is still debated.</p></details>
<details class="faq-item"><summary>Is this a medical test?</summary><p>No. It is a casual practice game and not an assessment of memory problems. If you are worried about your memory, speak to a doctor.</p></details>
""", note=NOTE)

ORDER = ["reflex", "pomodoro", "focus", "breathe", "ground", "shredder", "tasks", "sound",
         "pebbles", "sand", "bubbles", "seq", "stroop", "num"]
GROUPS = []
for k in ORDER:
    g = P[k]["group"]
    if g not in GROUPS:
        GROUPS.append(g)

# ----------------------------------------------------------------------------------------------
html = SRC.read_text(encoding="utf-8")
head, rest = html.split("<body", 1)
rest = rest[rest.index(">") + 1:]

def grab(pattern, text, flags=re.S):
    m = re.search(pattern, text, flags)
    if not m:
        sys.exit("pattern not found: " + pattern)
    return m.group(0)

topbar = grab(r'<div class="top-bar">.*?</div>\s*</div>', rest).replace('href="index.html"', 'href="/"')
base_sections = {}
for b in {v["base"] for v in P.values()}:
    base_sections[b] = grab(r'<section class="tool-container[^"]*" id="t-%s">.*?</section>' % b, rest)
all_tools = grab(r'<section class="all-tools".*?</section>', rest)
faq = grab(r'<section class="faq-section">.*?</section>', rest)
hero = grab(r'<header class="hero">.*?</header>', rest)
footer_orig = grab(r'<footer class="site-footer">.*?</footer>', rest)
tail = rest[rest.index("<!-- MODAL PROGRESS DIALOG -->"):]
tail = tail[: tail.index("</body>")]

# remove the old in-page tab switcher
tail = re.sub(r"// 1\. MASTER TAB SWITCHER.*?(?=// 2\. ZEN POMODORO)", "", tail, flags=re.S)

# Sand garden: the original only listened to mouse events, so it never worked on touch screens.
NEW_SAND = """// SAND GARDEN CANVAS (pointer events: touch, pen and mouse)
            const sCanvas = document.getElementById('sand-canvas');
            if (sCanvas) {
                const sCtx = sCanvas.getContext('2d');
                const smooth = () => { sCtx.fillStyle = '#e8dfd1'; sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height); };
                smooth();
                sCanvas.style.touchAction = 'none';
                let last = null;
                const pos = (e) => {
                    const r = sCanvas.getBoundingClientRect();
                    return { x: (e.clientX - r.left) * sCanvas.width / (r.width || 1), y: (e.clientY - r.top) * sCanvas.height / (r.height || 1) };
                };
                const groove = (a, b) => {
                    sCtx.lineCap = 'round'; sCtx.lineJoin = 'round';
                    sCtx.strokeStyle = '#c9ba98'; sCtx.lineWidth = 11;
                    sCtx.beginPath(); sCtx.moveTo(a.x, a.y); sCtx.lineTo(b.x, b.y); sCtx.stroke();
                    sCtx.strokeStyle = '#f4eee3'; sCtx.lineWidth = 3;
                    sCtx.beginPath(); sCtx.moveTo(a.x - 1, a.y - 1); sCtx.lineTo(b.x - 1, b.y - 1); sCtx.stroke();
                };
                sCanvas.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    try { sCanvas.setPointerCapture(e.pointerId); } catch (err) { }
                    last = pos(e); groove(last, last);
                });
                sCanvas.addEventListener('pointermove', (e) => {
                    if (!last) return;
                    e.preventDefault();
                    const p = pos(e); groove(last, p); last = p;
                });
                const stop = () => { last = null; };
                sCanvas.addEventListener('pointerup', stop);
                sCanvas.addEventListener('pointercancel', stop);
                sCanvas.addEventListener('pointerleave', stop);
                const sClear = document.getElementById('sand-clear');
                if (sClear) sClear.addEventListener('click', smooth);
            }"""
tail, n = re.subn(r"// SAND GARDEN CANVAS.*?(?=\n        \}\);\n    </script>)", lambda m: NEW_SAND, tail, flags=re.S)
if n != 1:
    sys.exit("sand garden block not found")

# ---------------- helpers ----------------
def esc(s): return s.replace("&", "&amp;")
def attr(s): return s.replace("&", "&amp;").replace('"', "&quot;")

orig_cards = {}
for key, b, span in re.findall(r'<a href="index\.html#(\w+)"><b>(.*?)</b><span>(.*?)</span></a>', all_tools, re.S):
    orig_cards[key] = (" ".join(b.split()), " ".join(span.split()))

def card_html(k):
    p = P[k]
    if k in orig_cards:
        b, span = orig_cards[k]
    else:
        b, span = p["label"], p["card"]
    return '<a href="%s"><b>%s</b><span>%s</span></a>' % (p["slug"], b, span)

def cards(keys):
    return "\n".join(card_html(k) for k in keys)

def nav(active):
    btns = []
    for k in ORDER:
        p = P[k]
        btns.append('<button type="button" role="tab" data-href="%s" data-t="%s" aria-selected="%s">%s</button>'
                    % (p["slug"], k, "true" if k == active else "false", p["label"]))
    return ('<nav class="tabs-wrapper" aria-label="Tools">\n'
            '  <button type="button" class="tools-menu-btn" id="tools-menu-btn" aria-expanded="false" aria-controls="main-tabs">'
            '<span class="tm-now">%s</span><span class="tm-all">All %d tools ▾</span></button>\n'
            '  <div class="tabs-list" role="tablist" id="main-tabs">\n    %s\n  </div>\n</nav>'
            % (P[active]["label"], len(ORDER), "\n    ".join(btns)))

NAV_JS = """<script>
(function(){
  var menu=document.getElementById('tools-menu-btn'), list=document.getElementById('main-tabs');
  if(menu&&list){menu.addEventListener('click',function(){
    var open=list.classList.toggle('open'); menu.setAttribute('aria-expanded',open);});}
  document.querySelectorAll('#main-tabs button[data-href]').forEach(function(b){
    b.addEventListener('click',function(){location.href=b.dataset.href;});});
  var cur=document.querySelector('#main-tabs [aria-selected="true"]');
  if(cur&&cur.scrollIntoView){try{cur.scrollIntoView({block:'nearest',inline:'center'});}catch(e){}}
})();
</script>"""

def footer():
    f = footer_orig.replace('href="index.html"', 'href="/"')
    links = "\n".join('            <a href="%s">%s</a>' % (P[k]["slug"], esc(P[k]["name"])) for k in ORDER)
    return re.sub(r'<nav class="foot-tools" aria-label="Tools">.*?</nav>',
                  lambda m: '<nav class="foot-tools" aria-label="Tools">\n%s\n        </nav>' % links, f, flags=re.S)

def make_head(title, desc, canonical, ld):
    h = head
    h = re.sub(r"<title>.*?</title>", lambda m: "<title>%s</title>" % esc(title), h, flags=re.S)
    h = re.sub(r'(<meta name="description"\s+content=")[^"]*(")', lambda m: m.group(1) + attr(desc) + m.group(2), h, flags=re.S)
    h = re.sub(r'<meta name="keywords".*?>\n', "", h, flags=re.S)
    h = re.sub(r'(<link rel="canonical" href=")[^"]*(")', lambda m: m.group(1) + canonical + m.group(2), h)
    h = re.sub(r'(<meta property="og:url" content=")[^"]*(")', lambda m: m.group(1) + canonical + m.group(2), h)
    for pat in (r'(<meta property="og:title"\s+content=")', r'(<meta name="twitter:title"\s+content=")'):
        h = re.sub(pat + r'[^"]*(")', lambda m: m.group(1) + attr(title) + m.group(2), h, flags=re.S)
    for pat in (r'(<meta property="og:description"\s+content=")', r'(<meta name="twitter:description"\s+content=")'):
        h = re.sub(pat + r'[^"]*(")', lambda m: m.group(1) + attr(desc) + m.group(2), h, flags=re.S)
    h = re.sub(r'<script\s+type="application/ld\+json">.*?</script>',
               lambda m: '<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False), h, flags=re.S)
    h = h.replace('<link rel="stylesheet" href="style.css">',
                  '<link rel="stylesheet" href="style.css">\n    <link rel="stylesheet" href="mobile.css">')
    return h

def related_html(k):
    items = " · ".join('<a href="%s">%s</a>' % (P[r]["slug"], esc(P[r]["name"])) for r in P[k]["rel"])
    return '<p class="related"><strong>Related tools:</strong> %s</p>' % items

def add_related(article, k):
    r = related_html(k)
    if '<p class="note">' in article:
        return article.replace('<p class="note">', r + '\n                <p class="note">', 1)
    return article.replace("</article>", r + "\n            </article>")

def adapt(k):
    p = P[k]
    sec = base_sections[p["base"]]
    sec = re.sub(r'class="tool-container[^"]*"', 'class="tool-container active"', sec, count=1)
    sub = p.get("sub")
    if sub:
        # h1 + subtitle
        sec, n = re.subn(r'<h2 class="tool-title">.*?</h2>', lambda m: '<h1 class="tool-title">%s</h1>' % esc(p["h1"]), sec, count=1, flags=re.S)
        assert n == 1, k
        sec, n = re.subn(r'(</h1>\s*)<p class="tool-subtitle">.*?</p>', lambda m: m.group(1) + '<p class="tool-subtitle">%s</p>' % esc(p["sub_text"]), sec, count=1, flags=re.S)
        assert n == 1, k
        if p["base"] == "brain":
            ids = ["g-seq", "g-stroop", "g-num"]; want = "g-" + sub
            for i in ids:
                sec, n = re.subn(r'class="brain-game-container(?: active)?" id="%s"' % i,
                                 'class="brain-game-container%s" id="%s"' % (" active" if i == want else "", i), sec)
                assert n == 1, i
            sec = sec.replace('<div class="game-subnav" id="brain-game-tabs">', '<div class="game-subnav" id="brain-game-tabs" hidden style="display:none">')
        elif p["base"] == "games":
            ids = ["mg-pebbles", "mg-sand"]; want = "mg-" + sub
            for i in ids:
                sec, n = re.subn(r'class="brain-game-container(?: active)?" id="%s"' % i,
                                 'class="brain-game-container%s" id="%s"' % (" active" if i == want else "", i), sec)
                assert n == 1, i
            sec = sec.replace('<div class="game-subnav" id="distract-tabs">', '<div class="game-subnav" id="distract-tabs" hidden style="display:none">')
        elif p["base"] == "relief":
            if sub == "shredder":
                sec = sec.replace('<ul class="task-list" id="stress-tasks"></ul>', '<ul class="task-list" id="stress-tasks" hidden style="display:none"></ul>')
                sec = sec.replace('<p class="tool-subtitle" id="task-progress" style="', '<p class="tool-subtitle" id="task-progress" hidden style="display:none; ')
            else:
                sec = sec.replace('<div class="thought-shredder">', '<div class="thought-shredder" hidden style="display:none">')
        aid = "learn-" + k
        sec, n = re.subn(r'<button type="button" class="scroll-hint" data-scroll="[^"]*">.*?</button>',
                         lambda m: '<button type="button" class="scroll-hint" data-scroll="%s">%s <span aria-hidden="true">↓</span></button>' % (aid, p["hint"]),
                         sec, count=1, flags=re.S)
        assert n == 1, k
        art = '<article class="tab-seo-article" id="%s">%s\n%s\n            </article>' % (aid, p["article"], p["note"])
        sec, n = re.subn(r'<article class="tab-seo-article".*?</article>', lambda m: art, sec, count=1, flags=re.S)
        assert n == 1, k
    else:
        sec = sec.replace('<h2 class="tool-title">', '<h1 class="tool-title">', 1)
        sec = re.sub(r'(<h1 class="tool-title">.*?)</h2>', r"\1</h1>", sec, count=1, flags=re.S)
    return add_related(sec, k)

# ---------------- tool pages ----------------
for k in ORDER:
    p = P[k]
    url = "%s/%s" % (BASE, p["slug"])
    name = p["title"].split(" | ")[0]
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebApplication", "name": name, "url": url, "description": p["desc"],
         "applicationCategory": p["cat"], "operatingSystem": "Any",
         "browserRequirements": "Requires JavaScript",
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Calm & Focus", "item": BASE + "/"},
            {"@type": "ListItem", "position": 2, "name": p["name"], "item": url}]}]}
    others = [x for x in ORDER if x != k]
    page_html = f"""{make_head(p["title"], p["desc"], url, ld)}<body data-tool="{k}">
    {topbar}

    {nav(k)}

    <main class="app-viewport">
        {adapt(k)}

        <section class="all-tools" aria-labelledby="all-tools-h">
            <h2 id="all-tools-h">More free tools</h2>
            <div class="tool-cards">
{cards(others)}
            </div>
        </section>
    </main>

    {footer()}

    {tail}
    {NAV_JS}
</body>

</html>
"""
    (OUT / p["slug"]).write_text(page_html, encoding="utf-8")

# ---------------- hub ----------------
groups_html = []
for g in GROUPS:
    keys = [k for k in ORDER if P[k]["group"] == g]
    groups_html.append('<h3 class="tool-group">%s</h3>\n<div class="tool-cards">\n%s\n</div>' % (esc(g), cards(keys)))

HUB_TITLE = "Calm & Focus – Free Reaction Test, Memory Games, Breathing, Pomodoro & Relaxing Sounds"
HUB_DESC = ("Free online tools for focus and stress relief: reaction time test, sequence memory test, Stroop test, "
            "Schulte table, box breathing, Zen Pomodoro timer, relaxing sounds and bubble wrap popper. No signup.")
ld_orig = json.loads(re.search(r'<script\s+type="application/ld\+json">(.*?)</script>', head, re.S).group(1))
for item in ld_orig["@graph"]:
    if item.get("@type") == "WebApplication":
        item["featureList"] = [P[k]["name"] for k in ORDER]
redirect_map = {"reflex": P["reflex"]["slug"], "pomodoro": P["pomodoro"]["slug"], "focus": P["focus"]["slug"],
                "breathe": P["breathe"]["slug"], "games": P["pebbles"]["slug"], "relief": P["shredder"]["slug"],
                "sound": P["sound"]["slug"], "brain": P["seq"]["slug"], "bubbles": P["bubbles"]["slug"],
                "ground": P["ground"]["slug"]}
hub = f"""{make_head(HUB_TITLE, HUB_DESC, BASE + "/", ld_orig)}<body data-tool="home">
    {topbar}

    {hero}

    <main class="app-viewport">
        <section class="all-tools hub-tools" aria-labelledby="all-tools-h">
            <h2 id="all-tools-h">Pick a tool</h2>
            {chr(10).join(groups_html)}
        </section>

        {faq}
    </main>

    {footer()}

    {tail}
    <script>
    // old links like index.html#brain -> new real URLs
    (function(){{var m={json.dumps(redirect_map)};
      var h=(location.hash||'').slice(1); if(m[h]) location.replace(m[h]);}})();
    </script>
</body>

</html>
"""
(OUT / "index.html").write_text(hub, encoding="utf-8")

# ---------------- sitemap ----------------
urls = [BASE + "/"] + ["%s/%s" % (BASE, P[k]["slug"]) for k in ORDER]
(OUT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "\n".join("  <url><loc>%s</loc></url>" % u for u in urls) + "\n</urlset>\n", encoding="utf-8")
print("wrote %d pages + sitemap to %s" % (len(ORDER) + 1, OUT))
