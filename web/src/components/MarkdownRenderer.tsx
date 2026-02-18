"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

interface MarkdownRendererProps {
  content: string;
  directoryName: string;
}

export default function MarkdownRenderer({
  content,
  directoryName,
}: MarkdownRendererProps) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Handle images
        img: ({ node, src, alt, ...props }) => {
          if (!src) return null;

          // Construct full image URL
          const imageUrl = src.startsWith("http")
            ? src
            : `${API_BASE_URL}/posts/${directoryName}/${src}`;

          return (
            <span className="block my-4">
              <img
                src={imageUrl}
                alt={alt || ""}
                className="max-w-full h-auto rounded-lg border-2 border-black"
                {...props}
              />
            </span>
          );
        },
        // Headings
        h1: ({ node, ...props }) => (
          <h1 className="text-3xl font-bold font-mono mb-4 mt-8" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-2xl font-bold font-mono mb-3 mt-6" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-xl font-bold font-mono mb-2 mt-4" {...props} />
        ),
        // Paragraphs
        p: ({ node, ...props }) => (
          <p className="mb-4 text-gray-700 leading-relaxed" {...props} />
        ),
        // Links
        a: ({ node, ...props }) => (
          <a
            className="text-yellow-600 hover:text-yellow-700 underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        // Lists
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside mb-4 space-y-2" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="text-gray-700 ml-4" {...props} />
        ),
        // Code blocks
        code: ({ node, inline, ...props }) => {
          return inline ? (
            <code
              className="bg-gray-100 border border-black px-1 py-0.5 rounded font-mono text-sm"
              {...props}
            />
          ) : (
            <code
              className="block bg-gray-100 border-2 border-black p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm"
              {...props}
            />
          );
        },
        // Blockquotes
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-yellow-600 pl-4 italic my-4 text-gray-600"
            {...props}
          />
        ),
        // Horizontal rules
        hr: ({ node, ...props }) => (
          <hr className="border-t-2 border-black my-8" {...props} />
        ),
        // Tables
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table
              className="min-w-full border-2 border-black"
              {...props}
            />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-gray-100" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th
            className="border border-black px-4 py-2 text-left font-mono font-bold"
            {...props}
          />
        ),
        td: ({ node, ...props }) => (
          <td className="border border-black px-4 py-2" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
