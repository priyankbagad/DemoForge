import React from 'react'

const TYPES=['string','number','boolean','enum']

export default function ParamBuilder({ params, onChange }){
  const update=(i,k,v)=> onChange(params.map((p,idx)=> idx===i? { ...p, [k]: v } : p))
  const add=()=> onChange([...params, { key:'field', type:'string', value:'' }])
  const remove=(i)=> onChange(params.filter((_,idx)=> idx!==i))
  return (
    <div className="panel">
      <div className="section-head">
        <div className="section-title">Parameters</div>
        <button className="btn btn-ghost" onClick={add}>＋ Add field</button>
      </div>
      <div className="param-list">
        {params.map((p,i)=>(
          <div key={i} className="param-row">
            <input className="input" value={p.key} onChange={e=>update(i,'key',e.target.value)} placeholder="amount" />
            <select className="select" value={p.type} onChange={e=>update(i,'type',e.target.value)}>
              {TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
            <input className="input" value={p.value} onChange={e=>update(i,'value',e.target.value)} placeholder="5000" />
            <button className="btn-icon btn-ghost" onClick={()=>remove(i)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
