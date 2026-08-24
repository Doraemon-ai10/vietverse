'use client'

import { useEffect, useState } from 'react'

export default function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (!visible || !installEvent) return null
  return (
    <div style={{position:'fixed',left:16,right:16,bottom:16,zIndex:9999,display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:16,background:'rgba(9,18,32,.94)',color:'#fff',boxShadow:'0 12px 40px rgba(0,0,0,.3)',backdropFilter:'blur(12px)'}}>
      <div style={{fontSize:24}}>🎮</div>
      <div style={{flex:1}}><b>Cài VietVerse</b><div style={{fontSize:12,opacity:.75}}>Chơi như app trên điện thoại hoặc PC.</div></div>
      <button onClick={async () => { await installEvent.prompt(); setVisible(false); setInstallEvent(null) }} style={{border:0,borderRadius:10,padding:'9px 13px',fontWeight:800,cursor:'pointer'}}>Cài đặt</button>
      <button onClick={() => setVisible(false)} aria-label="Đóng" style={{border:0,background:'transparent',color:'#fff',fontSize:20,cursor:'pointer'}}>×</button>
    </div>
  )
}
