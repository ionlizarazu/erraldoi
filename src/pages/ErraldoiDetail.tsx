import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

interface ErraldoiData {
  id: string;
  izena: string;
  deskribapena?: string;
  irudia?: string;
  altuera?: string;
  pisua?: string;
  konpartsaLabel?: string;
  konpartsaId?: string;
  herriaLabel?: string;
  urtea?: string;
  egilea?: string;
  zerIrudikatzen?: string;
  wikipediaUrl?: string;
}

interface ErraldoiKidea {
  id: string;
  izena: string;
  irudia?: string;
}

export default function ErraldoiDetail() {
  const { id } = useParams();
  const [data, setData] = useState<ErraldoiData | null>(null);
  const [konpartsaKideak, setKonpartsaKideak] = useState<ErraldoiKidea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const query = `
        SELECT ?item ?itemLabel ?itemDescription ?irudia ?altuera ?pisua ?konpartsa ?konpartsaLabel ?herriaLabel ?urtea ?egileaLabel ?egileIzena ?zerLabel ?wikipedia WHERE {
          BIND(wd:${id} AS ?item)
          OPTIONAL { ?item wdt:P18 ?irudia. }
          OPTIONAL { ?item wdt:P2048 ?altuera. }
          OPTIONAL { ?item wdt:P2067 ?pisua. }
          OPTIONAL { ?item wdt:P361 ?konpartsa. }
          OPTIONAL { ?item wdt:P131 ?herria. }
          OPTIONAL { ?item wdt:P571 ?urtea. }
          OPTIONAL { ?item wdt:P170 ?egilea. }
          OPTIONAL { ?item wdt:P2093 ?egileIzena. }
          OPTIONAL { ?item wdt:P180 ?zer. }
          OPTIONAL {
            ?wikipedia schema:about ?item;
              schema:isPartOf <https://eu.wikipedia.org/>.
          }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],eu,es,en". }
        }
      `;

      try {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
        const response = await fetch(url);
        const json = await response.json();
        const b = json.results.bindings[0];

        if (b) {
          const giantData: ErraldoiData = {
            id: id || "",
            izena: b.itemLabel.value,
            deskribapena: b.itemDescription?.value,
            irudia: b.irudia?.value,
            altuera: b.altuera?.value,
            pisua: b.pisua?.value,
            konpartsaLabel: b.konpartsaLabel?.value,
            konpartsaId: b.konpartsa?.value.split('/').pop(),
            herriaLabel: b.herriaLabel?.value,
            urtea: b.urtea?.value ? new Date(b.urtea.value).getFullYear().toString() : undefined,
            egilea: b.egileIzena?.value || b.egileaLabel?.value,
            zerIrudikatzen: b.zerLabel?.value,
            wikipediaUrl: b.wikipedia?.value
          };
          setData(giantData);

          if (giantData.konpartsaId) {
            fetchKideak(giantData.konpartsaId, id || "");
          }
        }
      } catch (error) {
        console.error("Errorea datuak kargatzean:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchKideak = async (kId: string, currentId: string) => {
      const kQuery = `
        SELECT ?item ?itemLabel (SAMPLE(?irudia) AS ?irudia) WHERE {
          ?item wdt:P361 wd:${kId}.
          ?item wdt:P31/wdt:P279* wd:Q340069.
          FILTER(?item != wd:${currentId})
          OPTIONAL { ?item wdt:P18 ?irudia. }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],eu,es,en". }
        }
        GROUP BY ?item ?itemLabel
      `;
      try {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(kQuery)}&format=json`;
        const response = await fetch(url);
        const json = await response.json();
        const kideak = json.results.bindings.map((b: any) => ({
          id: b.item.value.split('/').pop(),
          izena: b.itemLabel.value,
          irudia: b.irudia?.value
        })).sort((a: any, b: any) => {
          if (a.irudia && !b.irudia) return -1;
          if (!a.irudia && b.irudia) return 1;
          return 0;
        });
        setKonpartsaKideak(kideak);
      } catch (e) {
        console.error("Errorea kideak kargatzean:", e);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return <div className="p-20 text-center text-primary font-headline text-2xl">Ez da erraldoia aurkitu.</div>;

  // Wikimedia Commons upload URL using depicts and caption parameters
  const uploadUrl = `https://commons.wikimedia.org/wiki/Special:UploadWizard?captionlang=eu&caption=${encodeURIComponent(data.izena)}&depicts=${data.id}`;

  return (
    <div className="bg-background text-on-surface font-body selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
      <main className="pt-12 pb-24 px-6 md:px-12 max-w-screen-2xl mx-auto">
        <nav className="mb-12 flex items-center gap-2 text-on-surface-variant font-label text-xs uppercase tracking-widest">
          <Link to="/erraldoiak" className="hover:text-primary transition-colors no-underline">Erraldoiak</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-bold">{data.izena}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-16 mb-24">
          <div className="w-full lg:w-1/2">
            <div className="bg-surface-container-high rounded-sm relative shadow-2xl overflow-hidden group">
              {data.irudia ? (
                <img 
                  src={data.irudia} 
                  alt={data.izena} 
                  className="w-full h-auto block object-contain max-h-[80vh] mx-auto"
                />
              ) : (
                <div className="aspect-[3/4] flex flex-col items-center justify-center text-outline-variant gap-8 p-12">
                  <span className="material-symbols-outlined text-9xl opacity-20">person</span>
                  <div className="text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.3em] mb-6">Irudirik gabe</p>
                    <a 
                      href={uploadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-amber-600 transition-colors no-underline shadow-lg"
                    >
                      <span className="material-symbols-outlined text-sm">add_a_photo</span>
                      GEHITU ARGAZKIA
                    </a>
                  </div>
                </div>
              )}
              {data.herriaLabel && (
                <div className="absolute top-8 left-8 bg-tertiary-fixed-dim text-on-tertiary-fixed px-4 py-2 rounded-sm text-xs font-bold tracking-widest uppercase shadow-lg">
                  {data.herriaLabel}
                </div>
              )}
            </div>
            {data.irudia && (
              <div className="mt-4 text-left">
                <a 
                  href={uploadUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-outline uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1 no-underline"
                >
                  <span className="material-symbols-outlined text-sm">add_a_photo</span>
                  Argazki hobe bat daukazu? Igo Commons-era
                </a>
              </div>
            )}
          </div>

          <div className="w-full lg:w-1/2 flex flex-col text-left">
            <header className="mb-12">
              <h1 className="font-headline text-5xl sm:text-6xl md:text-8xl font-extrabold text-primary mb-6 tracking-tighter leading-none break-words">
                {data.izena}
              </h1>
              <div className="h-1.5 w-32 bg-tertiary-fixed-dim rounded-full mb-8"></div>
              {data.deskribapena && (
                <p className="text-xl md:text-2xl text-on-surface-variant font-light leading-relaxed italic border-l-4 border-surface-container-highest pl-6 mb-8">
                  {data.deskribapena}
                </p>
              )}
              {data.konpartsaId && (
                <Link to={`/konpartsa/${data.konpartsaId}`} className="text-2xl font-bold text-primary hover:text-amber-600 transition-colors flex items-center gap-2 group no-underline mb-4">
                  <span className="material-symbols-outlined">groups</span>
                  {data.konpartsaLabel}
                </Link>
              )}
            </header>

            <div className="grid grid-cols-2 gap-y-10 gap-x-8 mb-16 bg-surface-container-low p-10 rounded-lg border border-surface-container-high">
              <div>
                <span className="block text-xs uppercase tracking-[0.2em] text-outline mb-2 font-bold">Altuera</span>
                <span className="text-3xl font-headline font-bold text-primary">{data.altuera ? `${data.altuera}m` : "---"}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-[0.2em] text-outline mb-2 font-bold">Pisua</span>
                <span className="text-3xl font-headline font-bold text-primary">{data.pisua ? `${data.pisua}kg` : "---"}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-[0.2em] text-outline mb-2 font-bold">Sorrera urtea</span>
                <span className="text-xl font-bold text-on-surface">{data.urtea || "---"}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-[0.2em] text-outline mb-2 font-bold">Egilea</span>
                <span className="text-xl font-bold text-on-surface">{data.egilea || "---"}</span>
              </div>
              <div className="col-span-2 pt-6 border-t border-outline-variant/20">
                <span className="block text-xs uppercase tracking-[0.2em] text-outline mb-2 font-bold">Zer irudikatzen duen</span>
                <span className="text-xl font-bold text-on-surface">{data.zerIrudikatzen || "---"}</span>
              </div>
            </div>

            {/* External Links */}
            <div className="flex flex-wrap gap-4 mb-12">
              <a 
                href={`https://www.wikidata.org/wiki/${data.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-primary rounded-md text-xs font-bold tracking-widest uppercase hover:bg-primary hover:text-white transition-all no-underline border border-primary/10"
              >
                <img src="https://www.wikidata.org/static/favicon/wikidata.ico" alt="" className="w-4 h-4" />
                Wikidata
              </a>
              {data.wikipediaUrl && (
                <a 
                  href={data.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-primary rounded-md text-xs font-bold tracking-widest uppercase hover:bg-primary hover:text-white transition-all no-underline border border-primary/10"
                >
                  <img src="https://eu.wikipedia.org/static/favicon/wikipedia.ico" alt="" className="w-4 h-4" />
                  Wikipedia
                </a>
              )}
            </div>

            <div className="mt-auto">
              <Link to="/erraldoiak" className="inline-flex items-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-lg font-bold hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 no-underline">
                <span className="material-symbols-outlined">arrow_back</span>
                ZERRENDARA ITZULI
              </Link>
            </div>
          </div>
        </div>

        {konpartsaKideak.length > 0 && (
          <section className="mt-24 border-t border-surface-container-highest pt-16 text-left">
            <h2 className="font-headline text-4xl font-extrabold text-primary mb-12 tracking-tight">
              Konpartsako kideak
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {konpartsaKideak.map((kidea) => (
                <Link 
                  key={kidea.id} 
                  to={`/erraldoi/${kidea.id}`}
                  className="group flex flex-col no-underline transition-transform hover:-translate-y-2"
                >
                  <div className="aspect-[2/3] bg-surface-container-high rounded-sm overflow-hidden mb-4 shadow-md">
                    {kidea.irudia ? (
                      <img 
                        src={kidea.irudia} 
                        alt={kidea.izena} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-outline-variant">
                        <span className="material-symbols-outlined text-4xl">person</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-headline text-sm font-bold text-on-surface group-hover:text-primary transition-colors text-center line-clamp-2">
                    {kidea.izena}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
