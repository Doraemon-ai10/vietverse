'use client'

import { useState } from 'react'
import { Bell, Gamepad2, Shield, Sparkles, Trophy, UserRound, WalletCards } from 'lucide-react'

const games = [
  ['🌴','Nha Trang Life','Roleplay','Khám phá thành phố biển, lái xe và giao lưu.'],
  ['⚔️','Viet Battle','PvP','Đấu trường free-for-all với kỹ năng và bảng xếp hạng.'],
  ['🌾','Nông Trại Việt','Simulation','Trồng trọt, nâng cấp đảo và giao dịch vật phẩm.'],
  ['🏙️','Phố Việt RP','Roleplay','Xây nhà, làm nghề và tạo câu chuyện của riêng bạn.'],
]

export default function Home(){
 const [showLogin,setShowLogin]=useState(false)
 const [showOtp,setShowOtp]=useState(false)
 const [email,setEmail]=useState('')
 const [notice,setNotice]=useState('')
 const [coins,setCoins]=useState(1250)
 const [liked,setLiked]=useState<string[]>([])
 const [tab,setTab]=useState('home')
 const startSignup=()=>{if(!email.includes('@')){setNotice('Hãy nhập email hợp lệ.');return};setShowOtp(true);setNotice('Mã OTP 6 số đã được yêu cầu. Cấu hình Resend để gửi email thật.')}
 const verify=()=>{setShowOtp(false);setShowLogin(false);setNotice('🎉 Xác minh thành công! Bản demo tài khoản đã sẵn sàng.')}
 return <main className="vv">
  <nav className="nav"><div className="brand">🇻🇳 <span>Viet</span>Verse</div><div className="navlinks"><button className="pill hideMob" onClick={()=>setTab('games')}><Gamepad2 size={16}/> Game</button><button className="pill hideMob" onClick={()=>setTab('ranking')}><Trophy size={16}/> BXH</button><button className="pill" onClick={()=>setShowLogin(true)}><UserRound size={16}/> Đăng nhập</button></div></nav>
  <section className="hero"><div><span className="tag"><Sparkles size={13}/> V2 BIG UPDATE</span><h1>Một Việt Nam.<br/><span style={{color:'#2878ff'}}>Một thế giới.</span></h1><p>VietVerse là trung tâm game online dành cho cộng đồng Việt — avatar, bạn bè, game, chat, XP, coin và các sự kiện trong cùng một thế giới.</p><div className="actions"><button className="btn primary" onClick={()=>setNotice('🎮 Chọn một game bên dưới để bắt đầu!')}>Chơi ngay</button><button className="btn" onClick={()=>setShowLogin(true)}>Tạo tài khoản</button></div><div className="stats"><div className="stat"><small>Người chơi</small><br/><b>1,284</b></div><div className="stat"><small>Game</small><br/><b>4</b></div><div className="stat"><small>VietCoins</small><br/><b>{coins.toLocaleString()}</b></div></div></div><div className="heroCard"><Bell size={24}/><h2>Trung tâm thông báo</h2><p>Admin có thể phát thông báo, chọn thời gian hết hạn và hiển thị lại khi người chơi đăng nhập.</p><div className="notice">✨ Chào mừng đến VietVerse V2!<br/><small>Bản cập nhật lớn đang được xây dựng.</small></div></div></section>
  <section className="section" id="games"><h2>🎮 Khám phá game</h2><div className="games">{games.map(([e,n,t,d])=><button className="game" key={n} onClick={()=>{setNotice(`🚀 Đang chuẩn bị server ${n}...`);setLiked([...liked,n])}}><span className="emoji">{e}</span><strong>{n}</strong><small>{d}</small><br/><span className="tag">{t}</span></button>)}</div></section>
  <section className="section"><h2>🧩 Hệ thống VietVerse</h2><div className="games"><div className="game"><WalletCards/><strong>Wallet & Shop</strong><small>Coin, daily reward, shop và inventory.</small></div><div className="game"><UserRound/><strong>Avatar</strong><small>Tùy chỉnh nhân vật và lưu profile.</small></div><div className="game"><Shield/><strong>Admin</strong><small>Announcement, moderation và logs.</small></div><div className="game"><Trophy/><strong>XP & BXH</strong><small>Level, nhiệm vụ và leaderboard.</small></div></div></section>
  {notice&&<div className="section"><div className="notice">{notice}<button style={{float:'right',background:'transparent',color:'#fff',border:0}} onClick={()=>setNotice('')}>×</button></div></div>}
  <footer className="footer">VietVerse 🇻🇳 · V2 Foundation · {liked.length} game đã chọn</footer>
  {showLogin&&<div style={{position:'fixed',inset:0,background:'#10233f66',backdropFilter:'blur(8px)',zIndex:20,padding:'20px'}}><div className="login"><button style={{float:'right',border:0,background:'transparent'}} onClick={()=>setShowLogin(false)}>✕</button><h2>Đăng ký VietVerse</h2><p>Nhập email để nhận mã xác minh 6 số.</p><input className="field" type="email" placeholder="you@gmail.com" value={email} onChange={e=>setEmail(e.target.value)}/><input className="field" type="password" placeholder="Mật khẩu"/><button className="btn primary" style={{width:'100%'}} onClick={startSignup}>Gửi mã OTP</button><p style={{textAlign:'center',color:'#71849a'}}>Hoặc đăng nhập bằng Discord / Google khi OAuth được cấu hình.</p></div></div>}
  {showOtp&&<div style={{position:'fixed',inset:0,background:'#10233f66',backdropFilter:'blur(8px)',zIndex:30,padding:'20px'}}><div className="login"><h2>🔐 Xác minh email</h2><p>Mã 6 số đã được gửi tới <b>{email}</b>.</p><input className="field" inputMode="numeric" maxLength={6} placeholder="123456"/><button className="btn primary" style={{width:'100%'}} onClick={verify}>Xác minh</button><button className="btn" style={{width:'100%',marginTop:8}} onClick={startSignup}>Gửi lại mã</button></div></div>}
 </main>
}