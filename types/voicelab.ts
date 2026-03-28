/**
 * VoiceLab: interview practice with speech-to-text and instant feedback.
 */

export interface VoiceLabQuestion {
  id: string;
  prompt: string;
  category?: string; // e.g. "Behavioral", "Technical"
}

export interface VoiceLabRecording {
  questionId: string;
  prompt: string;
  transcript: string;
  durationSeconds: number;
  recordedAt: string; // ISO
}

export interface VoiceLabFeedback {
  recordingId?: string;
  questionId: string;
  prompt: string;
  transcript: string;
  /** Content: Did they answer the prompt? */
  content: {
    answeredPrompt: boolean;
    score: number; // 0-100
    summary: string;
    suggestedImprovements?: string[];
  };
  /** Confidence: filler words, tone */
  confidence: {
    fillerWordCount: number;
    fillerWords: string[]; // e.g. ["um", "like", "you know"]
    fillerScore: number; // 0-100, higher = fewer fillers
    toneSummary: string;
    toneScore?: number; // 0-100
  };
  /** Alignment with selected Resume Persona */
  alignment: {
    personaLabel: string;
    alignmentScore: number; // 0-100
    summary: string;
    matchedThemes?: string[];
    missedOpportunities?: string[];
  };
  generatedAt: string; // ISO
}
