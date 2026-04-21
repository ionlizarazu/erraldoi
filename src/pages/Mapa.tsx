import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet ikonoak kargatu
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface ErraldoiInfo {
  id: string;
  izena: string;
  irudia?: string;
  konpartsa?: string;
}

interface KokapenTaldea {
  lat: number;
  lon: number;
  herria: string;
  erraldoiak: ErraldoiInfo[];
}

export default function Mapa() {
  const [taldeak, setTaldeak] = useState<KokapenTaldea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatuak = async () => {
      const query = `
        SELECT DISTINCT ?item ?itemLabel ?herriaLabel ?konpartsaLabel ?irudia ?koordenatuak WHERE {
          ?item wdt:P31/wdt:P279* wd:Q340069.
          ?item wdt:P131 ?herria.
          ?item wdt:P361 ?konpartsa.
          ?herria (wdt:P131/(wdt:P131*)/^wdt:P527) wd:Q47588.
          ?herria wdt:P625 ?koordenatuak.
          OPTIONAL { ?item wdt:P18 ?irudia. }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "eu,es,en". }
        }
        LIMIT 500
      `;

      try {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        // Taldekatze logika
        const map = new Map<string, KokapenTaldea>();

        data.results.bindings.forEach((b: any) => {
          const rawCoords = b.koordenatuak.value;
          const match = rawCoords.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
          if (!match) return;

          const lat = parseFloat(match[2]);
          const lon = parseFloat(match[1]);
          const key = `${lat},${lon}`;
          const herria = b.herriaLabel?.value || "Ezezaguna";

          if (!map.has(key)) {
            map.set(key, { lat, lon, herria, erraldoiak: [] });
          }

          map.get(key)!.erraldoiak.push({
            id: b.item.value.split('/').pop(),
            izena: b.itemLabel.value,
            irudia: b.irudia?.value,
            konpartsa: b.konpartsaLabel?.value
          });
        });

        setTaldeak(Array.from(map.values()));
      } catch (error) {
        console.error("Errorea datuak kargatzean:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatuak();
  }, []);

  return (
    <div className="bg-background min-h-screen font-body">
      <main className="pb-24 px-6 md:px-12 max-w-screen-2xl mx-auto pt-12">
        <header className="mb-12 text-left">
          <h1 className="text-7xl md:text-8xl font-headline font-extrabold text-primary tracking-tighter leading-none mb-6">
            Ondarearen<br />Mapa
          </h1>
          <div className="h-1.5 w-24 bg-tertiary-fixed-dim rounded-full mb-6"></div>
          <p className="text-on-surface-variant text-lg leading-relaxed font-light italic mb-2">
            Euskal Herriko erraldoiak herriz herri kokatuta.
          </p>
          <p className="text-outline text-xs uppercase tracking-widest font-bold">
            Klikatu herri batean bertako erraldoi guztiak ikusteko.
          </p>
        </header>

        {loading ? (
          <div className="h-[600px] flex justify-center items-center bg-surface-container-low rounded-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="h-[700px] w-full rounded-2xl overflow-hidden border border-surface-container-highest shadow-2xl relative z-10">
            <MapContainer center={[43.0, -2.0]} zoom={8} className="h-full w-full">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
              />
              {taldeak.map((taldea, idx) => (
                <Marker 
                  key={`${idx}`} 
                  position={[taldea.lat, taldea.lon]} 
                  icon={defaultIcon}
                >
                  <Popup minWidth={250} maxWidth={350}>
                    <div className="p-1 text-left font-body">
                      <h3 className="font-headline font-bold text-primary text-xl border-b border-surface-container-highest pb-2 mb-4">
                        {taldea.herria}
                        <span className="block text-[10px] text-outline uppercase tracking-[0.2em] font-bold mt-1">
                          {taldea.erraldoiak.length} erraldoi dokumentatuta
                        </span>
                      </h3>
                      
                      <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {taldea.erraldoiak.map((e) => (
                          <div key={e.id} className="flex items-center gap-4 mb-4 group">
                            <div className="w-12 h-12 flex-shrink-0 bg-surface-container overflow-hidden rounded-md">
                              {e.irudia ? (
                                <img src={e.irudia} alt={e.izena} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-outline-variant">
                                  <span className="material-symbols-outlined text-xl">person</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <h4 className="font-bold text-sm text-on-surface truncate m-0">{e.izena}</h4>
                              <p className="text-[9px] text-outline uppercase tracking-wider truncate m-0">{e.konpartsa || "Konpartsa gabe"}</p>
                              <Link 
                                to={`/erraldoi/${e.id}`}
                                className="text-[10px] font-bold text-primary hover:text-amber-600 no-underline uppercase tracking-widest mt-1 inline-block"
                              >
                                Fitxa ikusi
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
        
        <div className="mt-8 text-left flex justify-between items-center">
          <p className="text-on-surface-variant text-sm font-medium uppercase tracking-widest">
            {taldeak.length} herri erregistratuta
          </p>
        </div>
      </main>
    </div>
  );
}
