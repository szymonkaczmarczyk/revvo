import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: ({ children }) => <h3 className="mt-6 text-xl font-bold text-ink">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-6 text-xl font-bold text-ink">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-5 text-lg font-bold text-ink">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-5 font-bold text-ink">{children}</h4>,
  p: ({ children }) => <p className="[text-wrap:pretty]">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="nofollow ugc noopener noreferrer"
      className="font-semibold text-cobalt-text underline underline-offset-4 hover:text-cobalt-text-hover"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-6">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-copper/60 pl-4 text-ink-muted">{children}</blockquote>,
  code: ({ children }) => <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>,
  pre: ({ children }) => <pre className="overflow-x-auto rounded-md bg-surface-2 p-4 font-mono text-sm">{children}</pre>,
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-line-strong px-3 py-2 font-semibold text-ink">{children}</th>,
  td: ({ children }) => <td className="border-b border-line px-3 py-2">{children}</td>,
};

export function MarkdownBody({ source, className = "" }: { source: string; className?: string }) {
  return (
    <div className={`space-y-4 [overflow-wrap:anywhere] ${className}`}>
      <Markdown remarkPlugins={[remarkGfm]} components={components} disallowedElements={["img"]} unwrapDisallowed>
        {source}
      </Markdown>
    </div>
  );
}
