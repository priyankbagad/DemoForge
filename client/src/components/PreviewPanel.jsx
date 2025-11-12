import React, { useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { motion } from 'framer-motion'
import JourneyBar from './JourneyBar'

function buildBody(params){
  const b = {}
  params.forEach(p=>{
    if (!p.key) return
    if (p.type==='number'){ const n=Number(p.value); b[p.key]=Number.isNaN(n)?p.value:n }
    else if (p.type==='boolean'){ b[p.key] = String(p.value)==='true' }
    else { b[p.key] = p.value }
  })
  return b
}

export function buildExportConfig(endpoint, params){
  return { endpoint, params: params.map(({key,type,value})=>({key,type,value})) }
}

export default function PreviewPanel({ endpoint, params, onExport, onResponse }){
  const [tab, setTab] = useState('request')
  const [isTesting, setIsTesting] = useState(false)
  const [last, setLast] = useState(null)
  const [resp, setResp] = useState(null)
  const [pulse, setPulse] = useState(false)

  const body = useMemo(()=> buildBody(params), [params])

  const requestText = useMemo(()=> {
    const url = (endpoint.baseUrl||'https://api.example.com') + (endpoint.path||'/endpoint')
    return `${endpoint.method||'POST'} ${url}\nContent-Type: application/json\n\n${JSON.stringify(body,null,2)}`
  }, [endpoint, body])

  const responseText = useMemo(()=> JSON.stringify(resp || {
    ok: true, echo: body, meta:{ note:'Simulated response', traceId: 'df-'+Math.random().toString(16).slice(2,10) }
  }, null, 2), [resp, body])

  const test = () => {
    setIsTesting(true)
    setTimeout(()=>{
      const r = { ok: true, echo: body, meta:{ latencyMs: 110 + Math.round(Math.random()*60), env:'sandbox' } }
      setResp(r)
      setIsTesting(false)
      setLast(new Date())
      setTab('response')
      setPulse(true); setTimeout(()=> setPulse(false), 900)
      onResponse && onResponse(r)
    }, 1200)
  }

  const status = isTesting ? 'Running simulated call…'
    : last ? `Last run: ${last.toLocaleTimeString()}`
    : 'Ready to simulate'

  const downloadHtml = (filename, html) => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  const exportHtml = () => {
    const cfg = buildExportConfig(endpoint, params)
    const html = `<!doctype html><html><head><meta charset="UTF-8"><title>${endpoint.useCase||'API Demo'}</title></head><body><pre>${requestText}</pre><script>window.DEMO=${JSON.stringify(cfg)}</script></body></html>`
    const name = (endpoint.useCase||'api-demo').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
    downloadHtml(name+'.html', html)
  }

  return (
    <div className="panel">
      <div className="section-head">
        <div className="section-title">Live Preview</div>
        <div className="tabbar">
          <button className={'tab'+(tab==='request'?' active':'')} onClick={()=>setTab('request')}>Postcard</button>
          <button className={'tab'+(tab==='response'?' active':'')} onClick={()=>setTab('response')}>Parcel</button>
        </div>
      </div>

      <JourneyBar running={isTesting} ok={true} />

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,color:'var(--muted)',fontSize:12}}>
        <div>{endpoint.method || 'POST'} · {endpoint.path || '/endpoint'} · {Object.keys(body).length} fields</div>
        <div>{status}</div>
      </div>

      <motion.div className="editor-shell" animate={{ scale: pulse?1.02:1 }} transition={{ duration: .25 }}>
        <Editor
          height="320px"
          defaultLanguage="json"
          theme="vs-dark"
          value={tab==='request' ? `${endpoint.method} ${(endpoint.baseUrl||'https://api.example.com')+(endpoint.path||'/endpoint')}
Headers:
  Content-Type: application/json

Body:
${JSON.stringify(body,null,2)}` : responseText}
          options={{ readOnly:true, minimap:{enabled:false}, scrollBeyondLastLine:false, lineNumbers:'off', fontSize:13, padding:{top:10} }}
        />
      </motion.div>

      <div className="section-head" style={{marginTop:10}}>
        <div className="section-title">Actions</div>
        <div>
          <button className="btn" onClick={test} disabled={isTesting}>{isTesting?'Simulating…':'Test API demo'}</button>
          <button className="btn btn-ghost" style={{marginLeft:8}} onClick={exportHtml}>Export HTML</button>
        </div>
      </div>
    </div>
  )
}
