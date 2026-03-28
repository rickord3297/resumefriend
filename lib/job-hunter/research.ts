/**
 * JobHunter Research: find potential hiring managers given a company name.
 * Prefers Gemini with Google Search (open internet); optional Apollo; fallback OpenAI or stub.
 */

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { CompanyResearchResult, HiringManagerContact } from "@/types/job-hunter";

const RESEARCH_PROMPT = (company: string) =>
  `You are a recruiting researcher. For the company "${company}", use web search to find real or likely hiring manager roles and job titles (e.g. Engineering Manager, VP Engineering, Head of Talent). If you find real names from public sources (LinkedIn, press, company site), include them; otherwise use placeholder "Hiring Manager" with the role title. Reply with ONLY a valid JSON object, no markdown or code fence: { "suggestedRoles": string[], "hiringManagers": [ { "name": string, "title": string } ] }. Include 3-6 hiringManagers.`;

function parseResearchJson(raw: string): { suggestedRoles?: string[]; hiringManagers?: { name?: string; title?: string }[] } {
  const trimmed = raw.replace(/^[\s\S]*?\{/, "{").replace(/\}[\s\S]*$/, "}");
  return JSON.parse(trimmed);
}

function toHiringManagers(
  data: { hiringManagers?: { name?: string; title?: string }[] },
  source: string
): HiringManagerContact[] {
  return (data.hiringManagers ?? []).map((h) => ({
    name: h.name ?? "Hiring Manager",
    title: h.title,
    source,
  }));
}

/** Stub when no API keys are configured. */
function stubResult(companyName: string): CompanyResearchResult {
  return {
    companyName,
    hiringManagers: [
      { name: "Hiring Manager", title: "Engineering Manager", source: "stub" },
      { name: "Hiring Manager", title: "VP Engineering", source: "stub" },
      { name: "Hiring Manager", title: "Director of Engineering", source: "stub" },
    ],
    suggestedRoles: ["Engineering Manager", "VP Engineering", "Director of Engineering", "Technical Recruiter"],
    researchedAt: new Date().toISOString(),
  };
}

/** Gemini with Google Search grounding — uses the open internet to find hiring managers. */
async function geminiResearch(companyName: string): Promise<CompanyResearchResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const groundingTool = { googleSearch: {} as const };
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: RESEARCH_PROMPT(companyName),
      config: {
        tools: [groundingTool],
        maxOutputTokens: 1024,
      },
    });
    const text = response.text ?? "";
    if (!text.trim()) return null;
    const data = parseResearchJson(text);
    return {
      companyName,
      hiringManagers: toHiringManagers(data, "gemini_web"),
      suggestedRoles: data.suggestedRoles ?? [],
      researchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Optional: Apollo.io (paid) for verified contacts. */
const APOLLO_BASE = "https://api.apollo.io/api/v1";

async function apolloSearch(companyName: string): Promise<HiringManagerContact[]> {
  const key = process.env.APOLLO_API_KEY;
  if (!key) return [];

  const orgRes = await fetch(`${APOLLO_BASE}/mixed_companies/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    body: JSON.stringify({
      api_key: key,
      q_organization_name: companyName,
      page: 1,
      per_page: 1,
    }),
  });
  const orgData = await orgRes.json();
  const org = orgData.organizations?.[0];
  if (!org?.id) return [];

  const peopleRes = await fetch(`${APOLLO_BASE}/mixed_people/api_search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    body: JSON.stringify({
      api_key: key,
      q_organization_ids: [org.id],
      person_titles: [
        "Engineering Manager",
        "VP Engineering",
        "Director of Engineering",
        "Hiring Manager",
        "Technical Recruiter",
        "Head of Engineering",
        "CTO",
      ],
      per_page: 10,
      page: 1,
    }),
  });
  const peopleData = await peopleRes.json();
  const people = peopleData.people ?? [];
  return people.map((p: { name?: string; title?: string; email?: string; linkedin_url?: string }) => ({
    name: p.name ?? "Unknown",
    title: p.title,
    email: p.email,
    linkedInUrl: p.linkedin_url,
    source: "apollo",
  }));
}

/** OpenAI fallback when Gemini is not used. */
async function openaiResearch(companyName: string): Promise<CompanyResearchResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a recruiting researcher. Reply with ONLY valid JSON: { suggestedRoles: string[], hiringManagers: [ { name: string, title: string } ] }. Use placeholder 'Hiring Manager' with role title if no real names.",
        },
        { role: "user", content: `Company: ${companyName}. Suggest hiring manager roles and 3-5 placeholder contacts.` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw);
    return {
      companyName,
      hiringManagers: toHiringManagers(data, "openai"),
      suggestedRoles: data.suggestedRoles ?? [],
      researchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Research a company: find potential hiring managers.
 * Order: Apollo (if key) → Gemini with Google Search (open internet, if key) → OpenAI (if key) → stub.
 */
export async function researchCompany(companyName: string): Promise<CompanyResearchResult> {
  const apolloContacts = await apolloSearch(companyName);
  if (apolloContacts.length > 0) {
    return {
      companyName,
      hiringManagers: apolloContacts,
      suggestedRoles: undefined,
      researchedAt: new Date().toISOString(),
    };
  }
  const gemini = await geminiResearch(companyName);
  if (gemini) return gemini;
  const openai = await openaiResearch(companyName);
  if (openai) return openai;
  return stubResult(companyName);
}
