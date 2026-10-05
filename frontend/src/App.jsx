import { useEffect, useRef, useState } from 'react';
import { Menu, Moon, Sun, BookOpen } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { queryResearch } from './api';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('research-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch { return 'light'; }
  });
  const request = useRef(null);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('research-theme', theme); } catch { /* Storage may be unavailable. */ }
  }, [theme]);
  useEffect(() => () => request.current?.abort(), []);

  async function sendQuestion(text) {
    const question = text.trim();
    if (!question || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setMessages((previous) => [...previous, { id: crypto.randomUUID(), role: 'user', content: question }]);
    setLoading(true);
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const answer = await queryResearch(question, controller.signal);
      setMessages((previous) => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: answer }]);
    } catch (error) {
      setMessages((previous) => [...previous, { id: crypto.randomUUID(), role: 'error', content: error.name === 'AbortError' ? 'The request timed out after two minutes. Please try again or check the backend.' : error.message, question }]);
    } finally {
      clearTimeout(timeout);
      request.current = null;
      setLoading(false);
    }
  }

  return <div className="flex h-dvh overflow-hidden bg-paper text-ink">
    <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={() => { setMessages([]); setSidebarOpen(false); }} loading={loading} />
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-line px-5 md:px-10">
        <div className="flex items-center gap-3"><button className="icon-button lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar" aria-expanded={sidebarOpen}><Menu size={20} /></button><BookOpen className="hidden text-accent sm:block" size={18} /><span className="text-sm font-medium">Research workspace</span><span className="hidden rounded-md border border-line px-2 py-0.5 text-[10px] tracking-wider text-muted sm:block">PERSONAL</span></div>
        <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
      </header>
      <ChatWindow messages={messages} loading={loading} onSend={sendQuestion} />
    </main>
  </div>;
}
