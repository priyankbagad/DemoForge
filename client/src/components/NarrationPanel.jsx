import React, { useState } from "react";

/**
 * NarrationPanel
 * Calls your existing /api/explain route, then renders
 * a super plain-English story + key facts + timeline chips.
 */
export default function NarrationPanel({ endpoint, requestBody, responseBody, status=200 }) {
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);

  const onExplain = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/explain", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ endpoint, requestBody, responseBody, status })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Explain failed");
      setOut(j);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="section-head">
        <div className="section-title">Plain-English Narration</div>
        <button className="btn" onClick={onExplain} disabled={loading}>
          {loading ? "Explaining…" : "Explain"}
        </button>
      </div>

      {err && <div style={{ color:"#b91c1c", fontSize:13, marginTop:6 }}>{err}</div>}

      {!out && !loading && (
        <div style={{ opacity:.7, fontSize:14 }}>
          Click <b>Explain</b> to turn this request/response into a short story for non-technical folks.
        </div>
      )}

      {out && (
        <div style={{ display:"grid", gap:10 }}>
          <div style={{ fontSize:15 }}>{out.narrative}</div>

          {!!out.key_values?.length && (
            <div style={{ display:"flex", flexWrap: "wrap", gap:8 }}>
              {out.key_values.map((kv, i)=>(
                <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:999, padding:"4px 10px", fontSize:12 }}>
                  <b>{kv.label}</b>: {String(kv.value)}
                </div>
              ))}
            </div>
          )}

          {!!out.timeline?.length && (
            <div style={{ display:"flex", gap:6, flexWrap: "wrap", marginTop:6 }}>
              {out.timeline.map((t,i)=>(
                <div key={i} style={{ background:"#f3f4f6", borderRadius:8, padding:"4px 8px", fontSize:12 }}>
                  {t.step}{t.detail ? ` — ${t.detail}` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
