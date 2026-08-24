'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Car, Gamepad2, Map, MessageCircle, Mic, Users, Zap } from 'lucide-react'
import './game.css'

type Player = { id: string; username: string; x: number; z: number; color: string; updated: number }
type Config = { url: string; anon: string }

const MODES = [
  { id: 'nhatrang', name: 'Nha Trang Life', icon: '🌴', desc: 'Phố biển Việt Nam · roleplay', sky: '#8ed8ff' },
  { id: 'vietbattle', name: 'Viet Battle', icon: '⚔️', desc: 'FFA · đấu trường đường phố', sky: '#c5b8ff' },
  { id: 'nongtrai', name: 'Nông Trại Việt', icon: '🌾', desc: 'Nông trại · khám phá · chill', sky: '#b8e6a2' },
  { id: 'duongpho', name: 'Đường Phố VN', icon: '🏍️', desc: 'Đua xe · drift · giao thông', sky: '#ffc58c' },
]
const palette = ['#2878ff', '#e24b4b', '#22a06b', '#9b59b6', '#f39c12', '#00a8cc']

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null), socketRef = useRef<WebSocket | null>(null), playersRef = useRef<Record<string, Player>>({}), localRef = useRef({ x: 0, z: 5, yaw: 0 }), keys = useRef<Record<string, boolean>>({})
  const [user, setUser] = useState<{ id: string; username: string } | null>(null), [mode, setMode] = useState('nhatrang'), [online, setOnline] = useState(1), [connected, setConnected] = useState(false), [chat, setChat] = useState<string[]>(['VietVerse: Chào mừng đến thành phố Việt Nam 🇻🇳']), [text, setText] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user ? { id: d.user.id, username: d.user.username } : null)).catch(() => {})
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true }, up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    addEventListener('keydown', down); addEventListener('keyup', up)
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); socketRef.current?.close() }
  }, [])

  useEffect(() => {
    let cancelled = false, timer: number | undefined
    const connect = async () => {
      try {
        const cfg = await fetch('/api/realtime/config').then(r => r.json()) as Config
        if (cancelled || !cfg.url || !cfg.anon) return
        const uid = user?.id || crypto.randomUUID(), topic = `realtime:game:${mode}`
        const ws = new WebSocket(`${cfg.url.replace(/^http/, 'ws').replace(/\/$/, '')}/realtime/v1/websocket?apikey=${encodeURIComponent(cfg.anon)}&vsn=1.0.0`)
        socketRef.current = ws
        const send = (event: string, payload: unknown) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ topic, event, payload, ref: String(Date.now()) }))
        ws.onopen = () => { setConnected(true); send('phx_join', { config: { broadcast: { ack: false, self: false }, presence: { key: uid } } }) }
        ws.onclose = () => setConnected(false); ws.onerror = () => setConnected(false)
        ws.onmessage = ev => { try { const msg = JSON.parse(ev.data); if (msg.event === 'broadcast' && msg.payload?.event === 'player') { const p = msg.payload.payload as Player; if (p?.id && p.id !== uid) playersRef.current[p.id] = p } if (msg.event === 'presence_state') setOnline(Math.max(1, Object.keys(msg.payload || {}).length)); if (msg.event === 'broadcast' && msg.payload?.event === 'chat') { const m = String(msg.payload.payload?.text || ''); if (m) setChat(c => [...c.slice(-30), `${msg.payload.payload.username || 'Player'}: ${m}`]) } } catch {} }
        timer = window.setInterval(() => { const p = localRef.current; send('broadcast', { type: 'broadcast', event: 'player', payload: { id: uid, username: user?.username || 'Player', x: p.x, z: p.z, color: palette[uid.charCodeAt(0) % palette.length], updated: Date.now() } }) }, 120)
      } catch { setConnected(false) }
    }
    connect()
    return () => { cancelled = true; if (timer) clearInterval(timer); socketRef.current?.close(); socketRef.current = null }
  }, [mode, user?.id, user?.username])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d')!; let raf = 0
    const resize = () => { const dpr = Math.min(2, devicePixelRatio || 1); canvas.width = innerWidth*dpr; canvas.height = innerHeight*dpr; canvas.style.width = innerWidth+'px'; canvas.style.height = innerHeight+'px'; ctx.setTransform(dpr,0,0,dpr,0,0) }
    resize(); addEventListener('resize', resize)
    const project = (x:number,y:number,z:number) => { const p=localRef.current, dx=x-p.x,dz=z-p.z,c=Math.cos(-p.yaw),s=Math.sin(-p.yaw),cx=dx*c-dz*s,cz=dx*s+dz*c,depth=cz+1; if(depth<=.5)return null; const f=Math.min(innerWidth,innerHeight)*.85; return {x:innerWidth/2+(cx/depth)*f,y:innerHeight*.54-(y/depth)*f,d:depth} }
    const poly=(pts:{x:number;y:number}[],fill:string)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
    const building=(x:number,z:number,w:number,h:number,color:string)=>{const a=project(x-w,0,z),b=project(x+w,0,z),c=project(x+w,h,z),d=project(x-w,h,z);if(!a||!b||!c||!d)return;poly([a,b,c,d],color);const roof=project(x,h+.15,z);if(roof)poly([{x:c.x,y:c.y},{x:roof.x,y:roof.y},{x:d.x,y:d.y}],'#f4f4f4');for(let yy=1;yy<h;yy+=1.1)for(let xx=-w+.35;xx<w;xx+=.8){const q1=project(x+xx,yy,z-.03),q2=project(x+xx+.38,yy,z-.03),q3=project(x+xx+.38,yy+.35,z-.03),q4=project(x+xx,yy+.35,z-.03);if(q1&&q2&&q3&&q4)poly([q1,q2,q3,q4],'#dff1ff')}}
    const drawPlayer=(p:Player,local=false)=>{const base=project(p.x,0,p.z),head=project(p.x,1.65,p.z);if(!base||!head)return;const r=Math.max(4,26/base.d);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(head.x,head.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.fillText(local?'Bạn':p.username,head.x,head.y-r-7)}
    const draw=()=>{const p=localRef.current,k=keys.current,speed=k.shift?.22:.11;let dx=0,dz=0;if(k.w||k.arrowup)dz+=speed;if(k.s||k.arrowdown)dz-=speed;if(k.a||k.arrowleft)dx-=speed;if(k.d||k.arrowright)dx+=speed;p.x+=Math.cos(p.yaw)*dx+Math.sin(p.yaw)*dz;p.z+=Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz;ctx.clearRect(0,0,innerWidth,innerHeight);const sky=MODES.find(m=>m.id===mode)?.sky||'#8ed8ff',g=ctx.createLinearGradient(0,0,0,innerHeight);g.addColorStop(0,sky);g.addColorStop(.55,'#dff6ff');g.addColorStop(.56,'#9bcf7d');g.addColorStop(1,'#6ca35b');ctx.fillStyle=g;ctx.fillRect(0,0,innerWidth,innerHeight);ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(innerWidth*.78,innerHeight*.18,42,0,Math.PI*2);ctx.fill();for(let z=-35;z<45;z+=5){const a=project(-5,0,z),b=project(5,0,z),c=project(5,.03,z+4.8),d=project(-5,.03,z+4.8);if(a&&b&&c&&d)poly([a,b,c,d],z%10===0?'#3b3b3b':'#454545')}for(let z=-35;z<45;z+=6){const a=project(-.15,.04,z),b=project(.15,.04,z),c=project(.15,.04,z+3),d=project(-.15,.04,z+3);if(a&&b&&c&&d)poly([a,b,c,d],'#f8d34a')}for(let z=-30;z<40;z+=7){building(-9,z,2.5,3+(Math.abs(z)%3),'#ef8d7a');building(9,z+2,2.5,4+(Math.abs(z)%2),'#f1c56f')}for(let z=-28;z<40;z+=5){const base=project(-6.2,.1,z),top=project(-6.2,2,z);if(base&&top){ctx.strokeStyle='#6a482e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(top.x,top.y);ctx.stroke();ctx.fillStyle='#2f9e58';ctx.beginPath();ctx.arc(top.x,top.y,16/top.d*5,0,Math.PI*2);ctx.fill()}}Object.values(playersRef.current).filter(q=>Date.now()-q.updated<2500).forEach(q=>drawPlayer(q));drawPlayer({id:'local',username:user?.username||'Bạn',x:p.x,z:p.z,color:'#2878ff',updated:Date.now()},true);raf=requestAnimationFrame(draw)}
    draw(); return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize)}
  },[mode,user?.username])

  const sendChat=()=>{const value=text.trim();if(!value)return;setChat(c=>[...c.slice(-30),`${user?.username||'Player'}: ${value}`]);const ws=socketRef.current;if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify({topic:`realtime:game:${mode}`,event:'broadcast',payload:{type:'broadcast',event:'chat',payload:{username:user?.username||'Player',text:value}},ref:String(Date.now())}));setText('')}
  const current=MODES.find(m=>m.id===mode)!
  return <main className="game3d"><canvas ref={canvasRef}/><div className="gameHud top"><a className="back" href="/"><ArrowLeft size={18}/> VietVerse</a><div className="mode"><Gamepad2 size={17}/><b>{current.name}</b><span>{connected?'🟢 Multiplayer':'🟠 Solo / reconnecting'}</span></div><div className="players"><Users size={16}/>{online}</div></div><div className="gameHud left"><div className="modes">{MODES.map(m=><button key={m.id} className={m.id===mode?'active':''} onClick={()=>{setMode(m.id);playersRef.current={}}}><span>{m.icon}</span><b>{m.name}</b><small>{m.desc}</small></button>)}</div></div><div className="gameHud right"><div className="miniMap"><Map size={16}/><span>VIETVERSE MAP</span><i/><i/><i/><i/></div><div className="quest"><b>🇻🇳 Nhiệm vụ</b><p>Khám phá phố Việt</p><small>WASD / ↑↓←→ · Shift chạy</small></div></div><div className="gameHud bottom"><div className="chatbox">{chat.slice(-4).map((m,i)=><div key={i}>{m}</div>)}<div className="chatSend"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Chat trong phòng..."/><button onClick={sendChat}><MessageCircle size={17}/></button><button title="Micro"><Mic size={17}/></button></div></div><div className="actions3d"><button><Car size={18}/> Xe</button><button><Zap size={18}/> Sprint</button></div></div><div className="mobileHint">🎮 Bàn phím: WASD hoặc phím mũi tên.</div></main>
}
