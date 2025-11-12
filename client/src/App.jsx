import React, { useMemo, useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import Background from "./components/Background.jsx";
import EndpointForm, { PRESETS } from "./components/EndpointForm.jsx";
import ParamBuilder from "./components/ParamBuilder.jsx";
import PreviewPanel from "./components/PreviewPanel.jsx";
import VisualFlow from "./components/VisualFlow.jsx";
import NarrationPanel from "./components/NarrationPanel.jsx";

function toBody(params){
  const o = {}; (params||[]).forEach(p=>{
    if (!p.key) return;
    if (p.type==="number") { const n = Number(p.value); o[p.key] = Number.isNaN(n) ? p.value : n; }
    else if (p.type==="boolean") { o[p.key] = String(p.value)==="true"; }
    else { o[p.key] = p.value; }
  }); return o;
}

export default function App(){
  const [endpoint, setEndpoint] = useState({
    method:"POST", baseUrl:"https://api.example.com", path:"/charges",
    useCase:"Create a payment", description:"Turns a cart total into a captured payment"
  });
  const [params, setParams] = useState([
    { key:"amount", type:"number", value:"1999" },
    { key:"currency", type:"string", value:"USD" },
    { key:"customer_id", type:"string", value:"cust_123" },
  ]);
  const [latestResp, setLatestResp] = useState({ ok:true, id:"obj_demo", status:"succeeded" });
  const [playing, setPlaying] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(()=>{ fetch("/health").then(r=>r.json()).then(j=> setDemo(!!j.demo)).catch(()=>{}); },[]);
  const body = useMemo(()=> toBody(params), [params]);

  const onPlay = ()=>{
    // you can also call your /api/explain here first if you want fresh text, then animate
    setPlaying(false); requestAnimationFrame(()=> setPlaying(true));
  };

  return (
    <div className="stage">
      <Background />
      <Header demo={demo} />

      <main className="main" style={{ gridTemplateColumns: "minmax(320px, 1fr) minmax(420px, 1fr)" }}>
        <div style={{ display:"grid", gap:14 }}>
          <EndpointForm endpoint={endpoint} onEndpoint={setEndpoint} onLoadPreset={(k)=> {
            const p=PRESETS?.[k]; if (p){ setEndpoint(p.endpoint); setParams(p.params); }
          }} />
          <ParamBuilder params={params} onChange={setParams} />
          <PreviewPanel endpoint={endpoint} params={params} onResponse={setLatestResp} />
        </div>

        <div style={{ display:"grid", gap:14 }}>
          <div className="panel">
            <div className="section-head">
              <div className="section-title">Visual Flow</div>
              <button className="btn" onClick={onPlay}>{playing ? "Replay" : "Play"}</button>
            </div>
            <VisualFlow
              endpoint={endpoint}
              requestBody={body}
              responseBody={latestResp}
              status={200}
              playing={playing}
              onDone={()=> setPlaying(false)}
            />
            <div style={{ fontSize:12, opacity:.7, marginTop:6 }}>
              Tip: The bubbles are the key fields traveling through your API.
            </div>
          </div>

          <NarrationPanel
            endpoint={endpoint}
            requestBody={body}
            responseBody={latestResp}
            status={200}
          />
        </div>
      </main>

      <footer className="footer">
        <div>DemoForge • Visual API demos (now with animated flow)</div>
        <div><span className="kbd">Pro tip</span> Try Play → Explain.</div>
      </footer>
    </div>
  );
}
