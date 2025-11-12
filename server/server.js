import express from "express";
import fetch from "node-fetch";
import { z } from "zod";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
dotenv.config();

const app = express();

// CORS: update origin to your Netlify domain after deploy
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://magical-cannoli.netlify.app"   // 👈 your live site
  ],
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","x-demo-pass"]
}));


app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION || "2023-06-01";
const DEMO_MODE = String(process.env.DEMO_MODE || "false").toLowerCase() === "true";
const DEMO_PASS = process.env.DEMO_PASS || "";

// Basic abuse control (even in demo)
const limiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 12,          // 12 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/explain", limiter);

if (!ANTHROPIC_API_KEY && !DEMO_MODE) {
  console.warn("[WARN] Missing ANTHROPIC_API_KEY in .env and DEMO_MODE is false.");
}

const ExplainRequest = z.object({
  endpoint: z.object({
    method: z.string().optional(),
    baseUrl: z.string().optional(),
    path: z.string().optional(),
    useCase: z.string().optional(),
    description: z.string().optional()
  }).default({}),
  requestBody: z.record(z.any()).default({}),
  responseBody: z.record(z.any()).default({}),
  status: z.number().optional()
});

const ExplainResponse = z.object({
  narrative: z.string(),
  key_values: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]).nullable()
  })).default([]),
  timeline: z.array(z.object({
    step: z.string(),
    detail: z.string().optional()
  })).default([]),
  flags: z.array(z.string()).default([])
});

// Health now tells the client if we're in demo
app.get("/health", (_req, res) => res.json({ ok: true, demo: DEMO_MODE }));

// Helper to build a nice mock response using inputs
function mockExplain({ endpoint, requestBody, responseBody, status }) {
  const amount = requestBody?.amount ?? requestBody?.total ?? requestBody?.price;
  const currency = requestBody?.currency || "USD";
  const id = responseBody?.id || responseBody?.charge_id || "obj_" + Math.random().toString(36).slice(2,8);
  const succeeded = (status || 200) < 400;

  return {
    narrative: succeeded
      ? `Demo mode: created a sample ${amount ? `$${(Number(amount)/100).toFixed(2)} ` : ""}object via ${endpoint.method || "POST"} ${endpoint.path || "/endpoint"}.`
      : `Demo mode: simulated an error response for ${endpoint.path || "/endpoint"}.`,
    key_values: [
      { label: "endpoint", value: `${endpoint.method || "POST"} ${(endpoint.baseUrl || "https://api.example.com") + (endpoint.path || "/endpoint")}` },
      { label: "id", value: id },
      ...(amount != null ? [{ label: "amount", value: Number(amount) }] : []),
      { label: "currency", value: currency },
      { label: "status", value: succeeded ? "succeeded" : "error" }
    ],
    timeline: [
      { step: "request_sent", detail: "Sent from DemoForge UI" },
      { step: "api_simulated", detail: "Demo mode enabled; no external call" },
      { step: succeeded ? "response_ok" : "response_error", detail: succeeded ? "Mocked success" : "Mocked failure" }
    ],
    flags: ["demo-mode"]
  };
}

async function callAnthropic({ messages, system, model }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY || "",
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      temperature: 0.2,
      system,
      messages
    })
  });
  const text = await r.text();
  return { ok: r.ok, bodyText: text };
}

app.post("/api/explain", async (req, res) => {
  console.log("[/api/explain] incoming keys:", Object.keys(req.body || {}));

  // DEMO_MODE: short-circuit with a mock (no credits)
  if (DEMO_MODE) {
    const parsedDemo = ExplainRequest.safeParse(req.body);
    const safeData = parsedDemo.success ? parsedDemo.data : { endpoint: {}, requestBody: {}, responseBody: {}, status: 200 };
    return res.json(mockExplain(safeData));
  }

  // Optional auth gate for real mode
  if (DEMO_PASS && req.headers["x-demo-pass"] !== DEMO_PASS) {
    return res.status(401).json({ error: "Unauthorized demo (missing or wrong x-demo-pass)" });
  }

  const parsed = ExplainRequest.safeParse(req.body);
  if (!parsed.success) {
    console.error("[/api/explain] Zod validation error:", parsed.error.issues);
    return res.status(400).json({ error: "Bad payload", issues: parsed.error.issues });
  }

  const { endpoint, requestBody, responseBody, status } = parsed.data;

  const system = `You are an API demo explainer.
Return a STRICT JSON object with keys: narrative (string), key_values (list of {label,value}),
timeline (list of {step,detail}), flags (list of strings).
- Keep narrative in layman terms (1–2 sentences).
- key_values: pick 3–6 salient fields (ids, totals, statuses).
- timeline: 3–5 steps max, e.g., request_sent -> processing -> response_ok/response_error.
Do not include any additional keys.`;

  const userContent = {
    role: "user",
    content: [{
      type: "text",
      text:
`Explain this API interaction.

Endpoint:
- Method: ${endpoint.method || "POST"}
- URL: ${(endpoint.baseUrl || "https://api.example.com") + (endpoint.path || "/endpoint")}
- Use case: ${endpoint.useCase || ""}
- Description: ${endpoint.description || ""}

Request body (JSON):
${JSON.stringify(requestBody || {}, null, 2)}

HTTP status (if real): ${status ?? "N/A"}

Response body (JSON):
${JSON.stringify(responseBody || {}, null, 2)}

Return JSON only.`
    }]
  };

  try {
    // Try configured model first
    let { ok, bodyText } = await callAnthropic({ messages: [userContent], system, model: MODEL });

    // Fallback if model not found
    if (!ok) {
      let err; try { err = JSON.parse(bodyText); } catch {}
      const notFound = err?.error?.type === "not_found_error" && /model/i.test(err?.error?.message || "");
      if (notFound) {
        console.warn("[/api/explain] Model not found:", MODEL, "→ fallback to claude-3-5-haiku-latest");
        ({ ok, bodyText } = await callAnthropic({ messages: [userContent], system, model: "claude-3-5-haiku-latest" }));
      }
      if (!ok) {
        console.error("[/api/explain] Anthropic error:", bodyText);
        return res.status(500).json({ error: "Anthropic error", detail: bodyText });
      }
    }

    const data = JSON.parse(bodyText);
    const text = data?.content?.[0]?.text || "";
    let parsedJSON = {};
    try { parsedJSON = JSON.parse(text); } catch (e) {
      console.warn("[/api/explain] Failed to parse LLM JSON:", e?.message);
    }
    const safe = ExplainResponse.safeParse(parsedJSON);
    if (!safe.success) {
      console.warn("[/api/explain] LLM JSON schema mismatch, returning fallback.");
      return res.status(200).json({
        narrative: "We sent a request and received a response. (AI returned unparseable JSON.)",
        key_values: [],
        timeline: [{ step: "request_sent" }, { step: "response_ok" }],
        flags: ["llm-json-parse-failed"]
      });
    }
    return res.json(safe.data);
  } catch (e) {
    console.error("[/api/explain] Server failure:", e);
    return res.status(500).json({ error: "Server failure", detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`[demoforge-llm-proxy] listening on http://localhost:${PORT}  (demo=${DEMO_MODE})`);
});
