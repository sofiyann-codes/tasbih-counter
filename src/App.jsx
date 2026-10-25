import { useEffect, useState, useRef } from "react";
import {
  Moon,
  Sun,
  RotateCcw,
  Undo2,
  Settings2,
  Sparkles,
  Heart,
  Volume2,
  VolumeX,
  Vibrate,
  CircleDot,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

const tasbihList = [
  {
    name: "SubhanAllah",
    arabic: "سُبْحَانَ اللَّهِ",
    meaning: "Glory be to Allah",
    target: 33,
  },
  {
    name: "Alhamdulillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    meaning: "All praise is for Allah",
    target: 33,
  },
  {
    name: "Allahu Akbar",
    arabic: "اللَّهُ أَكْبَرُ",
    meaning: "Allah is the Greatest",
    target: 34,
  },
  {
    name: "Astaghfirullah",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    meaning: "I seek forgiveness from Allah",
    target: 100,
  },
  {
    name: "Salawat",
    arabic: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ",
    meaning: "Blessings upon Prophet Muhammad ﷺ",
    target: 100,
  },
  {
    name: "La ilaha illallah",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
    meaning: "There is no god but Allah",
    target: 100,
  },
];

const STORAGE_KEY = "tasbih-counter-data";

function getToday() {
  const date = new Date();

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return date.getFullYear() + "-" + month + "-" + day;
}

function loadData() {
  const defaults = {
    counts: {},
    customTargets: {},
    darkMode: true,
    totalToday: 0,
    savedDate: getToday(),
    soundEnabled: false,
    vibrationEnabled: true,
    beadMode: false,
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return defaults;

    const data = JSON.parse(saved);
    const sameDay = data.savedDate === getToday();

    return {
      counts: data.counts || {},
      customTargets: data.customTargets || {},
      darkMode: data.darkMode !== false,
      totalToday: sameDay ? Number(data.totalToday) || 0 : 0,
      savedDate: getToday(),
      soundEnabled: Boolean(data.soundEnabled),
      vibrationEnabled: data.vibrationEnabled !== false,
      beadMode: Boolean(data.beadMode),
    };
  } catch {
    return defaults;
  }
}

function App() {
  const [initialData] = useState(loadData);

  const [selected, setSelected] = useState(0);
  const [counts, setCounts] = useState(initialData.counts);
  const [customTargets, setCustomTargets] = useState(
    initialData.customTargets
  );
  const [darkMode, setDarkMode] = useState(initialData.darkMode);
  const [totalToday, setTotalToday] = useState(initialData.totalToday);

  const [soundEnabled, setSoundEnabled] = useState(
    initialData.soundEnabled
  );

  const [vibrationEnabled, setVibrationEnabled] = useState(
    initialData.vibrationEnabled
  );

  const [beadMode, setBeadMode] = useState(initialData.beadMode);
  const [celebration, setCelebration] = useState(false);
  const [history, setHistory] = useState([]);

  const audioContextRef = useRef(null);
  const celebrationTimerRef = useRef(null);

  const currentTasbih = tasbihList[selected];
  const count = counts[selected] || 0;
  const target = customTargets[selected] || currentTasbih.target;

  const progress = Math.min((count / target) * 100, 100);
  const completed = count >= target;

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          counts,
          customTargets,
          darkMode,
          totalToday,
          savedDate: getToday(),
          soundEnabled,
          vibrationEnabled,
          beadMode,
        })
      );
    } catch (error) {
      console.error("Unable to save Tasbih data:", error);
    }
  }, [
    counts,
    customTargets,
    darkMode,
    totalToday,
    soundEnabled,
    vibrationEnabled,
    beadMode,
  ]);

  useEffect(() => {
    function handleKeyDown(event) {
      const tag = event.target.tagName;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        event.target.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        increment();
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        undoCount();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, counts, target, totalToday]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  function playSound() {
    if (!soundEnabled) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const context = audioContextRef.current;

      if (context.state === "suspended") {
        context.resume();
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);

      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + 0.12
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
    } catch (error) {
      console.error("Unable to play sound:", error);
    }
  }

  function vibrate() {
    if (vibrationEnabled && "vibrate" in navigator) {
      navigator.vibrate(25);
    }
  }

  function increment() {
    const nextCount = count + 1;

    setCounts((previous) => ({
      ...previous,
      [selected]: nextCount,
    }));

    setTotalToday((previous) => previous + 1);

    setHistory((previous) => [
      ...previous,
      { selected, change: 1 },
    ]);

    playSound();
    vibrate();

    if (nextCount === target) {
      setCelebration(true);

      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }

      celebrationTimerRef.current = setTimeout(() => {
        setCelebration(false);
      }, 3500);
    }
  }

  function undoCount() {
    if (count <= 0) return;

    setCounts((previous) => ({
      ...previous,
      [selected]: Math.max(0, (previous[selected] || 0) - 1),
    }));

    setTotalToday((previous) => Math.max(0, previous - 1));

    setHistory((previous) => [
      ...previous,
      { selected, change: -1 },
    ]);

    setCelebration(false);
  }

  function resetCount() {
    if (count <= 0) return;

    const confirmed = window.confirm(
      "Reset your current Tasbih count?"
    );

    if (!confirmed) return;

    setCounts((previous) => ({
      ...previous,
      [selected]: 0,
    }));

    setTotalToday((previous) => Math.max(0, previous - count));
    setCelebration(false);
    setHistory([]);
  }

  function changeTarget() {
    const input = window.prompt(
      "Enter your new recitation target:",
      String(target)
    );

    if (input === null || input.trim() === "") return;

    const value = Number(input);

    if (!Number.isSafeInteger(value) || value < 1) {
      window.alert("Please enter a positive whole number.");
      return;
    }

    setCustomTargets((previous) => ({
      ...previous,
      [selected]: value,
    }));

    setCelebration(false);
  }

  function selectTasbih(index) {
    setSelected(index);
    setCelebration(false);
  }

  function toggleSound() {
    setSoundEnabled((previous) => !previous);
  }

  function renderBeads() {
    const beadCount = Math.min(target, 33);
    const activeBeads = Math.min(count, beadCount);

    return (
      <div className="bead-display">
        <div className="bead-circle">
          {Array.from({ length: beadCount }, (_, index) => {
            const angle = (index / beadCount) * Math.PI * 2;
            const radius = 112;

            const x = 50 + (Math.cos(angle) * radius) / 2.5;
            const y = 50 + (Math.sin(angle) * radius) / 2.5;

            return (
              <motion.span
                key={index}
                className={
                  "bead " + (index < activeBeads ? "bead-active" : "")
                }
                style={{
                  left: x + "%",
                  top: y + "%",
                }}
                animate={{
                  scale: index === activeBeads - 1 ? [1, 1.35, 1] : 1,
                }}
                transition={{ duration: 0.25 }}
              />
            );
          })}

          <button
            className="bead-center"
            onClick={increment}
            aria-label="Count one Dhikr"
          >
            <strong>{count}</strong>
            <span>TAP TO COUNT</span>
          </button>
        </div>

        <p className="bead-caption">
          {activeBeads} of {beadCount} beads
        </p>
      </div>
    );
  }

  return (
    <main className={"app " + (darkMode ? "dark" : "light")}>
      <header className="navbar">
        <a href="#" className="brand">
          <span className="brand-icon">۞</span>

          <span>
            <strong>Tasbih</strong>
            <small>YOUR DAILY DHIKR</small>
          </span>
        </a>

        <div className="nav-actions">
          <span className="status">
            <span className="status-dot" />
            YOUR MOMENT OF PEACE
          </span>

          <button
            className="icon-button"
            onClick={() => setDarkMode((previous) => !previous)}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>

      <section className="welcome">
        <div className="eyebrow">
          <Sparkles size={15} />
          A MOMENT OF REMEMBRANCE
        </div>

        <h1>
          Find peace in
          <br />
          <span>remembrance.</span>
        </h1>

        <p>
          Slow down, reconnect with your heart, and remember Allah.
        </p>
      </section>

      <section className="tasbih-layout">
        <aside className="tasbih-sidebar">
          <div className="section-heading">
            <div>
              <span className="section-label">YOUR COLLECTION</span>
              <h2>Choose Dhikr</h2>
            </div>

            <span className="count-badge">{tasbihList.length}</span>
          </div>

          <div className="tasbih-options">
            {tasbihList.map((tasbih, index) => (
              <button
                key={tasbih.name}
                className={
                  "tasbih-option " +
                  (selected === index ? "selected" : "")
                }
                onClick={() => selectTasbih(index)}
                aria-pressed={selected === index}
              >
                <span className="option-symbol">۞</span>

                <span className="option-info">
                  <strong>{tasbih.name}</strong>
                  <small>{tasbih.meaning}</small>
                </span>

                <span className="option-target">
                  {customTargets[index] || tasbih.target}
                </span>
              </button>
            ))}
          </div>

          <div className="sidebar-note">
            <Heart size={17} />

            <p>
              <strong>Remember with intention.</strong>
              <span>
                Every remembrance is a moment of connection.
              </span>
            </p>
          </div>
        </aside>

        <section className="counter-card">
          <div className="counter-top">
            <span className="section-label">CURRENT RECITATION</span>

            <button
              className="icon-button subtle-button"
              onClick={resetCount}
              aria-label="Reset counter"
              title="Reset counter"
            >
              <RotateCcw size={17} />
            </button>
          </div>

          <div className="arabic-text" lang="ar" dir="rtl">
            {currentTasbih.arabic}
          </div>

          <h2 className="current-name">{currentTasbih.name}</h2>

          <p className="current-meaning">
            {currentTasbih.meaning}
          </p>

          <div className="counter-circle">
            {beadMode ? (
              renderBeads()
            ) : (
              <div className="circle-ring">
                <svg className="progress-ring" viewBox="0 0 280 280">
                  <circle
                    className="ring-track"
                    cx="140"
                    cy="140"
                    r="128"
                  />

                  <motion.circle
                    className="ring-progress"
                    cx="140"
                    cy="140"
                    r="128"
                    initial={false}
                    animate={{
                      strokeDashoffset:
                        804 - (progress / 100) * 804,
                    }}
                    transition={{ duration: 0.35 }}
                  />
                </svg>

                <motion.button
                  className="count-button"
                  onClick={increment}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Count one Dhikr"
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      className="count-number"
                      key={count}
                      initial={{ opacity: 0.5, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.12 }}
                    >
                      {count.toLocaleString()}
                    </motion.span>
                  </AnimatePresence>

                  <span className="count-caption">TAP TO COUNT</span>
                  <span className="count-divider" />

                  <span className="target-text">
                    TARGET <strong>{target}</strong>
                  </span>
                </motion.button>
              </div>
            )}
          </div>

          <div className="progress-info">
            <span>YOUR PROGRESS</span>
            <strong>{Math.round(progress)}%</strong>
          </div>

          <div
            className="progress-bar"
            role="progressbar"
            aria-label="Tasbih target progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="progress-fill"
              initial={false}
              animate={{ width: progress + "%" }}
              transition={{ duration: 0.35 }}
            />
          </div>

          <p className="progress-message" aria-live="polite">
            {completed
              ? "Alhamdulillah! You've reached your target."
              : (target - count).toLocaleString() +
                " recitations remaining to reach your target."}
          </p>

          <AnimatePresence>
            {celebration && (
              <motion.div
                className="celebration-message"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
              >
                <Trophy size={20} />
                <span>Alhamdulillah! Target completed!</span>
                <Sparkles size={18} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="counter-actions">
            <button
              className="action-button"
              onClick={undoCount}
              disabled={count === 0}
            >
              <Undo2 size={17} />
              Undo
            </button>

            <button
              className="action-button"
              onClick={resetCount}
              disabled={count === 0}
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              className="action-button"
              onClick={changeTarget}
            >
              <Settings2 size={16} />
              Target
            </button>
          </div>

          <div className="extra-controls">
            <button
              className={"action-button " + (beadMode ? "active-control" : "")}
              onClick={() => setBeadMode((previous) => !previous)}
            >
              <CircleDot size={16} />
              {beadMode ? "Classic mode" : "Bead mode"}
            </button>

            <button
              className={"action-button " + (soundEnabled ? "active-control" : "")}
              onClick={toggleSound}
            >
              {soundEnabled ? (
                <Volume2 size={16} />
              ) : (
                <VolumeX size={16} />
              )}
              Sound
            </button>

            <button
              className={
                "action-button " +
                (vibrationEnabled ? "active-control" : "")
              }
              onClick={() =>
                setVibrationEnabled((previous) => !previous)
              }
            >
              <Vibrate size={16} />
              Vibration
            </button>
          </div>

          <p className="keyboard-hint">
            SPACE to count <span>•</span> BACKSPACE to undo
          </p>
        </section>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-icon">۞</span>

          <div>
            <span className="stat-label">TOTAL RECITATIONS</span>
            <strong>{totalToday.toLocaleString()}</strong>
            <small>Today</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-icon">◎</span>

          <div>
            <span className="stat-label">CURRENT DHIKR</span>
            <strong>{count.toLocaleString()}</strong>
            <small>{currentTasbih.name}</small>
          </div>
        </article>

        <article className="stat-card">
          <span className="stat-icon">✧</span>

          <div>
            <span className="stat-label">TARGET PROGRESS</span>
            <strong>{Math.round(progress)}%</strong>
            <small>For the selected Dhikr</small>
          </div>
        </article>
      </section>

      <footer className="footer">
        <span>بِسْمِ اللَّهِ</span>
        <p>Made with intention, for remembrance.</p>
        <span>۞</span>
      </footer>
    </main>
  );
}

export default App;

