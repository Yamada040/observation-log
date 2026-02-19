import { Observation } from "./types";

function contextLines(context: Observation["context"]): string {
  if (context.length === 0) {
    return "- (none)";
  }
  return context.map((c) => `- ${c.key}: ${c.value}`).join("\n");
}

export function toObservationMarkdown(item: Observation): string {
  return [
    `# ${item.title || "Untitled Observation"}`,
    "",
    `- Status: ${item.status}`,
    `- Confidence: ${item.confidence}`,
    `- Project: ${item.projectId ?? "(none)"}`,
    `- Tags: ${item.tags.join(", ") || "(none)"}`,
    `- Updated: ${item.updatedAt}`,
    "",
    "## Context",
    contextLines(item.context),
    "",
    "## Observation",
    item.observation || "",
    "",
    "## Interpretation",
    item.interpretation || "",
    "",
    "## Next Action",
    item.nextAction || "",
    "",
    "## Links",
    item.links.length > 0 ? item.links.map((l) => `- [${l.title || l.url}](${l.url})`).join("\n") : "- (none)",
    "",
    "## Attachments",
    item.attachments.length > 0 ? item.attachments.map((a) => `- ${a.fileName} (${a.kind}, ${a.size} bytes)`).join("\n") : "- (none)"
  ].join("\n");
}
