'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Garden from '@/components/Garden'
import { growPlant } from './actions/growth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [stats, setStats] = useState<any>({
    investor_oak_growth: 20,
    typing_bamboo_growth: 20,
    family_rose_growth: 20
  })

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refresh stats from database
  const refreshStats = async () => {
    const { data } = await supabase.from('garden_stats').select('*').limit(1).single();
    if (data) setStats(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          gardenStats: stats
        })
      });

      if (!response.ok) {
        // Handle API quota errors
        const errorText = await response.text();

        let errorMessage = "Sorry, Grove is taking a quick break. Try again in a moment! 🌱";
        if (errorText.includes('quota')) {
          errorMessage = "Grove needs a moment to rest (API quota reached). Try the manual buttons or wait 30 seconds! 🌿";
        }

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMessage
        }]);

        setIsLoading(false);
        return;
      }

      const data = await response.json();

      console.log('📨 Response:', data);

      // Add assistant message
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Refresh stats to show any changes
      await refreshStats();

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oops! Grove stumbled. Please try again! 🌱"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrowth = async (plant: string, increment: number = 5) => {
    await growPlant(plant, increment);
    await refreshStats();
  };

  useEffect(() => {
    async function getStats() {
      const { data } = await supabase.from('garden_stats').select('*').limit(1).single()
      if (data) setStats(data)
    }
    getStats()
  }, [])

  return (
    <main className="min-h-screen bg-[#F0F4F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[600px] bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden flex flex-col">

        <div className="text-center pt-4">
          <h1 className="text-2xl font-serif text-emerald-900">Grove</h1>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <Garden stats={stats} />
        </div>

        {/* Manual Growth Buttons */}
        <div className="flex gap-2 justify-center py-2">
          <button onClick={() => handleGrowth('investor_oak')} className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 shadow-md active:scale-95 transition-all">
            📧 Sent Email
          </button>
          <button onClick={() => handleGrowth('typing_bamboo')} className="text-xs bg-amber-500 text-white px-4 py-2 rounded-full hover:bg-amber-600 shadow-md active:scale-95 transition-all">
            ⌨️ Practiced Typing
          </button>
          <button onClick={() => handleGrowth('family_rose')} className="text-xs bg-rose-500 text-white px-4 py-2 rounded-full hover:bg-rose-600 shadow-md active:scale-95 transition-all">
            📞 Called Home
          </button>
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
              <p className="text-slate-400 text-center text-sm mt-10 italic">
                The Grove is quiet. Start a conversation...
              </p>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.role === 'user'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white border border-emerald-100 text-emerald-900 shadow-sm'
                  }`}>
                  {m.content || '...'}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-emerald-50">
            <div className="flex gap-2">
              <input
                className="flex-1 p-3 rounded-xl bg-slate-100 border-none text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-black"
                value={input}
                placeholder="Message Grove..."
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}