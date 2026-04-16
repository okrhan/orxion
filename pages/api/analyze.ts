import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
  maxDuration: 60,
};

function fixTruncatedJSON(raw: string): string {
  // Find the JSON start
  const start = raw.indexOf("{");
  if (start === -1) return "{}";
  let json = raw.slice(start);
  
  // Remove any trailing markdown
  json = json.replace(/```[\s\S]*$/, "").trim();
  
  // If ends with }, it's complete
  if (json.endsWith("}")) return json;
  
  // Try to fix truncated JSON by closing open structures
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"' && !escaped) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }
  
  // Remove trailing incomplete parts (incomplete strings, dangling commas)
  // Find last complete top-level value
  let fixed = json;
  
  // Remove trailing comma before closing
  fixed = fixed.replace(/,\s*$/, "");
  
  // Close open arrays and objects
  for (let i = 0; i < openBrackets; i++) fixed += "]";
  for (let i = 0; i < openBraces; i++) fixed += "}";
  
  return fixed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body;
    if (!body.name) return res.status(400).json({ error: "Business name is required" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key not configured" });

    const mod = body.module || "strategy";
    const stmtNote = body.stmtNote || "";

    const prompts: Record<string, string> = {
      strategy: `You are a McKinsey/BCG strategy partner and PE analyst. Produce a decision-grade analysis. Be brutally honest. Quantify everything. No generic statements.

INPUT: Company=${body.name} Industry=${body.industry} Stage=${body.stage} Revenue=$${body.revenue||"?"}/mo Costs=$${body.costs||"?"}/mo CAC=$${body.cac||"?"} LTV=$${body.ltv||"?"} Team=${body.team||"?"} Channels=${(body.channels||[]).join(",")||"none"} Web=${body.website||"N/A"}
${stmtNote ? `FINANCIAL STATEMENTS: ${stmtNote}` : ""}

CRITICAL: Return ONLY a single valid JSON object. No markdown. No explanation. No line breaks inside string values. Start with { and end with }. All strings must be properly closed. All arrays must be properly closed.

{"score":75,"dataCompleteness":"72%","confidenceLevel":"Medium","summary":"Specific sentence with real numbers from the data","metrics":{"Margin":"X%","LTV:CAC":"X","Runway":"X mo","Unit Econ":"X"},"dataFlags":["Flag 1","Flag 2"],"leveragePoint":"One key insight","radarLabels":["Growth","Margin","Retention","Marketing","Ops"],"radarVals":[65,40,70,55,60],"channelLabels":["SEO","Paid","LinkedIn","Social","Email"],"channelVals":[75,60,45,80,55],"revenueHistory":[42,45,48,52,58,62,68,72,74],"problems":["Problem 1","Problem 2","Problem 3"],"rootCauses":["Cause 1","Cause 2","Cause 3"],"notToDo":["Avoid 1","Avoid 2"],"financialImpact":{"currentRevenue":"$X/mo","currentCosts":"$X/mo","currentMargin":"X%","projectedRevenue":"$X/mo","projectedMargin":"X%","netImpact":"$X over 12mo"},"pillars":[{"title":"P1 title","desc":"Two sentences.","impact":"$X","effort":"Medium","timeToImpact":"3 mo"},{"title":"P2 title","desc":"Two sentences.","impact":"$X","effort":"Low","timeToImpact":"1 mo"},{"title":"P3 title","desc":"Two sentences.","impact":"$X","effort":"High","timeToImpact":"6 mo"}],"plan":{"d30":["Action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"Brutally honest one-sentence conclusion.","benchmarks":[{"metric":"Op Margin","value":"X%","peerAvg":"Y%","best":"Z%","status":"behind"},{"metric":"Cost/Rev","value":"X%","peerAvg":"Y%","best":"Z%","status":"behind"},{"metric":"Rev/Employee","value":"$X","peerAvg":"$Y","best":"$Z","status":"behind"}],"scenarios":[{"name":"Bear","probability":"25%","assumption":"Specific assumption","outcome":"Specific outcome","color":"red"},{"name":"Base","probability":"55%","assumption":"Specific assumption","outcome":"Specific outcome","color":"blue"},{"name":"Bull","probability":"20%","assumption":"Specific assumption","outcome":"Specific outcome","color":"green"}],"risks":[{"risk":"Risk 1","likelihood":"High","impact":"Critical","mitigation":"Action"},{"risk":"Risk 2","likelihood":"Medium","impact":"High","mitigation":"Action"},{"risk":"Risk 3","likelihood":"Low","impact":"Critical","mitigation":"Action"}]}`,

      valuation: `You are an investment banker and PE analyst. Investor-grade valuation only. Return ONLY valid JSON. No markdown.
INPUT: Company=${body.name} Industry=${body.industry} Stage=${body.stage} Revenue=$${body.revenue} Margin=${body.margin}% Growth=${body.growth}% Churn=${body.churn}% Funding=$${body.funding} Team=${body.team} Purpose=${body.purpose} Comps=${body.comps}
{"score":72,"dataCompleteness":"80%","confidenceLevel":"High","summary":"Investment readiness sentence with numbers","metrics":{"ARR":"$X","Gross Margin":"X%","Growth":"X% YoY","Burn Multiple":"X"},"valuation":{"revenueMultiple":"4.2x","evRange":"$X–$Y","method":"Revenue multiple based on sector","bull":"$X","base":"$X","bear":"$X","enhancers":["E1","E2","E3"],"investorNote":"Investment narrative."},"radarLabels":["Growth","Margin","Retention","Team","Market"],"radarVals":[70,65,55,60,75],"problems":["Risk 1","Risk 2","Risk 3"],"rootCauses":["Cause 1","Cause 2"],"pillars":[{"title":"P1","desc":"Two sentences.","impact":"$X","effort":"Medium","timeToImpact":"3 mo"},{"title":"P2","desc":"Two sentences.","impact":"$X","effort":"Low","timeToImpact":"1 mo"},{"title":"P3","desc":"Two sentences.","impact":"$X","effort":"High","timeToImpact":"6 mo"}],"plan":{"d30":["A1","A2","A3"],"d60":["A1","A2","A3"],"d90":["A1","A2","A3"]},"verdict":"Investment thesis.","leveragePoint":"Key insight.","scenarios":[{"name":"Bear","probability":"25%","assumption":"A","outcome":"O","color":"red"},{"name":"Base","probability":"55%","assumption":"A","outcome":"O","color":"blue"},{"name":"Bull","probability":"20%","assumption":"A","outcome":"O","color":"green"}],"risks":[{"risk":"R1","likelihood":"Medium","impact":"High","mitigation":"M1"},{"risk":"R2","likelihood":"Low","impact":"High","mitigation":"M2"},{"risk":"R3","likelihood":"Low","impact":"Critical","mitigation":"M3"}]}`,

      marketing: `You are a senior digital marketing strategist. Marketing audit only. Return ONLY valid JSON. No markdown.
INPUT: Company=${body.name} Industry=${body.industry} Target=${body.target} Website=${body.website} Instagram=${body.instagram} LinkedIn=${body.linkedin} Goal=${body.goal} Competitors=${body.competitors}
{"score":58,"dataCompleteness":"65%","confidenceLevel":"Medium","summary":"Marketing effectiveness sentence","metrics":{"Website":"6/10","SEO":"5/10","Social":"7/10","Conversion":"4/10"},"marketing":{"websiteScore":"6/10","scores":{"Website":"6/10","SEO":"5/10","Social":"7/10","Conversion":"4/10"},"issues":["Issue 1","Issue 2","Issue 3"],"recommendations":["Rec 1","Rec 2","Rec 3"]},"radarLabels":["Website","SEO","Social","Messaging","Conversion"],"radarVals":[60,50,70,55,40],"problems":["P1","P2","P3"],"rootCauses":["C1","C2"],"notToDo":["Avoid 1","Avoid 2"],"pillars":[{"title":"P1","desc":"Two sentences.","impact":"X%","effort":"Medium","timeToImpact":"2 mo"},{"title":"P2","desc":"Two sentences.","impact":"X%","effort":"Low","timeToImpact":"1 mo"},{"title":"P3","desc":"Two sentences.","impact":"X%","effort":"High","timeToImpact":"4 mo"}],"plan":{"d30":["A1","A2","A3"],"d60":["A1","A2","A3"],"d90":["A1","A2","A3"]},"verdict":"Marketing conclusion.","leveragePoint":"Key insight.","benchmarks":[{"metric":"Website Score","value":"X/10","peerAvg":"Y/10","best":"Z/10","status":"behind"},{"metric":"SEO Score","value":"X/10","peerAvg":"Y/10","best":"Z/10","status":"behind"}],"scenarios":[{"name":"Bear","probability":"30%","assumption":"A","outcome":"O","color":"red"},{"name":"Base","probability":"50%","assumption":"A","outcome":"O","color":"blue"},{"name":"Bull","probability":"20%","assumption":"A","outcome":"O","color":"green"}],"risks":[{"risk":"R1","likelihood":"High","impact":"Medium","mitigation":"M1"},{"risk":"R2","likelihood":"Medium","impact":"High","mitigation":"M2"}]}`,

      bundle: `You are a Big 4 partner + investment banker + marketing strategist. Complete intelligence report. Return ONLY valid JSON. No markdown.
INPUT: Company=${body.name} Industry=${body.industry} Stage=${body.stage} Revenue=$${body.revenue} Margin=${body.margin}% Growth=${body.growth}% Team=${body.team} Website=${body.website} Instagram=${body.instagram} LinkedIn=${body.linkedin}
{"score":68,"dataCompleteness":"75%","confidenceLevel":"Medium","summary":"Comprehensive summary","metrics":{"Revenue":"$X","Margin":"X%","Valuation":"$X","Mktg":"X/10"},"valuation":{"revenueMultiple":"4x","evRange":"$X–$Y","method":"Sector multiple","bull":"$X","base":"$X","bear":"$X","enhancers":["E1","E2"],"investorNote":"Note."},"marketing":{"websiteScore":"6/10","scores":{"Website":"6/10","SEO":"5/10","Social":"7/10","Conversion":"4/10"},"issues":["I1","I2"],"recommendations":["R1","R2"]},"radarLabels":["Strategy","Finance","Marketing","Ops","Growth"],"radarVals":[70,65,55,60,75],"revenueHistory":[42,45,48,52,58,62,68,72,74],"channelLabels":["Web","SEO","Social","Email","Paid"],"channelVals":[60,50,70,45,55],"problems":["P1","P2","P3"],"rootCauses":["C1","C2","C3"],"notToDo":["Avoid 1","Avoid 2"],"pillars":[{"title":"P1","desc":"Two sentences.","impact":"$X","effort":"Medium","timeToImpact":"3 mo"},{"title":"P2","desc":"Two sentences.","impact":"$X","effort":"Low","timeToImpact":"1 mo"},{"title":"P3","desc":"Two sentences.","impact":"$X","effort":"High","timeToImpact":"6 mo"}],"plan":{"d30":["A1","A2","A3"],"d60":["A1","A2","A3"],"d90":["A1","A2","A3"]},"verdict":"Conclusion.","leveragePoint":"Key insight.","benchmarks":[{"metric":"Op Margin","value":"X%","peerAvg":"Y%","best":"Z%","status":"behind"},{"metric":"Cost/Rev","value":"X%","peerAvg":"Y%","best":"Z%","status":"behind"}],"scenarios":[{"name":"Bear","probability":"25%","assumption":"A","outcome":"O","color":"red"},{"name":"Base","probability":"55%","assumption":"A","outcome":"O","color":"blue"},{"name":"Bull","probability":"20%","assumption":"A","outcome":"O","color":"green"}],"risks":[{"risk":"R1","likelihood":"High","impact":"Critical","mitigation":"M1"},{"risk":"R2","likelihood":"Medium","impact":"High","mitigation":"M2"},{"risk":"R3","likelihood":"Low","impact":"Medium","mitigation":"M3"}]}`
    };

    const prompt = prompts[mod] || prompts.strategy;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => "");
      return res.status(500).json({ error: `Anthropic error ${apiRes.status}: ${errText.slice(0, 200)}` });
    }

    const data = await apiRes.json();
    const raw = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("").trim();

    // Try to fix truncated JSON before parsing
    const fixed = fixTruncatedJSON(raw);
    
    let report;
    try {
      report = JSON.parse(fixed);
    } catch {
      // Last resort: extract what we can
      const s = raw.indexOf("{");
      const e = raw.lastIndexOf("}");
      if (s === -1 || e === -1) {
        return res.status(500).json({ error: "AI response could not be parsed. Please try again." });
      }
      try {
        report = JSON.parse(raw.slice(s, e + 1));
      } catch {
        return res.status(500).json({ error: "JSON parse failed. Please try again." });
      }
    }

    if (typeof report.score !== "number") report.score = 50;

    return res.status(200).json({ report });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: String(err) });
  }
}
