'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Garden from '@/components/Garden'
import { useChat } from '@ai-sdk/react'

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

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { gardenStats: stats },
  })

  useEffect(() => {
    async function getStats() {
      const { data } = await supabase.from('garden_stats').select('*').limit(1).single()
      if (data) setStats(data)
    }
    getStats()
  }, [])

  return (
    <main className="min-h-screen bg-[#F0F4F2] flex items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-md h-[90vh] flex flex-col gap-4">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-serif text-emerald-900">Grove</h1>
        </div>

        {/* 1. Garden Section */}
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <Garden stats={stats} />
        </div>

        {/* 2. Chat Section */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
              <p className="text-slate-400 text-center text-sm mt-10 italic">
                The Grove is quiet. Start a conversation...
              </p>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                  m.role === 'user' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-white border border-emerald-100 text-emerald-900 shadow-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form 
            onSubmit={(e) => {
              console.log("Submit button clicked!");
              handleSubmit(e);
             }} 
            className="p-4 bg-white border-t border-emerald-50">
            <div className="flex gap-2">
              <input
                className="flex-1 p-3 rounded-xl bg-slate-100 border-none text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-black"
                value={input}
                placeholder="Message Grove..."
                onChange={handleInputChange}
              />
              <button 
                type="submit" 
                disabled={isLoading}
                className="bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
