import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(d: Record<string, unknown>): string {
  const mod = (d.module as string) || "strategy";

  if (mod === "valuation") {
    return `You are a top-tier investment banker and valuation expert. Analyze this business and provide investor-grade valuation. Output ONLY raw JSON starting with { and ending with }. No markdown, no backticks.

COMPANY: ${d.name} | INDUSTRY: ${d.industry} | STAGE: ${d.stage}
ANNUAL REVENUE: $${d.revenue} | COSTS: $${d.costs} | GROSS MARGIN: ${d.margin}%
GROWTH RATE: ${d.growth}% YoY | CHURN: ${d.churn}% | TEAM: ${d.team}
TOTAL FUNDING: $${d.funding} | PURPOSE: ${d.purpose} | COMPARABLES: ${d.comps}

Return this JSON with real valuation data:
{"score":72,"summary":"One sentence on investment readiness","metrics":{"ARR":"$1.2M","Gross Margin":"65%","Growth Rate":"40% YoY","Burn Multiple":"1.8x"},"valuation":{"revenueMultiple":"4.2x","evRange":"$4.8M–$8.5M","method":"Revenue multiple based on ${d.industry} sector benchmarks at ${d.stage} stage","bull":"$8.5M","base":"$6.2M","bear":"$4.8M","enhancers":["Increase recurring revenue to 90%+","Reduce churn below 1.5%","Improve gross margin to 75%+","Reach $2M ARR milestone"],"investorNote":"One sentence on investment narrative and readiness."},"radarLabels":["Growth","Margin","Retention","Team","Market"],"radarVals":[70,65,55,60,75],"problems":["Key risk 1","Key risk 2","Key risk 3"],"rootCauses":["Structural cause 1","Strategic cause 2"],"pillars":[{"title":"Value Creation Pillar 1","desc":"Two specific sentences."},{"title":"Value Creation Pillar 2","desc":"Two sentences."},{"title":"Value Creation Pillar 3","desc":"Two sentences."}],"plan":{"d30":["Investor action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"One bold sentence on investment thesis."}`;
  }

  if (mod === "marketing") {
    return `You are a senior digital marketing strategist and growth expert. Audit this business's marketing presence. Output ONLY raw JSON starting with { and ending with }. No markdown, no backticks.

COMPANY: ${d.name} | INDUSTRY: ${d.industry} | TARGET MARKET: ${d.target}
WEBSITE: ${d.website} | INSTAGRAM: ${d.instagram} | LINKEDIN: ${d.linkedin}
FACEBOOK: ${d.facebook} | OTHER: ${d.other}
AUDIT GOAL: ${d.goal} | COMPETITORS: ${d.competitors}

Return this JSON with specific marketing audit findings:
{"score":58,"summary":"One sentence on overall marketing effectiveness","metrics":{"Website Score":"6/10","SEO Score":"5/10","Social Score":"7/10","Brand Score":"6/10"},"marketing":{"websiteScore":"6/10","scores":{"Website":"6/10","SEO":"5/10","Social":"7/10","Conversion":"4/10"},"issues":["Specific website issue 1","SEO gap 2","Messaging problem 3","Conversion issue 4"],"recommendations":["Growth recommendation 1","SEO action 2","Social media action 3","Conversion optimization 4"]},"radarLabels":["Website","SEO","Social","Messaging","Conversion"],"radarVals":[60,50,70,55,40],"problems":["Marketing problem 1 with specifics","Problem 2","Problem 3"],"rootCauses":["Root cause 1","Root cause 2","Root cause 3"],"pillars":[{"title":"Marketing Pillar 1","desc":"Two specific sentences."},{"title":"Marketing Pillar 2","desc":"Two sentences."},{"title":"Marketing Pillar 3","desc":"Two sentences."}],"plan":{"d30":["Marketing action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"One bold concluding sentence on marketing potential."}`;
  }

  if (mod === "bundle") {
    return `You are a top-tier Big 4 strategy partner AND investment banker AND marketing expert. Provide a complete business intelligence report covering strategy, valuation, and marketing. Output ONLY raw JSON starting with { and ending with }. No markdown, no backticks.

COMPANY: ${d.name} | INDUSTRY: ${d.industry} | STAGE: ${d.stage}
REVENUE: $${d.revenue} | COSTS: $${d.costs} | MARGIN: ${d.margin}% | GROWTH: ${d.growth}% | CHURN: ${d.churn}%
TEAM: ${d.team} | WEBSITE: ${d.website} | INSTAGRAM: ${d.instagram} | LINKEDIN: ${d.linkedin}
INVESTOR PURPOSE: ${d.purpose}

Return this complete JSON:
{"score":68,"summary":"One comprehensive sentence covering all dimensions","metrics":{"Revenue":"$X","Margin":"X%","Valuation":"$XM","Mktg Score":"X/10"},"valuation":{"revenueMultiple":"4.2x","evRange":"$4.8M–$8.5M","method":"Sector revenue multiple","bull":"$8.5M","base":"$6.2M","bear":"$4.8M","enhancers":["Enhancer 1","Enhancer 2","Enhancer 3"],"investorNote":"Investment narrative sentence."},"marketing":{"websiteScore":"6/10","scores":{"Website":"6/10","SEO":"5/10","Social":"7/10","Conversion":"4/10"},"issues":["Issue 1","Issue 2","Issue 3"],"recommendations":["Recommendation 1","Recommendation 2","Recommendation 3"]},"radarLabels":["Strategy","Finance","Marketing","Operations","Growth"],"radarVals":[70,65,55,60,75],"revenueHistory":[42,45,48,44,52,58,56,62,60,68,72,74],"channelLabels":["Website","SEO","Social","Email","Paid"],"channelVals":[60,50,70,45,55],"problems":["Cross-cutting problem 1","Problem 2","Problem 3","Problem 4"],"rootCauses":["Root cause 1","Root cause 2","Root cause 3"],"pillars":[{"title":"Strategic Pillar 1","desc":"Two specific sentences."},{"title":"Pillar 2","desc":"Two sentences."},{"title":"Pillar 3","desc":"Two sentences."}],"plan":{"d30":["Action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"One bold unified conclusion."}`;
  }

  // Default: strategy
  return `You are a top-tier Big 4 strategy partner. Analyze this business rigorously. Output ONLY raw JSON starting with { and ending with }. No markdown, no backticks.

COMPANY: ${d.name} | INDUSTRY: ${d.industry} | STAGE: ${d.stage}
REVENUE/mo: $${d.revenue} | COSTS/mo: $${d.costs} | CAC: $${d.cac} | LTV: $${d.ltv}
CONVERSION: ${d.conv}% | TEAM: ${d.team} | CHANNELS: ${(d.channels as string[])?.join(",") || "none"} | WEB: ${d.website}
${d.hasStatements ? "NOTE: User has uploaded financial statements — use contextual estimates for the sector/stage." : ""}

Return this JSON with real data-driven analysis:
{"score":75,"summary":"One incisive sentence with actual numbers","metrics":{"Margin":"28%","LTV:CAC":"3.2x","Runway":"6 mo","Unit Econ":"Marginal"},"radarLabels":["Growth","Margin","Retention","Marketing","Ops"],"radarVals":[65,40,70,55,60],"channelLabels":["SEO","Paid","LinkedIn","Social","Email"],"channelVals":[75,60,45,80,55],"revenueHistory":[42,45,48,44,52,58,56,62,60,68,72,74],"problems":["Problem 1 with specific data","Problem 2","Problem 3","Problem 4"],"rootCauses":["Root cause 1","Root cause 2","Root cause 3"],"pillars":[{"title":"Pillar 1","desc":"Two specific actionable sentences."},{"title":"Pillar 2","desc":"Two sentences."},{"title":"Pillar 3","desc":"Two sentences."}],"plan":{"d30":["Action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"One bold concluding sentence."}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
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
