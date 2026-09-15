import { useState } from 'react';
import { ExternalLink, Music, Search, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PLAYLIST_SUGGERITE, apriSpotify, normalizzaLink, urlRicerca } from '../lib/spotify';
import { Button, Card, Field, Sheet, inputCls } from './ui';

export function MusicaSheet({
  open,
  onClose,
  chiave,
  titolo,
}: {
  open: boolean;
  onClose: () => void;
  chiave: string;
  titolo: string;
}) {
  const playlist = useStore((s) => s.playlist);
  const setPlaylist = useStore((s) => s.setPlaylist);

  const [link, setLink] = useState('');
  const [errore, setErrore] = useState('');

  const attuale = playlist[chiave] ?? playlist.default;
  const propria = !!playlist[chiave];

  const salva = () => {
    const url = normalizzaLink(link);
    if (!url) {
      setErrore("Non sembra un link di Spotify. Copia l'indirizzo dal menu Condividi della playlist.");
      return;
    }
    const nome = link.includes('album') ? 'Album' : link.includes('track') ? 'Brano' : 'Playlist';
    setPlaylist(chiave, { nome, url });
    setLink('');
    setErrore('');
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Musica · ${titolo}`}>
      <div className="space-y-4">
        {attuale && (
          <Card className="!bg-raise">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-500">
                <Music size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{attuale.nome}</p>
                <p className="truncate text-[11px] text-muted">
                  {propria ? 'Associata a questa scheda' : 'Playlist predefinita'}
                </p>
              </div>
              {propria && (
                <button
                  onClick={() => setPlaylist(chiave, null)}
                  className="rounded-lg p-2 text-muted hover:text-red-500"
                  aria-label="Rimuovi"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <Button full className="mt-3" onClick={() => apriSpotify(attuale.url)}>
              <ExternalLink size={14} className="mr-1.5 -mt-0.5 inline" /> Apri in Spotify
            </Button>
          </Card>
        )}

        <Field
          label="Incolla un link Spotify"
          hint="Su Spotify: tieni premuto sulla playlist, Condividi, Copia link."
        >
          <input
            className={inputCls}
            placeholder="https://open.spotify.com/playlist/…"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setErrore('');
            }}
          />
        </Field>
        {errore && <p className="-mt-2 text-[11px] text-red-500">{errore}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" disabled={!link.trim()} onClick={salva}>
            Salva per la scheda
          </Button>
          <Button
            variant="outline"
            disabled={!link.trim()}
            onClick={() => {
              const url = normalizzaLink(link);
              if (!url) {
                setErrore('Link non valido.');
                return;
              }
              setPlaylist('default', { nome: 'Playlist predefinita', url });
              setLink('');
              setErrore('');
            }}
          >
            Usa per tutte
          </Button>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Playlist da cercare
          </p>
          <div className="space-y-2">
            {PLAYLIST_SUGGERITE.map((p) => (
              <button
                key={p.nome}
                onClick={() => apriSpotify(urlRicerca(p.query))}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-raise px-3.5 py-2.5 text-left"
              >
                <Search size={14} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.nome}</span>
                  <span className="block text-[11px] text-muted">{p.per}</span>
                </span>
                <ExternalLink size={13} className="shrink-0 text-muted" />
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
            Aprono la ricerca di Spotify, non un indirizzo fisso: così il link non si rompe se la
            playlist cambia. Una volta trovata quella giusta, incolla il suo link qui sopra per
            associarla alla scheda.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
