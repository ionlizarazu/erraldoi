export default function Footer() {
  return (
    <footer className="w-full py-16 bg-slate-50 border-t border-surface-container-highest mt-auto">
      <div className="max-w-screen-2xl mx-auto px-8 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-headline font-black text-primary tracking-tight">
            erraldoi.eus
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-primary font-headline font-bold text-xs uppercase tracking-widest">
          <a
            href="https://eu.wikipedia.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-600 transition-colors no-underline flex items-center gap-2"
          >
            <img src="https://eu.wikipedia.org/static/favicon/wikipedia.ico" alt="" className="w-4 h-4 opacity-70" />
            Wikipedia
          </a>
          <a
            href="https://www.wikidata.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-600 transition-colors no-underline flex items-center gap-2"
          >
            <img src="https://www.wikidata.org/static/favicon/wikidata.ico" alt="" className="w-4 h-4 opacity-70" />
            Wikidata
          </a>
          <a
            href="https://commons.wikimedia.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-600 transition-colors no-underline flex items-center gap-2"
          >
            <img src="https://commons.wikimedia.org/static/favicon/commons.ico" alt="" className="w-4 h-4 opacity-70" />
            Wikimedia Commons
          </a>
        </div>

      </div>
    </footer>
  );
}
