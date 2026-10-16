import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const html = useMemo(() => {
    // Configure marked renderer for external links
    const renderer = new marked.Renderer();
    const originalLink = renderer.link.bind(renderer);

    renderer.link = ({ href, title, text }) => {
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${targetAttr}${titleAttr} class="text-slate-800 underline underline-offset-4 decoration-slate-400 hover:decoration-slate-800 transition-colors font-medium">${text}</a>`;
    };

    return marked.parse(content, {
      renderer,
      gfm: true,
      breaks: false,
    });
  }, [content]);

  return (
    <div
      className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-base space-y-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_table]:w-full [&_table]:my-4 [&_table]:text-left [&_table]:border-collapse [&_th]:border-b [&_th]:border-slate-300 [&_th]:p-2 [&_th]:font-semibold [&_th]:bg-slate-100 [&_td]:border-b [&_td]:border-slate-200 [&_td]:p-2 [&_hr]:my-6 [&_hr]:border-slate-200"
      dangerouslySetInnerHTML={{ __html: html as string }}
    />
  );
};
