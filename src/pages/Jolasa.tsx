import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Link } from "react-router-dom";

interface ErraldoiJolasa {
  id: string;
  izena: string;
  herria: string;
  irudia: string;
  altuera?: string;
  pisua?: string;
  urtea?: string;
}

type GalderaMota = "herria" | "altuera" | "pisua" | "urtea";

interface Galdera {
  testua: string;
  zuzena: string;
  okerra: string;
}

export default function Jolasa() {
  const [erraldoiak, setErraldoiak] = useState<ErraldoiJolasa[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [puntuazioa, setPuntuazioa] = useState(0);
  const [bizitzak, setBizitzak] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [galdera, setGaldera] = useState<Galdera | null>(null);
  const [feedback, setFeedback] = useState<"zuzena" | "okerra" | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    const fetchErraldoiak = async () => {
      const query = `
        SELECT DISTINCT ?item ?itemLabel ?herriaLabel ?irudia ?altuera ?pisua ?urtea WHERE {
          ?item wdt:P31/wdt:P279* wd:Q340069.
          ?item wdt:P131 ?herria.
          ?herria (wdt:P131/(wdt:P131*)/^wdt:P527) wd:Q47588.
          ?item wdt:P18 ?irudia.
          OPTIONAL { ?item wdt:P2048 ?altuera. }
          OPTIONAL { ?item wdt:P2067 ?pisua. }
          OPTIONAL { ?item wdt:P571 ?urtea. }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "eu,es,en". }
        }
        LIMIT 150
      `;

      try {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        const results = data.results.bindings.map((b: any) => ({
          id: b.item.value.split('/').pop(),
          izena: b.itemLabel.value,
          herria: b.herriaLabel?.value || "Ezezaguna",
          irudia: b.irudia?.value,
          altuera: b.altuera?.value,
          pisua: b.pisua?.value,
          urtea: b.urtea?.value ? new Date(b.urtea.value).getFullYear().toString() : undefined
        }));

        setErraldoiak(results.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error("Errorea datuak kargatzean:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchErraldoiak();
  }, []);

  const egungoErraldoia = erraldoiak[currentIndex];

  // Galdera dinamikoa sortu
  useEffect(() => {
    if (!egungoErraldoia) return;

    const motak: GalderaMota[] = ["herria"];
    if (egungoErraldoia.altuera) motak.push("altuera");
    if (egungoErraldoia.pisua) motak.push("pisua");
    if (egungoErraldoia.urtea) motak.push("urtea");

    const mota = motak[Math.floor(Math.random() * motak.length)];
    let testua = "";
    let zuzena = "";
    let okerra = "";

    switch (mota) {
      case "herria":
        testua = "Nongoa da erraldoi hau?";
        zuzena = egungoErraldoia.herria;
        okerra = erraldoiak.find(e => e.herria !== zuzena)?.herria || "Donostia";
        break;
      case "altuera":
        testua = "Zein da bere altuera?";
        zuzena = `${egungoErraldoia.altuera}m`;
        okerra = `${(parseFloat(egungoErraldoia.altuera!) + 0.5).toFixed(2)}m`;
        break;
      case "pisua":
        testua = "Zenbat pisatzen du?";
        zuzena = `${egungoErraldoia.pisua}kg`;
        okerra = `${(parseFloat(egungoErraldoia.pisua!) - 10).toFixed(0)}kg`;
        break;
      case "urtea":
        testua = "Zein urtetan sortu zen?";
        zuzena = egungoErraldoia.urtea!;
        okerra = (parseInt(zuzena) - 25).toString();
        break;
    }

    setGaldera({ testua, zuzena, okerra });
    x.set(0);
  }, [currentIndex, egungoErraldoia, erraldoiak]);

  const aukerak = useMemo(() => {
    if (!galdera) return null;
    return [galdera.zuzena, galdera.okerra].sort(() => Math.random() - 0.5);
  }, [galdera]);

  const handleErantzuna = (hautatutakoa: string) => {
    if (!galdera || feedback) return;

    if (hautatutakoa === galdera.zuzena) {
      setFeedback("zuzena");
      setPuntuazioa(p => p + 1);
    } else {
      setFeedback("okerra");
      const berriaBizitzak = bizitzak - 1;
      setBizitzak(berriaBizitzak);
    }

    setTimeout(() => {
      setFeedback(null);
      if (bizitzak <= (hautatutakoa === galdera.zuzena ? 0 : 1)) {
        if (hautatutakoa !== galdera.zuzena && bizitzak === 1) {
            setGameOver(true);
            return;
        }
      }

      if (currentIndex < erraldoiak.length - 1) {
        setCurrentIndex(c => c + 1);
      } else {
        setGameOver(true);
      }
    }, 600);
  };

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    if (info.offset.x < -threshold) {
      handleErantzuna(aukerak![0]);
    } else if (info.offset.x > threshold) {
      handleErantzuna(aukerak![1]);
    }
  };

  const jokoaBerrekin = () => {
    window.location.reload();
  };

  const partekatuEmaitza = async () => {
    const testua = `👹 Erraldoiak asmatzen ${puntuazioa} puntu lortu ditut erraldoi.eus jokoan! Zu gai zara nire marka hobetzeko?`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'erraldoi.eus Jolasa',
          text: testua,
          url: url,
        });
      } catch (err) {
        console.error('Errorea partekatzean:', err);
      }
    } else {
      // Ordezko gisa arbelean kopiatu
      try {
        await navigator.clipboard.writeText(`${testua} ${url}`);
        alert('Emaitza arbelean kopiatu da!');
      } catch (err) {
        console.error('Errorea kopiatzean:', err);
      }
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (gameOver) return (
    <div className="max-w-2xl mx-auto py-20 text-center flex flex-col items-center gap-8 px-6">
      <h1 className="text-6xl font-headline font-black text-primary tracking-tighter leading-tight">Jokoa<br/>Amaitu da</h1>
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-outline mb-2">Zure puntuazioa</span>
        <div className="text-9xl font-black text-amber-500 drop-shadow-lg">{puntuazioa}</div>
      </div>
      <p className="text-xl font-body text-on-surface-variant max-w-sm italic leading-relaxed">
        {puntuazioa > 10 ? "Biba zu! Erraldoiak bikain ezagutzen dituzu." : "Lan ona, baina oraindik badago zer ikasi gure ondareaz."}
      </p>
      
      <div className="flex flex-col w-full max-w-xs gap-4 mt-4">
        <button 
          onClick={partekatuEmaitza}
          className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold tracking-widest uppercase hover:bg-amber-600 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
        >
          <span className="material-symbols-outlined">share</span>
          PARTEKATU EMAITZA
        </button>
        <button 
          onClick={jokoaBerrekin}
          className="bg-slate-200 text-primary px-10 py-4 rounded-full font-bold tracking-widest uppercase hover:bg-slate-300 transition-all active:scale-95"
        >
          BERRIRO SAIATU
        </button>
      </div>

      <Link to="/erraldoiak" className="text-primary font-bold uppercase tracking-widest text-sm hover:underline mt-8 flex items-center gap-2">
        <span className="material-symbols-outlined">explore</span>
        Erraldoiak aztertu
      </Link>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-12 flex flex-col items-center min-h-[calc(100vh-80px)] sm:min-h-[80vh] overflow-hidden relative justify-center">
      <div className="w-full flex justify-between items-center mb-4 sm:mb-8">
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Puntuazioa</p>
          <p className="text-2xl sm:text-3xl font-black text-primary">{puntuazioa}</p>
        </div>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <span key={i} className={`material-symbols-outlined text-2xl sm:text-3xl ${i < bizitzak ? 'text-red-500' : 'text-slate-200'}`} style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          ))}
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-headline font-black text-primary mb-1 text-center leading-tight">{galdera?.testua}</h2>
      <p className="text-[10px] text-outline uppercase tracking-widest mb-4 sm:mb-8">Arrastatu erantzunera</p>

      <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-w-[320px] sm:max-w-[350px]">
        {/* Aukerak orrialdean bertan idatzita (Gida gisa) */}
        <div className="absolute -left-12 sm:-left-16 top-1/2 -translate-y-1/2 -rotate-90 text-outline font-black uppercase tracking-widest opacity-20 text-sm sm:text-xl pointer-events-none w-64 text-center">
            {aukerak?.[0]}
        </div>
        <div className="absolute -right-12 sm:-right-16 top-1/2 -translate-y-1/2 rotate-90 text-outline font-black uppercase tracking-widest opacity-20 text-sm sm:text-xl pointer-events-none w-64 text-center">
            {aukerak?.[1]}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.05 }}
            className={`w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 cursor-grab active:cursor-grabbing flex flex-col transition-colors duration-300 ${
              feedback === "zuzena" ? "ring-8 ring-green-500" : feedback === "okerra" ? "ring-8 ring-red-500" : ""
            }`}
          >
            <div className="flex-grow overflow-hidden bg-slate-100 relative">
              <img src={egungoErraldoia.irudia} alt="" className="w-full h-full object-cover object-top pointer-events-none" />
              
              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-20 flex items-center justify-center ${
                      feedback === "zuzena" ? "bg-green-500/40" : "bg-red-500/40"
                    } backdrop-blur-sm`}
                  >
                    <span className="material-symbols-outlined text-white text-9xl font-black drop-shadow-lg">
                      {feedback === "zuzena" ? "check_circle" : "cancel"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="p-6 text-center bg-white border-t border-slate-50">
              <h3 className="text-2xl font-headline font-bold text-primary uppercase tracking-tight">{egungoErraldoia.izena}</h3>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full mt-8 sm:mt-12 max-w-[320px] sm:max-w-[350px]">
        {aukerak?.map((a, i) => (
          <button 
            key={i} 
            onClick={() => handleErantzuna(a)} 
            className="bg-white border-2 border-primary/10 py-4 sm:py-5 px-2 rounded-2xl font-black text-primary hover:bg-primary hover:text-white hover:border-primary transition-all text-[11px] sm:text-xs uppercase tracking-[0.2em] active:scale-95 shadow-lg shadow-primary/5 hover:shadow-primary/20"
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
