import React from 'react'

export default function Header({ demo=false }){
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-dot" />
        <div>
          <div className="brand-title">DemoForge</div>
          <div className="brand-sub">Visual, animated API demos for humans.</div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {demo && (
          <div style={{
            padding:'4px 10px',
            border:'1px solid var(--line)',
            borderRadius:10,
            fontSize:12,
            color:'var(--ink)',
            background:'rgba(255,255,255,.06)'
          }}>
            Demo Mode — no credits used
          </div>
        )}
        <div className="brand-sub">Export as HTML · No backend required (for demos)</div>
      </div>
    </header>
  )
}
