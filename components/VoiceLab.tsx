"use client";

import { useState, useRef, useCallback } from "react";
import type { VoiceLabQuestion } from "@/types/voicelab";
import type { VoiceLabFeedback } from "@/types/voicelab";

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult:
    | ((
        e: {
          resultIndex: number;
          results: { length: number; [i: number]: { 0: { transcript: string }; isFinal: boolean } };
        }
      ) => void)
    | null;
  onerror: (() => void) | null;
};

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as Window & { SpeechRecognition?: new () => BrowserSpeechRecognition; webkitSpeechRecognition?: new () => BrowserSpeechRecognition })
        .SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new () => BrowserSpeechRecognition })
        .webkitSpeechRecognition
    : null;

export interface VoiceLabProps {
  questions?: VoiceLabQuestion[];
  personaLabel?: string;
  personaSummaryOrBullets?: string;
  onFeedback?: (feedback: VoiceLabFeedback) => void;
}

export function VoiceLab({
  questions: questionsProp,
  personaLabel = "Generalist",
  personaSummaryOrBullets = "",
  onFeedback,
}: VoiceLabProps) {
  const [questions, setQuestions] = useState<VoiceLabQuestion[]>(() => questionsProp ?? []);
  const [currentQuestion, setCurrentQuestion] = useState<VoiceLabQuestion | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<VoiceLabFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const loadQuestions = useCallback(async () => {
    if (questionsProp && questionsProp.length > 0) return;
    try {
      const res = await fetch("/api/voicelab/questions");
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch {
      setError("Could not load questions");
    }
  }, [questionsProp]);

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser (try Chrome).");
      return;
    }
    if (!currentQuestion) return;
    setError(null);
    setFeedback(null);
    setTranscript("");
    const rec = new SpeechRecognitionAPI();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    const chunks: string[] = [];
    rec.onresult = (e: { resultIndex: number; results: { length: number; [i: number]: { 0: { transcript: string }; isFinal: boolean } } }) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) chunks.push(chunk);
      }
      setTranscript(chunks.join(" "));
    };
    rec.onerror = () => setIsRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  }, [currentQuestion]);

  const stopRecording = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const getFeedback = useCallback(async () => {
    if (!currentQuestion || !transcript.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/voicelab/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentQuestion.prompt,
          transcript,
          personaLabel,
          personaSummaryOrBullets,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Feedback failed");
      setFeedback(data);
      onFeedback?.(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get feedback");
    } finally {
      setLoading(false);
    }
  }, [currentQuestion, transcript, personaLabel, personaSummaryOrBullets, onFeedback]);

  if (questions.length === 0 && !questionsProp?.length) {
    return (
      <div style={styles.section}>
        <button type="button" onClick={loadQuestions} style={styles.button}>
          Load interview questions
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  const qList = questions.length > 0 ? questions : questionsProp ?? [];

  return (
    <div style={styles.container}>
      <section style={styles.section}>
        <h3 style={styles.heading}>Question</h3>
        {currentQuestion ? (
          <div>
            <p style={styles.prompt}>{currentQuestion.prompt}</p>
            <div style={styles.buttonRow}>
              {!isRecording ? (
                <button type="button" onClick={startRecording} style={styles.buttonPrimary}>
                  Start recording
                </button>
              ) : (
                <button type="button" onClick={stopRecording} style={styles.buttonStop}>
                  Stop recording
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCurrentQuestion(null);
                  setTranscript("");
                  setFeedback(null);
                }}
                style={styles.button}
              >
                Change question
              </button>
            </div>
          </div>
        ) : (
          <ul style={styles.questionList}>
            {qList.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setCurrentQuestion(q)}
                  style={styles.questionButton}
                >
                  {q.prompt}
                  {q.category && (
                    <span style={styles.category}> — {q.category}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {transcript && (
        <section style={styles.section}>
          <h3 style={styles.heading}>Your answer</h3>
          <p style={styles.transcript}>{transcript}</p>
          <button
            type="button"
            onClick={getFeedback}
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Analyzing…" : "Get instant feedback"}
          </button>
        </section>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {feedback && (
        <section style={styles.feedbackSection}>
          <h3 style={styles.heading}>Instant feedback</h3>
          <div style={styles.feedbackGrid}>
            <div style={styles.feedbackCard}>
              <h4 style={styles.feedbackTitle}>Content</h4>
              <p style={styles.score}>
                {feedback.content.answeredPrompt ? "Answered prompt ✓" : "Off prompt"}
              </p>
              <p style={styles.scoreNum}>{feedback.content.score}/100</p>
              <p style={styles.summary}>{feedback.content.summary}</p>
              {feedback.content.suggestedImprovements?.length ? (
                <ul style={styles.list}>
                  {feedback.content.suggestedImprovements.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div style={styles.feedbackCard}>
              <h4 style={styles.feedbackTitle}>Confidence</h4>
              <p style={styles.score}>
                Filler words: {feedback.confidence.fillerWordCount}
                {feedback.confidence.fillerWords.length
                  ? ` (${feedback.confidence.fillerWords.join(", ")})`
                  : ""}
              </p>
              <p style={styles.scoreNum}>Filler score: {feedback.confidence.fillerScore}/100</p>
              <p style={styles.summary}>{feedback.confidence.toneSummary}</p>
              {feedback.confidence.toneScore != null && (
                <p style={styles.scoreNum}>Tone: {feedback.confidence.toneScore}/100</p>
              )}
            </div>
            <div style={styles.feedbackCard}>
              <h4 style={styles.feedbackTitle}>Alignment with {feedback.alignment.personaLabel}</h4>
              <p style={styles.scoreNum}>{feedback.alignment.alignmentScore}/100</p>
              <p style={styles.summary}>{feedback.alignment.summary}</p>
              {feedback.alignment.matchedThemes?.length ? (
                <p style={styles.small}>Matched: {feedback.alignment.matchedThemes.join(", ")}</p>
              ) : null}
              {feedback.alignment.missedOpportunities?.length ? (
                <ul style={styles.list}>
                  {feedback.alignment.missedOpportunities.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 640, margin: "0 auto" },
  section: { marginBottom: 24 },
  heading: { fontSize: 14, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" },
  prompt: { fontSize: 18, marginBottom: 12 },
  buttonRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  button: { padding: "8px 16px", borderRadius: 6, border: "1px solid var(--muted)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" },
  buttonPrimary: { padding: "10px 20px", borderRadius: 6, border: "none", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, cursor: "pointer" },
  buttonStop: { padding: "10px 20px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", fontWeight: 600, cursor: "pointer" },
  questionList: { listStyle: "none", padding: 0, margin: 0 },
  questionButton: { display: "block", width: "100%", textAlign: "left", padding: "12px 16px", marginBottom: 6, borderRadius: 6, border: "1px solid var(--surface)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" },
  category: { color: "var(--muted)", fontSize: 14 },
  transcript: { padding: 12, background: "var(--surface)", borderRadius: 6, marginBottom: 12, whiteSpace: "pre-wrap" },
  error: { color: "#ef4444", marginTop: 8 },
  feedbackSection: { marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--surface)" },
  feedbackGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 },
  feedbackCard: { padding: 16, background: "var(--surface)", borderRadius: 8 },
  feedbackTitle: { fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", color: "var(--accent)" },
  score: { fontSize: 14, marginBottom: 4 },
  scoreNum: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  summary: { fontSize: 14, color: "var(--muted)", marginBottom: 8 },
  small: { fontSize: 12, color: "var(--muted)" },
  list: { margin: 0, paddingLeft: 20, fontSize: 14 },
};
