import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowUpRight, Sparkles, AlignLeft, Lightbulb, ScanText, Bot, User, AlertCircle, LoaderCircle, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const suggestions = [
  { icon: AlignLeft, title: 'Find the big picture', description: 'Summarize the key findings', question: 'Summarize the key findings of the research paper.' },
  { icon: ScanText, title: 'Go a level deeper', description: 'Understand the methodology', question: 'Explain the methodology used in the research paper.' },
  { icon: Lightbulb, title: 'Explore what’s next', description: 'Identify gaps and limitations', question: 'What are the limitations and open research questions in the paper?' },
];

export default function ChatWindow({ messages, loading, onSend }) {
  const [input, setInput] = useState('');
  const bottom = useRef(null);
  const textarea = useRef(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'end' }); }, [messages, loading]);
  useEffect(() => { if (textarea.current) { textarea.current.style.height = 'auto'; textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 144)}px`; } }, [input]);
  function submit(event) {
    event.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
    textarea.current?.focus();
  }

  return <>
    <div className="min-h-0 flex-1 overflow-y-auto px-5 md:px-10">
      {messages.length === 0 ? <section className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-12">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel text-accent"><Sparkles size={26} strokeWidth={1.4} /></div>
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">Your ideas. Grounded in research.</p>
        <h1 className="max-w-xl font-display text-4xl leading-[1.16] tracking-tight sm:text-5xl">Great research starts<br className="hidden sm:block" /> with a good question.</h1>
        <p className="mt-5 max-w-lg text-sm leading-7 text-muted">Turn your papers into a conversation. Uncover key insights, make sense of complex ideas, and find your next direction.</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">{suggestions.map(({ icon: Icon, title, description, question }) => <button key={title} onClick={() => { setInput(question); textarea.current?.focus(); }} className="group rounded-xl border border-line bg-panel p-4 text-left transition hover:-translate-y-0.5 hover:border-accent"><div className="mb-5 flex justify-between"><Icon size={19} className="text-accent" strokeWidth={1.5} /><ArrowUpRight size={15} className="text-muted transition group-hover:text-accent" /></div><p className="text-xs font-semibold">{title}</p><p className="mt-2 text-[11px] leading-5 text-muted">{description}</p></button>)}</div>
        <p className="mt-6 text-[11px] text-muted">Choose a starting point, or ask your own question below.</p>
      </section> : <div role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions" className="mx-auto max-w-3xl space-y-7 py-9">
        {messages.map((message) => <article key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${message.role === 'user' ? 'border border-line bg-panel text-muted' : message.role === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-accent text-white'}`}>{message.role === 'user' ? <User size={16} /> : message.role === 'error' ? <AlertCircle size={16} /> : <Bot size={17} />}</div>
          <div className={`min-w-0 max-w-[calc(100%-44px)] ${message.role === 'user' ? 'rounded-2xl rounded-tr-sm border border-line bg-panel px-5 py-3' : 'flex-1 pt-1'}`}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">{message.role === 'user' ? 'You' : message.role === 'error' ? 'Request unsuccessful' : 'Research assistant'}</p>
            {message.role === 'assistant' ? <div className="answer"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>{message.content}</ReactMarkdown></div> : <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.content}</p>}
            {message.role === 'error' && <button className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-accent disabled:opacity-40" disabled={loading} onClick={() => onSend(message.question)}><RotateCcw size={13} /> Try again</button>}
          </div>
        </article>)}
        {loading && <div role="status" className="flex items-center gap-3 text-sm text-muted"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white"><LoaderCircle size={17} className="animate-spin" /></div>Reading your research<span className="animate-pulse">…</span></div>}
      </div>}
      <div ref={bottom} />
    </div>
    <footer className="shrink-0 bg-paper px-5 pb-5 pt-3 md:px-10">
      <form onSubmit={submit} className="mx-auto max-w-3xl rounded-2xl border border-line bg-panel p-3 shadow-sm transition focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
        <label htmlFor="question" className="sr-only">Ask a question about your research papers</label>
        <textarea id="question" ref={textarea} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event); }} rows={1} placeholder="Ask a question about your research papers..." className="max-h-36 min-h-12 w-full resize-none bg-transparent px-2 py-3 text-sm leading-6 outline-none placeholder:text-muted" />
        <div className="flex items-center justify-between px-2"><span className="text-[10px] text-muted">Enter to send <span className="mx-1">·</span> Shift + Enter for a new line</span><button type="submit" disabled={loading || !input.trim()} aria-label="Send question" className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-35">{loading ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowUp size={18} />}</button></div>
      </form>
      <p className="mx-auto mt-3 max-w-3xl text-center text-[10px] text-muted">AI can make mistakes. Verify important claims against the original sources.</p>
    </footer>
  </>;
}
