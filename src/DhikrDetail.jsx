
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import "./App.css";

const details = {
  "ayatul-kursi": {
    title: "Ayatul Kursi",
    arabic:
      "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    transliteration:
      "Allahu laaa ilaaha illaa huwal haiyul qai-yoom; laa taakhuzuhoo sinatunw wa laa nawm; lahoo maa fissamaawaati wa maa fil ard; man zallazee yashfa'u indahooo illaa be iznih; ya'lamu maa baina aideehim wa maa khalfahum; wa laa yuheetoona beshai 'immin 'ilmihee illa be maa shaaaa; wasi'a kursiyyuhus samaa waati wal arda wa la ya'ooduho hifzuhumaa; wa huwal aliyyul 'azeem",
    meaning:
      "Allah! There is no god but He - the Living, the Self-subsisting, Eternal. No slumber can seize Him nor Sleep. His are all things in the heavens and on earth. Who is there that can intercede in His presence except as he permitteth? He knoweth what (appeareth to His creatures As) Before or After or Behind them. Nor shall they compass aught of His knowledge except as He willeth. His throne doth extend over the heavens and on earth, and He feeleth no fatigue in guarding and preserving them, For He is the Most High, the Supreme (in glory).",
    reference: "Qur'an 2:255",
    target: 1,
  },
  "subhanallah-wa-bihamdihi": {
    title: "SubhanAllah wa bihamdihi",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteration: "SubhanAllahi wa bihamdihi",
    meaning: "Glory be to Allah and praise be to Him.",
    reference: "Sahih Muslim 2692 — verify exact wording and context.",
    target: 100,
  },
  "hasbiyallahu-la-ilaha-illa-hu-alayhi-tawakkaltu": {
    title: "Hasbiyallahu la ilaha illa Huwa",
    arabic:
      "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ",
    transliteration:
      "Hasbiyallahu la ilaha illa Huwa, alayhi tawakkaltu",
    meaning:
      "Allah is sufficient for me. There is no deity except Him; upon Him I rely.",
    reference: "Qur'an 9:129",
    target: 7,
  },
  "subhanallah-alhamdulillah-allahu-akbar": {
    title: "Tasbih after prayer",
    arabic:
      "سُبْحَانَ اللَّهِ · الْحَمْدُ لِلَّهِ · اللَّهُ أَكْبَرُ",
    transliteration:
      "SubhanAllah · Alhamdulillah · Allahu Akbar",
    meaning:
      "Glory be to Allah · All praise is for Allah · Allah is the Greatest.",
    reference: "Sahih Muslim 597 — as listed in your schedule.",
    target: 33,
  },
  "bismika-allahumma-amutu-wa-ahya": {
    title: "Before sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    meaning: "In Your name, O Allah, I die and I live.",
    reference: "Sahih al-Bukhari 6312 — as listed in your schedule.",
    target: 1,
  },
  "surah-al-ikhlas-al-falaq-an-nas": {
    title: "The three Quls",
    arabic:
      "قُلْ هُوَ اللَّهُ أَحَدٌ · قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ · قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
    transliteration:
      "Surah Al-Ikhlas · Surah Al-Falaq · Surah An-Nas",
    meaning:
      "Your listed routine calls for reciting each of these three short surahs three times.",
    reference: "Sahih al-Bukhari 5017 — as listed in your schedule.",
    target: 3,
  },
  "hasbunallah-wa-nimal-wakeel": {
    title: "Hasbunallah wa ni'mal wakeel",
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    transliteration: "Hasbunallahu wa ni'mal-wakeel",
    meaning:
      "Allah is sufficient for us, and He is the best Disposer of affairs.",
    reference: "Qur'an 3:173",
    target: 100,
  },
  "la-hawla-wa-la-quwwata-illa-billah": {
    title: "La hawla wa la quwwata illa billah",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "La hawla wa la quwwata illa billah",
    meaning: "There is no power and no strength except through Allah.",
    reference: "Sahih al-Bukhari 6384.",
    target: 100,
  },
  astaghfirullah: {
    title: "Astaghfirullah",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullah",
    meaning: "I seek forgiveness from Allah.",
    reference: "Sahih al-Bukhari 6307.",
    target: 100,
  },
};

export default function DhikrDetail() {
  const { slug } = useParams();
  const item = details[slug];
  const [count, setCount] = useState(0);

  const target = item?.target || 1;
  const progress = Math.min((count / target) * 100, 100);

  if (!item) {
    return (
      <main className="dhikr-detail-page app light">
        <div className="dhikr-detail-card">
          <h1>Dhikr page not found</h1>
          <p>This entry does not have a reading page yet.</p>
          <Link to="/" className="dhikr-back-link">
            <ArrowLeft size={17} />
            Back to daily Dhikr
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="dhikr-detail-page app light">
      <div className="dhikr-detail-wrap">
        <Link to="/" className="dhikr-back-link">
          <ArrowLeft size={17} />
          Back to Dhikr list
        </Link>

        <section className="dhikr-detail-card">
          <span className="section-label">
            <BookOpen
              size={14}
              style={{
                verticalAlign: "middle",
                marginRight: 6,
              }}
            />
            DHIKR READING
          </span>

          <h1>{item.title}</h1>

          <div className="dhikr-detail-arabic" lang="ar" dir="rtl">
            {item.arabic}
          </div>

          <h2>Transliteration</h2>
          <p className="dhikr-detail-transliteration">
            {item.transliteration}
          </p>

          <h2>Meaning</h2>
          <p className="dhikr-detail-meaning">{item.meaning}</p>

          <p className="dhikr-detail-reference">
            <strong>Reference:</strong> {item.reference}
          </p>

          <div className="dhikr-reader-counter">
            <span className="section-label">YOUR RECITATION</span>

            <strong className="dhikr-reader-count">
              {count}
            </strong>

            <span className="dhikr-reader-target">
              Target: {target}
            </span>

            <div className="dhikr-reader-progress">
              <motion.div
                animate={{ width: `${progress}%` }}
              />
            </div>

            <div className="dhikr-reader-actions">
              <button
                className="action-button"
                onClick={() =>
                  setCount((n) => Math.max(0, n - 1))
                }
                disabled={count === 0}
              >
                <Minus size={16} />
                Undo
              </button>

              <button
                className="action-button dhikr-reader-add"
                onClick={() => setCount((n) => n + 1)}
              >
                <Plus size={17} />
                Count
              </button>

              <button
                className="action-button"
                onClick={() => setCount(0)}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>

          <p className="dhikr-detail-note">
            Please verify religious text and references against
            trusted Qur'an or hadith sources.
          </p>
        </section>
      </div>
    </main>
  );
}
