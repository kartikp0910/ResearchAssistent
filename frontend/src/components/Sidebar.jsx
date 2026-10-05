import { useEffect, useRef } from 'react';
import { BookOpen, Plus, FileText, Upload, X, ArrowUpRight, Library } from 'lucide-react';

export default function Sidebar({ open, onClose, onNewChat, loading }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    panel.current?.querySelector('button')?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const items = [...panel.current.querySelectorAll('button:not(:disabled), a[href]')].filter((element) => element.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [open, onClose]);
  return <>
    {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
    <aside ref={panel} aria-label="Research library" className={`${open ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-40 w-[280px] shrink-0 flex-col border-r border-line bg-panel p-6 lg:static lg:flex`}>
      <div className="mb-9 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white"><BookOpen size={22} strokeWidth={1.6} /></div><div><div className="font-display text-lg font-bold">Research RAG</div><div className="text-[10px] uppercase tracking-[0.24em] text-muted">Assistant</div></div><button onClick={onClose} className="icon-button ml-auto lg:hidden" aria-label="Close sidebar"><X size={18} /></button></div>
      <button onClick={onNewChat} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-paper py-3 text-sm font-medium transition hover:border-accent disabled:opacity-40"><Plus size={17} /> New conversation</button>
      <div className="mb-4 mt-10 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted"><span>Your library</span><span className="rounded bg-paper px-2 py-1">01</span></div>
      <div className="rounded-xl border border-line bg-paper p-3.5"><div className="flex items-center gap-3"><FileText size={20} className="shrink-0 text-accent" /><div className="min-w-0"><p className="truncate text-sm font-medium">sample_paper.txt</p><p className="mt-1 text-[11px] text-muted">Placeholder document</p></div></div><div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[10px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Example ingestion indicator</div></div>
      <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-line px-2 py-3 text-xs text-muted"><Upload size={14} /> Upload integration coming soon</div>
      <div className="mt-auto pt-10"><div className="rounded-xl border border-line p-4"><Library size={18} className="mb-3 text-accent" /><p className="text-xs font-medium">A little clarity, a lot of discovery.</p><p className="mt-2 text-xs leading-relaxed text-muted">Ask questions, connect ideas, and explore your research.</p></div><a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-between text-xs text-muted hover:text-ink">Local API documentation<ArrowUpRight size={14} /></a></div>
    </aside>
  </>;
}
