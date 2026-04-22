import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

interface KonpartsaData {
  id: string;
  izena: string;
  irudia?: string;
  herriaLabel?: string;
  urtea?: string;
  wikipediaUrl?: string;
}

interface ErraldoiKidea {
  id: string;
  izena: string;
  zerLabel?: string;
  irudia?: string;
}

export default function KonpartsaDetail() {
  const { id } = useParams();
  const [data, setData] = useState<KonpartsaData | null>(null);
  const [erraldoiak, setErraldoiak] = useState<ErraldoiKidea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const query = `
        SELECT ?item ?itemLabel ?irudia ?herriaLabel ?urtea ?wikipedia WHERE {
          BIND(wd:${id} AS ?item)
          OPTIONAL { ?item wdt:P18 ?irudia. }
          OPTIONAL { ?item wdt:P131 ?herria. }
          OPTIONAL { ?item wdt:P571 ?urtea. }
          OPTIONAL {
            ?wikipedia schema:about ?item;
              schema:isPartOf <https://eu.wikipedia.org/>.
          }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],eu,es,en". }
        }
      `;

      const erraldoiQuery = `
        SELECT ?item ?itemLabel (SAMPLE(?irudia) AS ?irudia) (SAMPLE(?zerLabel) AS ?zerLabel) WHERE {
          ?item wdt:P361 wd:${id}.
          ?item wdt:P31/wdt:P279* wd:Q340069.
          OPTIONAL { ?item wdt:P18 ?irudia. }
          OPTIONAL { ?item wdt:P180 ?zer. ?zer rdfs:label ?zerLabel. FILTER(LANG(?zerLabel) = "eu") }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],eu,es,en". }
        }
        GROUP BY ?item ?itemLabel
      `;

      try {
        const [res, eRes] = await Promise.all([
          fetch(
            `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`,
          ),
          fetch(
            `https://query.wikidata.org/sparql?query=${encodeURIComponent(erraldoiQuery)}&format=json`,
          ),
        ]);

        const [json, eJson] = await Promise.all([res.json(), eRes.json()]);
        const b = json.results.bindings[0];

        if (b) {
          setData({
            id: id || "",
            izena: b.itemLabel.value,
            irudia: b.irudia?.value,
            herriaLabel: b.herriaLabel?.value,
            urtea: b.urtea?.value ? new Date(b.urtea.value).getFullYear().toString() : undefined,
            wikipediaUrl: b.wikipedia?.value
          });
        }


        const eKideak = eJson.results.bindings.map((k: any) => ({
          id: k.item.value.split("/").pop(),
          izena: k.itemLabel.value,
          zerLabel: k.zerLabel?.value,
          irudia: k.irudia?.value,
        }));
        setErraldoiak(eKideak);
      } catch (error) {
        console.error("Errorea kargatzean:", error);
      } finally {
        setLoading(false);
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

  if (!data)
    return (
      <div className="p-20 text-center text-primary font-headline text-2xl">
        Ez da konpartsa aurkitu.
      </div>
    );

  const uploadUrl = `https://commons.wikimedia.org/wiki/Special:UploadWizard?captionlang=eu&caption=${encodeURIComponent(data.izena)}&categories=Figures_of_giants&wikidataItem=${data.id}`;

  return (
    <div className="bg-background text-on-surface font-body selection:bg-tertiary-fixed-dim selection:text-tertiary">
      <main className="min-h-screen">
        {/* High-Impact Hero Section */}
        <section className="relative w-full h-[60vh] md:h-[75vh] overflow-hidden bg-primary-container">
          {data.irudia ? (
            <img
              src={data.irudia}
              alt={data.izena}
              className="w-full h-full object-cover opacity-80 mix-blend-overlay"
            />
          ) : (
            <div className="w-full h-full bg-primary opacity-40"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-20 z-10 text-left">
            <div className="max-w-6xl mx-auto">
              <span className="inline-block px-4 py-1 mb-4 rounded-full bg-tertiary-fixed-dim text-tertiary font-bold text-xs uppercase tracking-widest shadow-lg">
                Konpartsa
              </span>
              <h1 className="font-headline font-black text-5xl sm:text-7xl md:text-8xl text-white tracking-tighter leading-none mb-6 break-words">
                {data.izena}
              </h1>
            </div>
          </div>
        </section>

        {/* Information Section */}
        <section className="relative z-20 -mt-12 px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 bg-surface-container-lowest p-8 shadow-sm rounded-xl border-l-4 border-primary text-left">
                <div className="flex flex-col space-y-2">
                  <span className="font-label text-xs font-bold text-secondary uppercase tracking-widest">
                    Jatorria
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-primary text-3xl">
                      location_on
                    </span>
                    <p className="font-headline font-bold text-2xl text-on-surface">
                      {data.herriaLabel || "Ezezaguna"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-4 bg-surface-container-lowest p-8 shadow-sm rounded-xl border-l-4 border-tertiary-fixed-dim text-left">
                <div className="flex flex-col space-y-2">
                  <span className="font-label text-xs font-bold text-secondary uppercase tracking-widest">
                    Sorrera urtea
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-tertiary-fixed-dim text-3xl">
                      history_edu
                    </span>
                    <p className="font-headline font-bold text-2xl text-on-surface">
                      {data.urtea || "---"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block md:col-span-4 p-8 text-left">
                <p className="font-body text-on-surface-variant italic leading-relaxed mb-6">
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <a
                    href={`https://www.wikidata.org/wiki/${data.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-primary rounded-md text-[10px] font-bold tracking-widest uppercase hover:bg-primary hover:text-white transition-all no-underline border border-primary/10 shadow-sm"
                  >
                    <img src="https://www.wikidata.org/static/favicon/wikidata.ico" alt="" className="w-3 h-3" />
                    Wikidata
                  </a>
                  {data.wikipediaUrl && (
                    <a
                      href={data.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-primary rounded-md text-[10px] font-bold tracking-widest uppercase hover:bg-primary hover:text-white transition-all no-underline border border-primary/10 shadow-sm"
                    >
                      <img src="https://eu.wikipedia.org/static/favicon/wikipedia.ico" alt="" className="w-3 h-3" />
                      Wikipedia
                    </a>
                  )}
                </div>

                <a
                  href={uploadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-xs tracking-widest uppercase hover:bg-amber-600 transition-all no-underline shadow-md active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">
                    add_a_photo
                  </span>
                  Gehitu argazkia
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Giants List Section */}
        <section className="bg-surface-container-low py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <header className="mb-16 text-left">
              <h2 className="font-headline font-extrabold text-4xl text-primary mb-4">
                Erraldoiak
              </h2>
              <div className="w-24 h-1.5 bg-tertiary-fixed-dim"></div>
            </header>

            {erraldoiak.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {erraldoiak.map((e) => (
                  <Link
                    key={e.id}
                    to={`/erraldoi/${e.id}`}
                    className="group flex flex-col space-y-4 no-underline text-left"
                  >
                    <div className="aspect-[2/3] overflow-hidden rounded-xl bg-surface-container-high relative shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1">
                      {e.irudia ? (
                        <img
                          src={e.irudia}
                          alt={e.izena}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-outline-variant">
                          <span className="material-symbols-outlined text-6xl opacity-40">
                            accessibility_new
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg text-primary group-hover:text-amber-600 transition-colors">
                        {e.izena}
                      </h3>
                      {e.zerLabel && (
                        <p className="font-label text-xs text-secondary uppercase font-semibold tracking-wider">
                          {e.zerLabel}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-on-surface-variant italic">
                Ez da erraldoiik aurkitu konpartsa honetan.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

