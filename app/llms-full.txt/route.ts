import { llmsFull } from "@/lib/llms";

// Built once at build time and served as a static file.
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsFull(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
