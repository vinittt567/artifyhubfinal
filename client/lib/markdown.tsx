import { ReactNode } from "react";

export function renderMarkdownNodes(text: string): ReactNode[] {
  const parts = text.split(/```/g);
  const nodes: ReactNode[] = [];
  parts.forEach((part, idx) => {
    if (!part) return;
    if (idx % 2 === 1) {
      nodes.push(
        <pre key={`code-${idx}`} className="my-3 text-sm leading-relaxed">
          <code>{part.trim()}</code>
        </pre>
      );
    } else {
      nodes.push(
        <p key={`text-${idx}`} className="whitespace-pre-wrap leading-relaxed">
          {part}
        </p>
      );
    }
  });
  return nodes;
}
