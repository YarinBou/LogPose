import { llmsIndex } from "@/lib/llms";

// Built once at build time and served as a static file.
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsIndex(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
