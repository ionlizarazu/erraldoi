import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Konpartsa {
  id: string;
  izena: string;
  herria: string;
  irudia?: string;
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
          <mark key={i} className="bg-amber-200 text-primary font-bold px-0.5 rounded-sm">{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export default function KonpartsakList() {
  const [konpartsak, setKonpartsak] = useState<Konpartsa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredKonpartsak = konpartsak.filter(k => {
    const search = searchTerm.toLowerCase().trim();
    return (k.izena?.toLowerCase() || "").includes(search) ||
           (k.herria?.toLowerCase() || "").includes(search);
  });

  useEffect(() => {
    const fetchKonpartsak = async () => {
      // Query hobetua GROUP BY erabiliz herri eta irudi bikoiztuak ekiditeko
      const query = `
        SELECT ?item ?itemLabel (SAMPLE(?herriaLabel) AS ?herria) (SAMPLE(?irudia) AS ?irudia) WHERE {
          ?item wdt:P31/wdt:P279* wd:Q130353547.
          ?item wdt:P131 ?herriaItem.
          ?herriaItem (wdt:P131/(wdt:P131*)/^wdt:P527) wd:Q47588.
          OPTIONAL { ?item wdt:P18 ?irudia. }
          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "[AUTO_LANGUAGE],eu,es,en".
            ?herriaItem rdfs:label ?herriaLabel.
            ?item rdfs:label ?itemLabel.
          }
        }
        GROUP BY ?item ?itemLabel
      `;

      try {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        const results = data.results.bindings.map((b: any) => ({
          id: b.item.value.split('/').pop(),
          izena: b.itemLabel.value,
          herria: b.herria?.value || "Ezezaguna",
          irudia: b.irudia?.value
        })).sort((a: any, b: any) => {
          if (a.irudia && !b.irudia) return -1;
          if (!a.irudia && b.irudia) return 1;
          return 0;
        });

        setKonpartsak(results);
      } catch (error) {
        console.error("Errorea Wikidatako datuak lortzean:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKonpartsak();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body selection:bg-tertiary-fixed-dim selection:text-on-tertiary-fixed">
      <main className="pb-24 px-6 md:px-12 max-w-screen-2xl mx-auto">
        <header className="mb-20 ml-[5%] pt-12 text-left">
          <h1 className="text-7xl md:text-8xl font-headline font-extrabold text-primary tracking-tighter leading-none mb-6">
            Konpartsen<br />Zerrenda
          </h1>
          <div className="h-1.5 w-24 bg-tertiary-fixed-dim rounded-full mb-6"></div>
          <p className="text-on-surface-variant text-lg leading-relaxed font-light italic mb-2">
            Ezagutu gure konpartsak.
          </p>
          <p className="text-outline text-xs uppercase tracking-widest font-bold mb-8">
            Informazio guztia Wikipedia, Wikidata eta Wikimedia Commons proiektuetatik dator.
          </p>
          {searchTerm && (
            <p className="text-on-surface-variant font-label text-sm uppercase tracking-widest animate-pulse">
               "{searchTerm}" bilatzen...
            </p>
          )}
        </header>

        <div className="mb-16 bg-surface-container-low p-8 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96 text-left">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary rounded-lg font-body placeholder:text-outline-variant text-on-surface"
              placeholder="Bilatu konpartsa edo herria..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="text-sm font-label text-on-surface-variant uppercase tracking-widest">
            {filteredKonpartsak.length} emaitza {searchTerm ? 'aurkitu dira' : 'guztira'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredKonpartsak.length > 0 ? (
            filteredKonpartsak.map((k) => (
              <Link
                key={k.id}
                to={`/konpartsa/${k.id}`}
                className="group bg-surface-container-lowest rounded-lg overflow-hidden flex transition-colors hover:bg-surface-bright no-underline border border-transparent hover:border-surface-container-highest shadow-sm"
              >
                <div className="w-1/3 aspect-square overflow-hidden bg-surface-container">
                  {k.irudia ? (
                    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={k.izena} src={k.irudia} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-outline-variant">
                      <span className="material-symbols-outlined text-5xl">museum</span>
                    </div>
                  )}
                </div>
                <div className="w-2/3 p-6 flex flex-col justify-center text-left">
                  <h3 className="text-xl font-headline font-bold text-primary mb-1 group-hover:text-amber-600 transition-colors">
                    <Highlight text={k.izena} highlight={searchTerm} />
                  </h3>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <span className="text-sm font-label font-medium uppercase tracking-wider">
                      <Highlight text={k.herria} highlight={searchTerm} />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-2 py-20 text-center text-on-surface-variant italic text-xl">
              Ez da emaitzarik aurkitu "{searchTerm}" bilaketarako.
            </div>
          )}
        </div>

        <section className="mt-32 flex flex-col md:flex-row items-center gap-12 bg-primary text-on-primary p-12 rounded-lg relative overflow-hidden shadow-xl">
          <div className="z-10 w-full md:w-1/2 text-left">
            <h2 className="text-4xl font-headline font-bold mb-4 tracking-tight">Parte hartu artxiboan</h2>
            <p className="text-lg opacity-90 mb-8 max-w-md font-light">Lagun gaitzazu gure ondarea bizirik mantentzen. Bidali zure konpartsaren informazioa eta argazkiak.</p>
            <button className="bg-tertiary-fixed-dim text-on-tertiary-fixed px-8 py-3 rounded-lg font-bold tracking-wide transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95">BIDALI INFORMAZIOA</button>
          </div>
          <div className="z-10 w-full md:w-1/2 flex justify-end">
            <div className="grid grid-cols-2 gap-4 rotate-6 opacity-40">
              <div className="w-24 h-24 bg-white rounded-lg"></div>
              <div className="w-24 h-24 bg-secondary-container rounded-lg translate-y-8"></div>
              <div className="w-24 h-24 bg-tertiary-fixed rounded-lg -translate-y-4"></div>
              <div className="w-24 h-24 bg-primary-container rounded-lg translate-y-4"></div>
            </div>
          </div>
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </section>
      </main>

      <footer className="w-full py-12 bg-slate-100 border-t border-surface-container-highest mt-20">
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 px-6 text-center font-body text-sm uppercase tracking-widest">
          <div className="text-sm font-bold text-slate-500">© Euskal Folklorearen Artxiboa</div>
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="material-symbols-outlined text-lg">copyright</span>
            <span className="hover:text-amber-500 transition-colors">Creative Commons Aitortu</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
