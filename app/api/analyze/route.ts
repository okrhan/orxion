import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(d: Record<string, unknown>): string {
  const hasStmt = d.hasStatements as boolean;
  return `You are a top-tier Big 4 strategy partner. Analyze this business rigorously. Output ONLY raw JSON starting with { and ending with }. No markdown, no backticks, no text outside JSON.

COMPANY: ${d.name || "N/A"}
INDUSTRY: ${d.industry || "N/A"}
STAGE: ${d.stage || "N/A"}
REVENUE/mo: $${d.revenue || "?"}
COSTS/mo: $${d.costs || "?"}
CAC: $${d.cac || "?"}
LTV: $${d.ltv || "?"}
CONVERSION: ${d.conv || "?"}%
TEAM: ${d.team || "?"}
CHANNELS: ${(d.channels as string[])?.join(",") || "none"}
WEBSITE: ${d.website || "N/A"}
${hasStmt ? "NOTE: User has uploaded financial statements — base financial analysis on the statement data provided above if present, otherwise use contextual estimates for the sector/stage." : ""}

Return exactly this JSON with real data-driven analysis — every field must be specific to this business:
{"score":75,"summary":"One incisive sentence referencing actual data points","metrics":{"Margin":"28%","LTV:CAC":"3.2x","Runway":"6 mo","Unit Econ":"Marginal"},"radarLabels":["Growth","Margin","Retention","Marketing","Ops"],"radarVals":[65,40,70,55,60],"channelLabels":["SEO","Paid","LinkedIn","Social","Email"],"channelVals":[75,60,45,80,55],"revenueHistory":[42,45,48,44,52,58,56,62,60,68,72,74],"problems":["Problem 1 with specific data","Problem 2","Problem 3","Problem 4"],"rootCauses":["Root cause 1 structural","Root cause 2 strategic","Root cause 3 operational"],"pillars":[{"title":"Pillar 1","desc":"Two specific actionable sentences."},{"title":"Pillar 2","desc":"Two sentences."},{"title":"Pillar 3","desc":"Two sentences."}],"plan":{"d30":["Action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"One bold concluding sentence."}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.industry || !body.stage) {
      return NextResponse.json(
        { error: "Missing required fields: name, industry, stage" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: buildPrompt(body) }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s === -1 || e === -1) {
      return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
    }

    const report = JSON.parse(raw.slice(s, e + 1));
    if (typeof report.score !== "number") report.score = 50;

    return NextResponse.json({ report });
  } catch (err) {
    console.error("Analyze API error:", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
