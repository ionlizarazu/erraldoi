import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Erraldoia {
  id: string;
  izena: string;
  konpartsa: string;
  herria: string;
  irudia?: string;
  altuera?: string;
  pisua?: string;
}

// Hitzak nabarmentzeko osagai laguntzailea
function Highlight({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200 text-primary font-bold px-0.5 rounded-sm"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}

export default function ErraldoiakList() {
  const [erraldoiak, setErraldoiak] = useState<Erraldoia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredErraldoiak = erraldoiak.filter((e) => {
    const search = searchTerm.toLowerCase().trim();
    return (
      (e.izena?.toLowerCase() || "").includes(search) ||
      (e.konpartsa?.toLowerCase() || "").includes(search) ||
      (e.herria?.toLowerCase() || "").includes(search)
    );
  });

  useEffect(() => {
    const fetchErraldoiak = async () => {
      const query = `
        SELECT ?item ?itemLabel ?konpartsaLabel ?herriaLabel (SAMPLE(?irudia) AS ?irudia) (SAMPLE(?altuera) AS ?altuera) (SAMPLE(?pisua) AS ?pisua) WHERE {
          ?item wdt:P31/wdt:P279* wd:Q340069.
          ?item wdt:P131 ?herria.
          ?herria (wdt:P131/(wdt:P131*)/^wdt:P527) wd:Q47588.
          OPTIONAL { ?item wdt:P361 ?konpartsa. }
          OPTIONAL { ?item wdt:P18 ?irudia. }
          OPTIONAL { ?item wdt:P2048 ?altuera. }
          OPTIONAL { ?item wdt:P2067 ?pisua. }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],eu,es,en". }
        }
        GROUP BY ?item ?itemLabel ?konpartsaLabel ?herriaLabel
      `;

      try {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        const results = data.results.bindings
          .map((b: any) => ({
            id: b.item.value.split("/").pop(),
            izena: b.itemLabel.value,
            konpartsa: b.konpartsaLabel?.value || "Konpartsa ezezaguna",
            herria: b.herriaLabel?.value || "Ezezaguna",
            irudia: b.irudia?.value,
            altuera: b.altuera?.value,
            pisua: b.pisua?.value,
          }))
          .sort((a: any, b: any) => {
            if (a.irudia && !b.irudia) return -1;
            if (!a.irudia && b.irudia) return 1;
            return 0;
          });

        setErraldoiak(results);
      } catch (error) {
        console.error("Errorea Wikidatako datuak lortzean:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchErraldoiak();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
      <main className="pb-24 px-6 md:px-12 max-w-screen-2xl mx-auto">
        {/* Header Section (Matching KonpartsakList style) */}
        <header className="mb-20 ml-[5%] pt-12 text-left">
          <h1 className="text-7xl md:text-8xl font-headline font-extrabold text-primary tracking-tighter leading-none mb-6">
            Erraldoien
            <br />
            Zerrenda
          </h1>
          <div className="h-1.5 w-24 bg-tertiary-fixed-dim rounded-full mb-6"></div>
          <p className="text-on-surface-variant text-lg leading-relaxed font-light italic mb-2">
            Ezagutu gure erraldoiak.
          </p>
          <p className="text-outline text-xs uppercase tracking-widest font-bold mb-8">
            Informazio guztia Wikipedia, Wikidata eta Wikimedia Commons
            proiektuetatik dator.
          </p>
          {searchTerm && (
            <p className="text-primary font-label text-sm uppercase tracking-widest animate-pulse">
              "{searchTerm}" bilatzen...
            </p>
          )}
        </header>

        {/* Search & Filter Bar */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative group w-full max-w-2xl text-left">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">
                search
              </span>
            </div>
            <input
              className="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary transition-all duration-300"
              placeholder="Bilatu erraldoia, konpartsa edo herria..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="text-sm font-label text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
            {filteredErraldoiak.length} erraldoi{" "}
            {searchTerm ? "aurkitu dira" : "guztira"}
          </div>
        </div>

        {/* Giants Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredErraldoiak.length > 0 ? (
            filteredErraldoiak.map((e) => (
              <Link
                key={e.id}
                to={`/erraldoi/${e.id}`}
                className="group bg-surface-container-lowest overflow-hidden transition-all duration-500 no-underline border border-transparent hover:border-surface-container-highest flex flex-col shadow-sm hover:shadow-md"
              >
                <div className="aspect-[3/4] overflow-hidden bg-surface-variant relative">
                  {e.irudia ? (
                    <img
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      alt={e.izena}
                      src={e.irudia}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant gap-4">
                      <span className="material-symbols-outlined text-6xl">
                        person
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                        Irudirik gabe
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 bg-tertiary-fixed-dim text-on-tertiary-fixed px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase shadow-sm">
                    <Highlight text={e.herria} highlight={searchTerm} />
                  </div>
                </div>
                <div className="p-6 text-left flex flex-col flex-grow">
                  <h3 className="font-headline text-2xl font-bold text-primary mb-1 group-hover:text-amber-600 transition-colors line-clamp-1">
                    <Highlight text={e.izena} highlight={searchTerm} />
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-4 line-clamp-1 italic">
                    <Highlight text={e.konpartsa} highlight={searchTerm} />
                  </p>

                  <div className="mt-auto flex gap-6 border-t border-outline-variant/15 pt-4">
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest text-outline mb-1 font-bold">
                        Altuera
                      </span>
                      <span className="text-on-surface font-semibold text-sm">
                        {e.altuera ? `${e.altuera}m` : "---"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest text-outline mb-1 font-bold">
                        Pisua
                      </span>
                      <span className="text-on-surface font-semibold text-sm">
                        {e.pisua ? `${e.pisua}kg` : "---"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-on-surface-variant italic text-xl">
              Ez da emaitzarik aurkitu "{searchTerm}" bilaketarako.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
