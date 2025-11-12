import React from 'react'

const METHODS=['GET','POST','PUT','PATCH','DELETE']
export const PRESETS={
  'Payments · Create Charge': {
    endpoint:{ method:'POST', path:'/charges', baseUrl:'https://api.acme-pay.com', useCase:'Create a customer charge', description:'Create a trackable charge with idempotency and metadata in one request.' },
    params:[
      {key:'amount',type:'number',value:'1999'},
      {key:'currency',type:'string',value:'USD'},
      {key:'customer_id',type:'string',value:'cust_42ab'},
      {key:'metadata.order_id',type:'string',value:'ORD-14522'}
    ]
  },
  'AI Inference · Generate Text': {
    endpoint:{ method:'POST', path:'/v1/generate', baseUrl:'https://api.modelhost.dev', useCase:'Text generation', description:'Submit a prompt and sampling params to stream a completion.' },
    params:[
      {key:'model',type:'string',value:'gpt-mini'},
      {key:'prompt',type:'string',value:'Write a cheerful product update'},
      {key:'max_tokens',type:'number',value:'128'},
      {key:'temperature',type:'number',value:'0.7'}
    ]
  },
  'CRM · Create Contact': {
    endpoint:{ method:'POST', path:'/contacts', baseUrl:'https://api.crmx.io', useCase:'Create contact', description:'Standardize contact creation across sources with dedupe.' },
    params:[
      {key:'email',type:'string',value:'alex@example.com'},
      {key:'first_name',type:'string',value:'Alex'},
      {key:'last_name',type:'string',value:'Rivera'},
      {key:'tags',type:'string',value:'prospect, beta'}
    ]
  }
}

export default function EndpointForm({ endpoint, onEndpoint, onLoadPreset }){
  const set=(k,v)=> onEndpoint({ ...endpoint, [k]:v })
  return (
    <div className="panel">
      <div className="section-head">
        <div className="section-title">Endpoint</div>
        <select className="select" onChange={e=> onLoadPreset(e.target.value)} defaultValue="">
          <option value="" disabled>Load preset…</option>
          {Object.keys(PRESETS).map(k=> <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="row">
        <div className="label">Method</div>
        <select className="select" value={endpoint.method} onChange={e=>set('method', e.target.value)}>
          {METHODS.map(m=> <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="row">
        <div className="label">Path</div>
        <input className="input" value={endpoint.path} onChange={e=>set('path', e.target.value)} placeholder="/create-payment" />
      </div>

      <div className="row">
        <div className="label">Base URL</div>
        <input className="input" value={endpoint.baseUrl} onChange={e=>set('baseUrl', e.target.value)} placeholder="https://api.example.com" />
      </div>

      <div className="row">
        <div className="label">Use-case title</div>
        <input className="input" value={endpoint.useCase} onChange={e=>set('useCase', e.target.value)} placeholder="Create a card-linked payment in one call" />
      </div>

      <div className="row" style={{gridTemplateColumns:'140px minmax(0,1fr)'}}>
        <div className="label">Narrative one-liner</div>
        <textarea className="textarea" value={endpoint.description} onChange={e=>set('description', e.target.value)} placeholder="This demo shows how to spin up a trackable payment in under 30 seconds." />
      </div>
    </div>
  )
}
