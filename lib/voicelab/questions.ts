import type { VoiceLabQuestion } from "@/types/voicelab";

export const DEFAULT_QUESTIONS: VoiceLabQuestion[] = [
  { id: "tell-me-about-yourself", prompt: "Tell me about yourself.", category: "Behavioral" },
  { id: "why-this-company", prompt: "Why do you want to work at this company?", category: "Behavioral" },
  { id: "greatest-strength", prompt: "What is your greatest professional strength?", category: "Behavioral" },
  { id: "greatest-weakness", prompt: "What is your greatest weakness and how do you work on it?", category: "Behavioral" },
  { id: "challenge", prompt: "Describe a challenging project and how you overcame obstacles.", category: "Behavioral" },
  { id: "leadership", prompt: "Tell me about a time you showed leadership.", category: "Behavioral" },
  { id: "failure", prompt: "Describe a time you failed and what you learned.", category: "Behavioral" },
  { id: "five-years", prompt: "Where do you see yourself in five years?", category: "Behavioral" },
];
