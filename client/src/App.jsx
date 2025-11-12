import React, { useMemo, useState, useEffect } from 'react'
import Background from './components/Background'
import Header from './components/Header'
import EndpointForm, { PRESETS } from './components/EndpointForm'
import ParamBuilder from './components/ParamBuilder'
import PreviewPanel from './components/PreviewPanel'
import AIExplainPanel from './components/AIExplainPanel'

function buildBody(params){
  const b = {}; params.forEach(p=>{
    if (!p.key) return
    if (p.type==='number'){ const n=Number(p.value); b[p.key]=Number.isNaN(n)?p.value:n }
    else if (p.type==='boolean'){ b[p.key] = String(p.value)==='true' }
    else { b[p.key] = p.value }
  }); return b;
}

export default function App(){
  const [endpoint, setEndpoint] = useState({
    method:'POST',
    path:'/charges',
    baseUrl:'https://api.example.com',
    useCase:'Create a customer charge',
    description:'Turn an endpoint into a 15-minute story: define fields, preview the request, and export a shareable playground.'
  })
  const [params, setParams] = useState([
    { key:'amount', type:'number', value:'1999' },
    { key:'currency', type:'string', value:'USD' },
    { key:'customer_id', type:'string', value:'cust_123' },
  ])
  const [latest, setLatest] = useState(null)

  // NEW: read demo flag from server
  const [demo, setDemo] = useState(false)
  useEffect(()=>{
    fetch('/health').then(r=>r.json()).then(d=> setDemo(!!d.demo)).catch(()=> setDemo(false))
  },[])

  const onLoadPreset = (key) => {
    const p = PRESETS[key]; if (!p) return
    setEndpoint(p.endpoint); setParams(p.params)
  }

  const body = useMemo(()=> buildBody(params), [params])

  return (
    <div className="stage">
      <Background />
      <Header demo={demo} />
      <main className="main">
        <div style={{ display:'grid', gap:14 }}>
          <EndpointForm endpoint={endpoint} onEndpoint={setEndpoint} onLoadPreset={onLoadPreset} />
          <ParamBuilder params={params} onChange={setParams} />
        </div>
        <div style={{ display:'grid', gap:14 }}>
          <PreviewPanel endpoint={endpoint} params={params} onResponse={setLatest} />
          <AIExplainPanel endpoint={endpoint} requestBody={body} responseBody={latest} status={200} />
        </div>
      </main>
      <footer className="footer">
        <div>DemoForge AI • Visual API demos with animated journey</div>
        <div><span className="kbd">Pro tip</span> Use presets, then “Explain with AI”.</div>
      </footer>
    </div>
  )
}
