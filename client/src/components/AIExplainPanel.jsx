import React, { useState } from 'react'

export default function AIExplainPanel({ endpoint, requestBody, responseBody, status }){
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const callAI = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const payload = {
        endpoint: endpoint || {},
        requestBody: requestBody || {},
        responseBody: responseBody || {},
        status: typeof status === 'number' ? status : 200
      }
      const r = await fetch('/api/explain', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify(payload)
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || 'LLM error')
      setResult(data)
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel" style={{marginTop:12}}>
      <div className="section-head">
        <div className="section-title">AI Explain (Claude)</div>
        <button className="btn" onClick={callAI} disabled={loading}>{loading ? 'Analyzing…' : 'Explain with AI'}</button>
      </div>
      {error ? <div style={{ color:'#ff8a8a' }}>{error}</div> : null}
      {result && (
        <div>
          <div style={{ fontWeight:700, marginBottom:8 }}>{result.narrative}</div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.max(result.timeline?.length||0,3)},1fr)`, gap:8, marginBottom:10 }}>
            {(result.timeline||[]).map((t,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:10, background: t.step.includes('error') ? '#ff6b6b' : '#75f9c1', boxShadow:'0 0 12px rgba(117,249,193,.5)' }} />
                <div style={{ fontSize:12, color:'var(--muted)' }}>{t.step}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {(result.key_values||[]).map((kv,i)=>(
              <div key={i} className="btn-ghost" style={{ border:'1px solid var(--line)', borderRadius:12, padding:'6px 10px', fontSize:12 }}>
                <strong>{kv.label}:</strong> {String(kv.value)}
              </div>
            ))}
          </div>
          {result.flags?.length ? <div style={{ marginTop:10, color:'#ffc37a', fontSize:12 }}>⚠️ {result.flags.join(' • ')}</div> : null}
        </div>
      )}
    </div>
  )
}
