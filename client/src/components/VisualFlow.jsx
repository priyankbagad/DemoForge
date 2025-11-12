import React, { useMemo, useRef, useState, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";

/**
 * VisualFlow
 * Shows a simple graph: Client -> API -> Data Store -> Response
 * When "playing", small data bubbles animate along the path.
 */
export default function VisualFlow({ endpoint, requestBody, responseBody, status=200, playing=false, onDone }) {
  const colorOk = "#16a34a";
  const colorErr = "#ef4444";
  const isOk = (status ?? 200) < 400;

  const baseUrl = endpoint?.baseUrl || "https://api.example.com";
  const path = endpoint?.path || "/endpoint";

  const initialNodes = useMemo(() => ([
    {
      id: "client",
      type: "input",
      position: { x: 0, y: 120 },
      data: { label: "Client" },
      style: { borderRadius: 12, padding: 8, width: 140, textAlign: "center" }
    },
    {
      id: "api",
      position: { x: 240, y: 120 },
      data: { label: "API" },
      style: { borderRadius: 12, padding: 8, width: 180, textAlign: "center", border: `2px solid ${isOk ? colorOk : colorErr}` }
    },
    {
      id: "store",
      position: { x: 500, y: 40 },
      data: { label: "Data Store" },
      style: { borderRadius: 12, padding: 8, width: 160, textAlign: "center" }
    },
    {
      id: "response",
      type: "output",
      position: { x: 500, y: 200 },
      data: { label: isOk ? "Response (200)" : `Response (${status||500})` },
      style: { borderRadius: 12, padding: 8, width: 180, textAlign: "center", border: `2px dashed ${isOk ? colorOk : colorErr}` }
    }
  ]), [isOk, status]);

  const initialEdges = useMemo(() => ([
    {
      id: "e1",
      source: "client",
      target: "api",
      animated: true,
      label: `${endpoint?.method || "POST"} ${baseUrl}${path}`,
      labelBgPadding: [6,3],
      labelBgBorderRadius: 6,
      style: { strokeWidth: 2 }
    },
    {
      id: "e2",
      source: "api",
      target: "store",
      animated: true,
      label: "validate & write",
      style: { strokeWidth: 2 }
    },
    {
      id: "e3",
      source: "api",
      target: "response",
      animated: true,
      label: "build response",
      style: { strokeWidth: 2 }
    }
  ]), [endpoint?.method, baseUrl, path]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Build some “data bubbles” from key fields
  const bubbles = useMemo(() => {
    const pairs = [];
    const pick = (obj={}, keys=[]) => keys.forEach(k => {
      if (obj[k] !== undefined) pairs.push({ k, v: obj[k] });
    });

    // request highlights
    pick(requestBody, ["amount","currency","customer_id","email","id"]);
    // fallback show 1-2 arbitrary fields
    const reqKeys = Object.keys(requestBody||{});
    reqKeys.slice(0, pairs.length ? 0 : 2).forEach(k => pairs.push({k, v: String(requestBody[k]).slice(0,18)}));

    // response highlights
    pick(responseBody, ["id","status","ok","created_at","name"]);
    const resKeys = Object.keys(responseBody||{});
    resKeys.slice(0, pairs.length<3 ? 3-pairs.length : 0).forEach(k => pairs.push({k, v: String(responseBody[k]).slice(0,18)}));

    return pairs.slice(0,6);
  }, [requestBody, responseBody]);

  // simple runner for bubble animation
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    if (!playing) return;
    let t = 0;
    const id = setInterval(() => {
      setTicker(++t);
      if (t > 120) { clearInterval(id); onDone?.(); }
    }, 30);
    return () => clearInterval(id);
  }, [playing]);

  // bubble path: client (x:70,y:160) -> api (x:330,y:160) -> response (x:590,y:240)
  const p0 = { x: 70, y: 160 };
  const p1 = { x: 330, y: 160 };
  const p2 = { x: 590, y: 240 };
  const pMid = { x: 530, y: 80 }; // api -> store quick arch

  const sample = (a,b,t)=>({ x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t });

  return (
    <div style={{ position:"relative", height: 360, borderRadius: 16, overflow:"hidden", border:"1px solid #eee" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodesDraggable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnScroll
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* animated bubbles */}
      {playing && bubbles.map((b, i) => {
        // first half: client -> api, tiny pause to store, then api -> response
        const t = (ticker + i*6) / 120; // stagger
        let pos;
        if (t < 0.5) pos = sample(p0, p1, t/0.5);
        else if (t < 0.65) pos = sample(p1, pMid, (t-0.5)/0.15);
        else pos = sample(p1, p2, (t-0.65)/0.35);

        return (
          <motion.div
            key={i}
            style={{
              position:"absolute",
              left: pos.x,
              top: pos.y,
              pointerEvents:"none",
              background:"#111827",
              color:"white",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 12,
              boxShadow:"0 6px 18px rgba(0,0,0,0.18)",
              whiteSpace:"nowrap"
            }}
            initial={{ opacity: 0, scale:.8 }}
            animate={{ opacity: t>0 && t<1 ? 1 : 0, scale: 1 }}
            transition={{ type:"spring", stiffness:120, damping:16 }}
          >
            {b.k}: {String(b.v).length>16 ? String(b.v).slice(0,16)+"…" : String(b.v)}
          </motion.div>
        );
      })}
    </div>
  );
}
