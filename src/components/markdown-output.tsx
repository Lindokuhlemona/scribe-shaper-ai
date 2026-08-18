import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownOutput({ content }: { content: string }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h3 className="font-display text-lg text-foreground" {...props} />,
          h2: (props) => (
            <h3
              className="mt-5 font-display text-base uppercase tracking-[0.08em] text-foreground"
              {...props}
            />
          ),
          h3: (props) => <h4 className="mt-4 font-medium text-foreground" {...props} />,
          p: (props) => <p className="mb-3 last:mb-0" {...props} />,
          ul: (props) => <ul className="mb-3 list-disc space-y-1 pl-5" {...props} />,
          ol: (props) => <ol className="mb-3 list-decimal space-y-1 pl-5" {...props} />,
          strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
          a: (props) => (
            <a className="text-primary underline underline-offset-2" {...props} />
          ),
          table: (props) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-left text-sm" {...props} />
            </div>
          ),
          th: (props) => (
            <th
              className="border-b border-border bg-secondary px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground"
              {...props}
            />
          ),
          td: (props) => <td className="border-b border-border px-3 py-2 align-top" {...props} />,
          code: (props) => (
            <code className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em]" {...props} />
          ),
          hr: () => <hr className="my-5 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
