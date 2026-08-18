import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";

import { createLovableResponsesProvider } from "@/lib/ai-gateway.server";
import { buildSystemPrompt, type AssistantMode } from "@/lib/assistant-prompts";

const BodySchema = z.object({
  mode: z.enum(["email", "notes", "research"]),
  prompt: z.string().min(1).max(20000),
});

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: { mode: AssistantMode; prompt: string };
        try {
          parsed = BodySchema.parse(await request.json());
        } catch {
          return new Response("Invalid request", { status: 400 });
        }

        try {
          const { lovable } = createLovableResponsesProvider(request);

          const result = streamText({
            model: lovable.responses("openai/gpt-5.6-sol"),
            system: buildSystemPrompt(parsed.mode),
            prompt: parsed.prompt,
            abortSignal: request.signal,
            providerOptions: {
              openai: {
                forceReasoning: true,
                reasoningEffort: "low",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            },
          });

          return result.toTextStreamResponse({
            headers: { "Cache-Control": "no-store" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          const status = /402|credit/i.test(message)
            ? 402
            : /429/.test(message)
              ? 429
              : 500;
          return new Response(message, { status });
        }
      },
    },
  },
});
