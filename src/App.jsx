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
import { Link, useNavigate } from "react-router-dom";
import api from "./api";
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


const dailyDhikrSchedule = [
  { time: "Morning (after Fajr)", dhikr: "Ayatul Kursi", slug: "ayatul-kursi", count: "1×", source: "Sahih al-Bukhari 5010" },
  { time: "Morning", dhikr: "SubhanAllah wa bihamdihi", slug: "subhanallah-wa-bihamdihi", count: "100×", source: "Sahih Muslim 2692" },
  { time: "Morning", dhikr: "Hasbiyallahu la ilaha illa hu, alayhi tawakkaltu", slug: "hasbiyallahu-la-ilaha-illa-hu-alayhi-tawakkaltu", count: "7×", source: "Abu Dawud 5081" },
  { time: "After each prayer", dhikr: "SubhanAllah, Alhamdulillah, Allahu Akbar", slug: "subhanallah-alhamdulillah-allahu-akbar", count: "33× each", source: "Sahih Muslim 597" },
  { time: "After each prayer", dhikr: "Ayatul Kursi", slug: "ayatul-kursi", count: "1×", source: "Al-Nasai, Al-Kubra" },
  { time: "Evening (after Asr/Maghrib)", dhikr: "SubhanAllah wa bihamdihi", slug: "subhanallah-wa-bihamdihi", count: "100×", source: "Sahih Muslim 2692" },
  { time: "Before sleeping", dhikr: "Bismika Allahumma amutu wa ahya", slug: "bismika-allahumma-amutu-wa-ahya", count: "1×", source: "Sahih al-Bukhari 6312" },
  { time: "Before sleeping", dhikr: "Surah Al-Ikhlas, Al-Falaq, An-Nas", slug: "surah-al-ikhlas-al-falaq-an-nas", count: "3× each", source: "Sahih al-Bukhari 5017" },
  { time: "In difficulty", dhikr: "Hasbunallah wa nimal wakeel", slug: "hasbunallah-wa-nimal-wakeel", count: "As needed", source: "Sahih al-Bukhari 4563" },
  { time: "Anytime", dhikr: "La hawla wa la quwwata illa billah", slug: "la-hawla-wa-la-quwwata-illa-billah", count: "As needed", source: "Sahih al-Bukhari 6384" },
  { time: "Seeking forgiveness", dhikr: "Astaghfirullah", slug: "astaghfirullah", count: "As often as possible", source: "Sahih al-Bukhari 6307" },
];

const situationalDhikr = [
  { situation: "Starting any task", arabic: "بِسْمِ اللَّهِ", transliteration: "Bismillah", meaning: "In the name of Allah" },
  { situation: "Seeing something good", arabic: "سُبْحَانَ اللَّهِ", transliteration: "SubhanAllah", meaning: "Glory be to Allah" },
  { situation: "Expressing gratitude", arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdulillah", meaning: "All praise is for Allah" },
  { situation: "Expressing intention", arabic: "إِنْ شَاءَ اللَّهُ", transliteration: "Insha Allah", meaning: "If Allah wills" },
  { situation: "Hearing bad news", arabic: "إِنَّا لِلَّهِ", transliteration: "Inna lillahi", meaning: "To Allah we belong and to Him we return" },
  { situation: "Seeking forgiveness", arabic: "أَسْتَغْفِرُ اللَّهَ", transliteration: "Astaghfirullah", meaning: "I seek forgiveness from Allah" },
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

function HomePage() {
  const navigate = useNavigate();
  const [initialData] = useState(loadData);
  const [authToken] = useState(() => localStorage.getItem("tasbih-token"));
  const [syncReady, setSyncReady] = useState(
    () => !localStorage.getItem("tasbih-token")
  );
  const [syncMessage, setSyncMessage] = useState("");
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tasbih-user")) || null;
    } catch {
      return null;
    }
  });
  const [showProfile, setShowProfile] = useState(false);

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

  // Verify the token and load the current user's profile from the backend.
  useEffect(() => {
    const token = localStorage.getItem("tasbih-token");

    if (!token) {
      setProfile(null);
      return undefined;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await api.get("/auth/me");
        if (cancelled) return;

        setProfile(response.data.user);
        localStorage.setItem(
          "tasbih-user",
          JSON.stringify(response.data.user)
        );
      } catch (error) {
        if (cancelled) return;

        if (error.response?.status === 401) {
          localStorage.removeItem("tasbih-token");
          localStorage.removeItem("tasbih-user");
          setProfile(null);
        } else {
          console.error("Unable to load account profile:", error);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("tasbih-token");
    localStorage.removeItem("tasbih-user");
    setProfile(null);
    setShowProfile(false);
    window.location.assign("/");
  }

  // When a logged-in user opens the counter, load their saved data from MongoDB.
  // Visitors without an account continue using local storage only.
  useEffect(() => {
    if (!authToken) {
      setSyncReady(true);
      return;
    }

    let cancelled = false;

    async function loadRemoteData() {
      try {
        const response = await api.get("/tasbih");
        if (cancelled) return;

        const data = response.data?.tasbihData || {};
        const isToday = data.savedDate === getToday();

        setCounts(data.counts && typeof data.counts === "object" ? data.counts : {});
        setCustomTargets(
          data.customTargets && typeof data.customTargets === "object"
            ? data.customTargets
            : {}
        );
        if (typeof data.darkMode === "boolean") setDarkMode(data.darkMode);
        setTotalToday(isToday ? Number(data.totalToday) || 0 : 0);
        if (typeof data.soundEnabled === "boolean") setSoundEnabled(data.soundEnabled);
        if (typeof data.vibrationEnabled === "boolean") setVibrationEnabled(data.vibrationEnabled);
        if (typeof data.beadMode === "boolean") setBeadMode(data.beadMode);

        setSyncMessage("Progress synced to your account");
        setSyncReady(true);
      } catch (error) {
        if (cancelled) return;
        console.error("Unable to load saved Tasbih progress:", error);
        setSyncMessage("Could not load cloud progress");
        // Do not overwrite cloud data if loading it failed.
      }
    }

    loadRemoteData();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

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

  // Debounce cloud saves so rapid taps do not create a request for every click.
  useEffect(() => {
    if (!authToken || !syncReady) return;

    const timeoutId = window.setTimeout(async () => {
      try {
        await api.put("/tasbih", {
          tasbihData: {
            counts,
            customTargets,
            darkMode,
            totalToday,
            savedDate: getToday(),
            soundEnabled,
            vibrationEnabled,
            beadMode,
          },
        });
        setSyncMessage("Progress synced to your account");
      } catch (error) {
        console.error("Unable to save Tasbih progress:", error);
        setSyncMessage("Cloud save failed; progress remains on this device");
      }
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [
    authToken,
    syncReady,
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
          {profile ? (
            <div className="profile-menu">
              <button
                type="button"
                className="action-button auth-nav-button"
                onClick={() => setShowProfile((previous) => !previous)}
                aria-expanded={showProfile}
                aria-haspopup="true"
              >
                Account
              </button>

              {showProfile && (
                <div className="profile-dropdown">
                  <strong>{profile.name}</strong>
                  <span>{profile.email}</span>
                  <button type="button" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="action-button auth-nav-button">
              Log in
            </Link>
          )}

          <span className="status">
            <span className="status-dot" />
            YOUR MOMENT OF PEACE
          </span>

          {authToken && syncMessage && (
            <span className="section-label" role="status" aria-live="polite">
              {syncMessage}
            </span>
          )}

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


      <section className="dhikr-library">
        <div className="library-heading">
          <span className="section-label">YOUR DAILY ROUTINE</span>
          <h2>Your Dhikr List by Time of Day</h2>
          <p>Keep your daily remembrance organized throughout the day.</p>
        </div>

        <div className="dhikr-table-wrap">
          <table className="dhikr-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Dhikr</th>
                <th>Count</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {dailyDhikrSchedule.map((item, index) => (
                <tr key={`${item.time}-${index}`}>
                  <td>{item.time}</td>
                  <td className="dhikr-table-name">
                    <Link
                      className="dhikr-link"
                      to={`/dhikr/${item.slug}`}
                      onClick={(event) => {
                        if (!localStorage.getItem("tasbih-token")) {
                          event.preventDefault();
                          navigate("/login", {
                            state: {
                              from: `/dhikr/${item.slug}`,
                              loginFirst: true,
                            },
                          });
                        }
                      }}
                    >
                      {item.dhikr}
                    </Link>
                  </td>
                  <td><span className="dhikr-count-badge">{item.count}</span></td>
                  <td className="dhikr-source">{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dhikr-library situations-section">
        <div className="library-heading">
          <span className="section-label">REMEMBRANCE IN EVERY MOMENT</span>
          <h2>Dhikr for Specific Situations</h2>
          <p>Short remembrances for everyday moments.</p>
        </div>

        <div className="situational-grid">
          {situationalDhikr.map((item) => (
            <article className="situation-card" key={item.situation}>
              <span className="situation-label">{item.situation}</span>
              <div className="situation-arabic" lang="ar" dir="rtl">{item.arabic}</div>
              <h3>{item.transliteration}</h3>
              <p>{item.meaning}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <span>بِسْمِ اللَّهِ</span>
        <p>Made with intention, for remembrance.</p>
        <p>
          Built by{" "}
          <a href="https://sofiyann-codes.github.io/" target="_blank" rel="noopener noreferrer">
            Mohammed Sofiyan Pasha
          </a>
        </p>
        <p>
          <a href="https://github.com/sofiyann-codes/tasbih-counter" target="_blank" rel="noopener noreferrer">
            View Source Code on GitHub
          </a>
        </p>
        <span>۞</span>
      </footer>
    </main>
  );
}

export default HomePage;

