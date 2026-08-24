'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Mic, MicOff, Send, Volume2, VolumeX, X } from 'lucide-react'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Xin chào! Mình là VietVerse AI 🤖. Bạn có thể nhắn tin hoặc bấm mic để nói chuyện với mình.' },
  ])
  const recognitionRef = useRef<any>(null)

  useEffect(() => () => { recognitionRef.current?.stop(); window.speechSynthesis?.cancel() }, [])

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'vi-VN'
    utter.rate = 1
    utter.onstart = () => setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utter)
  }

  const toggleMic = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setMessages(m => [...m, { role: 'assistant', content: 'Trình duyệt này chưa hỗ trợ nhận giọng nói. Bạn có thể dùng Chrome/Edge.' }]); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'vi-VN'; recognition.interimResults = false; recognition.continuous = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event: any) => setInput(event.results[0][0].transcript)
    recognitionRef.current = recognition
    recognition.start()
  }

  const send = async () => {
    const text = input.trim(); if (!text || loading) return
    setInput(''); setMessages(m => [...m, { role: 'user', content: text }]); setLoading(true)
    try {
      const history = [...messages, { role: 'user' as const, content: text }].slice(-12)
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI chưa sẵn sàng.')
      const answer = String(data.content || 'Mình chưa có câu trả lời.')
      setMessages(m => [...m, { role: 'assistant', content: answer }])
      speak(answer)
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: e instanceof Error ? e.message : 'Không thể kết nối AI.' }])
    } finally { setLoading(false) }
  }

  return <>
    <button className="aiFab" onClick={() => setOpen(true)} aria-label="Mở VietVerse AI"><Bot size={22}/><span>AI</span></button>
    {open && <div className="aiOverlay"><section className="aiPanel">
      <header className="aiHeader"><div><b>🤖 VietVerse AI</b><small>Chat + nói chuyện bằng giọng nói</small></div><div className="aiHeadActions"><button onClick={() => { if (speaking) window.speechSynthesis?.cancel(); setSpeaking(false) }} title="Dừng đọc"><VolumeX size={17}/></button><button onClick={() => setOpen(false)} title="Đóng"><X size={19}/></button></div></header>
      <div className="aiMessages">{messages.map((m, i) => <div className={`aiMsg ${m.role}`} key={i}><span>{m.role === 'assistant' ? '🤖' : '👤'}</span><p>{m.content}</p>{m.role === 'assistant' && <button className="aiSpeak" onClick={() => speak(m.content)}><Volume2 size={14}/></button>}</div>)}{loading && <div className="aiMsg assistant"><span>🤖</span><p>Đang suy nghĩ…</p></div>}</div>
      <div className="aiInput"><button className={listening ? 'aiMic listening' : 'aiMic'} onClick={toggleMic} title="Nói"><>{listening ? <MicOff size={19}/> : <Mic size={19}/>}</></button><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={listening ? 'Đang nghe…' : 'Hỏi VietVerse AI…'} /><button className="aiSend" onClick={send} disabled={loading || !input.trim()}><Send size={18}/></button></div>
      <footer className="aiFooter">🔒 API key được giữ ở server, không đưa vào trình duyệt.</footer>
    </section></div>}
  </>
}
