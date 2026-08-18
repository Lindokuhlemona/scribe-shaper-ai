import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { Check, Copy, Loader2, Mail, NotebookPen, RotateCcw, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownOutput } from "@/components/markdown-output";
import type { AssistantMode } from "@/lib/assistant-prompts";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Draftwise — AI Email, Meeting Notes & Research Assistant" },
      {
        name: "description",
        content:
          "Write polished emails, turn messy meeting notes into action items, and get structured research answers — all in one AI workspace.",
      },
      { property: "og:title", content: "Draftwise — AI Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Polished emails, actionable meeting summaries and structured research answers in one AI workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MODES: { id: AssistantMode; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email", icon: Mail },
  { id: "notes", label: "Meeting Notes", icon: NotebookPen },
  { id: "research", label: "Research", icon: Search },
];

function Index() {
  const [mode, setMode] = useState<AssistantMode>("email");

  // Email fields
  const [emailIntent, setEmailIntent] = useState("");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState("formal");
  const [length, setLength] = useState("medium");

  // Notes fields
  const [notes, setNotes] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [attendees, setAttendees] = useState("");

  // Research fields
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState("quick");

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const lastPrompt = useRef<string | null>(null);

  const buildPrompt = useCallback(
    (variants: boolean): string | null => {
      if (mode === "email") {
        if (!emailIntent.trim()) return null;
        return [
          `Write an email.`,
          recipient.trim() ? `Recipient: ${recipient.trim()}` : null,
          `Tone: ${tone}`,
          `Length: ${length}`,
          variants
            ? `Provide three clearly labelled alternative versions: Formal, Concise, and Warm.`
            : null,
          `\nIntent / rough notes:\n${emailIntent.trim()}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
      if (mode === "notes") {
        if (!notes.trim()) return null;
        return [
          `Summarize these meeting notes.`,
          meetingTitle.trim() ? `Meeting: ${meetingTitle.trim()}` : null,
          attendees.trim() ? `Attendees: ${attendees.trim()}` : null,
          `\nRaw notes:\n${notes.trim()}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
      if (!question.trim()) return null;
      return [
        depth === "deep"
          ? `Answer this research question in depth, covering nuance, trade-offs and comparisons.`
          : `Answer this research question with a focused, quick answer.`,
        `\nQuestion:\n${question.trim()}`,
      ].join("\n");
    },
    [mode, emailIntent, recipient, tone, length, notes, meetingTitle, attendees, question, depth],
  );

  const run = useCallback(
    async (prompt: string) => {
      lastPrompt.current = prompt;
      setLoading(true);
      setError(null);
      setOutput("");
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, prompt }),
        });

        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => "");
          if (response.status === 402) {
            throw new Error(
              detail || "AI credits are exhausted. Add credits in Lovable to keep generating.",
            );
          }
          if (response.status === 429) {
            throw new Error("Rate limited — please wait a moment and try again.");
          }
          throw new Error(detail || "Generation failed. Please try again.");
        }

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) setOutput((prev) => prev + value);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [mode],
  );

  const handleGenerate = (variants = false) => {
    const prompt = buildPrompt(variants);
    if (!prompt) {
      toast.error("Add some input first.");
      return;
    }
    void run(prompt);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <header className="mb-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            AI productivity assistant
          </span>
          <h1 className="mt-5 font-display text-5xl leading-[1.05] text-foreground md:text-6xl">
            Draftwise
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            One workspace for polished emails, actionable meeting summaries and structured
            research answers.
          </p>
        </header>

        <Tabs value={mode} onValueChange={(value) => setMode(value as AssistantMode)}>
          <TabsList className="mb-8 h-auto w-full max-w-md justify-start gap-1 rounded-xl bg-secondary p-1">
            {MODES.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="flex-1 gap-2 rounded-lg px-3 py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <TabsContent value="email" className="mt-0 space-y-5">
                <Field label="What's the email about?">
                  <Textarea
                    value={emailIntent}
                    onChange={(e) => setEmailIntent(e.target.value)}
                    placeholder="Rough notes, bullet points or a one-line intent…"
                    className="min-h-44 resize-y"
                  />
                </Field>
                <Field label="Recipient (optional)">
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. Maya, our new client at Northwind"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tone">
                    <Choice
                      value={tone}
                      onChange={setTone}
                      options={[
                        ["formal", "Formal"],
                        ["concise", "Concise"],
                        ["warm", "Warm"],
                        ["persuasive", "Persuasive"],
                      ]}
                    />
                  </Field>
                  <Field label="Length">
                    <Choice
                      value={length}
                      onChange={setLength}
                      options={[
                        ["short", "Short"],
                        ["medium", "Medium"],
                        ["detailed", "Detailed"],
                      ]}
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0 space-y-5">
                <Field label="Raw meeting notes">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paste your messy notes or transcript here…"
                    className="min-h-56 resize-y"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Meeting title (optional)">
                    <Input
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      placeholder="Q3 roadmap review"
                    />
                  </Field>
                  <Field label="Attendees (optional)">
                    <Input
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      placeholder="Ana, Piet, Sam"
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="research" className="mt-0 space-y-5">
                <Field label="Research question">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What should I know about…?"
                    className="min-h-44 resize-y"
                  />
                </Field>
                <Field label="Depth">
                  <Choice
                    value={depth}
                    onChange={setDepth}
                    options={[
                      ["quick", "Quick answer"],
                      ["deep", "Deep dive"],
                    ]}
                  />
                </Field>
              </TabsContent>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => handleGenerate(false)} disabled={loading} className="gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {loading ? "Generating…" : "Generate"}
                </Button>
                {mode === "email" && (
                  <Button
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleGenerate(true)}
                  >
                    3 alternative versions
                  </Button>
                )}
                {lastPrompt.current && !loading && (
                  <Button
                    variant="ghost"
                    className="gap-2"
                    onClick={() => lastPrompt.current && void run(lastPrompt.current)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Regenerate
                  </Button>
                )}
              </div>
            </section>

            <section className="flex min-h-[28rem] flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl text-foreground">Result</h2>
                {output && (
                  <Button size="sm" variant="outline" className="gap-2" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                )}
              </div>

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              ) : output ? (
                <article>
                  <MarkdownOutput content={output} />
                  {loading && <span className="ml-0.5 animate-pulse">▍</span>}
                </article>

              ) : loading ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <Sparkles className="mb-3 h-6 w-6 opacity-40" />
                  Your generated draft will appear here.
                </div>
              )}
            </section>
          </div>
        </Tabs>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Choice({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([id, label]) => (
          <SelectItem key={id} value={id}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
