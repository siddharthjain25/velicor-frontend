import React, { useState } from 'react';
import { Terminal, Copy, Check, Info, AlertTriangle, Lightbulb } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-1.5 py-0.5 rounded bg-muted/60 text-primary font-mono text-[13px] border border-border/40">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('[') && part.includes('](')) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const linkText = match[1];
          const url = match[2];
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 transition-colors font-medium"
            >
              {linkText}
            </a>
          );
        }
      }
      return part;
    });
  };

  const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="relative group rounded-xl border border-white/5 bg-[#0d1117] text-[#e6edf3] my-6 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#161b22]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-mono font-bold tracking-tight text-muted-foreground uppercase">
              {language || 'code'}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center gap-1 text-[11px] font-medium cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy
              </>
            )}
          </button>
        </div>
        <pre className="p-5 overflow-x-auto font-mono text-xs leading-relaxed max-w-full">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  const CalloutBlock: React.FC<{ content: string; alertType: string }> = ({ content, alertType }) => {
    let icon = <Info className="w-4 h-4 text-blue-400" />;
    let bgColor = 'bg-blue-500/[0.03]';
    let borderColor = 'border-blue-500/20';
    let titleColor = 'text-blue-400';
    let title = 'NOTE';

    if (alertType === 'tip') {
      icon = <Lightbulb className="w-4 h-4 text-emerald-400" />;
      bgColor = 'bg-emerald-500/[0.03]';
      borderColor = 'border-emerald-500/20';
      titleColor = 'text-emerald-400';
      title = 'TIP';
    } else if (alertType === 'warning') {
      icon = <AlertTriangle className="w-4 h-4 text-orange-400" />;
      bgColor = 'bg-orange-500/[0.03]';
      borderColor = 'border-orange-500/20';
      titleColor = 'text-orange-400';
      title = 'WARNING';
    } else if (alertType === 'important') {
      icon = <Info className="w-4 h-4 text-purple-400" />;
      bgColor = 'bg-purple-500/[0.03]';
      borderColor = 'border-purple-500/20';
      titleColor = 'text-purple-400';
      title = 'IMPORTANT';
    } else if (alertType === 'caution') {
      icon = <AlertTriangle className="w-4 h-4 text-red-400" />;
      bgColor = 'bg-red-500/[0.03]';
      borderColor = 'border-red-500/20';
      titleColor = 'text-red-400';
      title = 'CAUTION';
    }

    return (
      <div className={`p-4 rounded-xl border ${borderColor} ${bgColor} flex gap-3 my-6 animate-in fade-in duration-300`}>
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div className="space-y-1">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${titleColor}`}>{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{renderInlineText(content)}</p>
        </div>
      </div>
    );
  };

  // Build structure of markdown
  const blocks: { type: string; content: string; language?: string; alertType?: string }[] = [];
  const lines = content.split('\n');
  let currentBlockType = 'paragraph';
  let currentBlockLines: string[] = [];
  let codeLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (currentBlockType === 'code') {
        blocks.push({
          type: 'code',
          content: currentBlockLines.join('\n'),
          language: codeLanguage
        });
        currentBlockLines = [];
        currentBlockType = 'paragraph';
      } else {
        if (currentBlockLines.length > 0) {
          blocks.push({
            type: currentBlockType,
            content: currentBlockLines.join('\n')
          });
          currentBlockLines = [];
        }
        currentBlockType = 'code';
        codeLanguage = line.trim().slice(3).trim();
      }
      continue;
    }

    if (currentBlockType === 'code') {
      currentBlockLines.push(line);
      continue;
    }

    if (line.trim() === '---') {
      if (currentBlockLines.length > 0) {
        blocks.push({
          type: currentBlockType,
          content: currentBlockLines.join('\n')
        });
        currentBlockLines = [];
      }
      blocks.push({ type: 'hr', content: '' });
      currentBlockType = 'paragraph';
      continue;
    }

    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        if (currentBlockLines.length > 0) {
          blocks.push({
            type: currentBlockType,
            content: currentBlockLines.join('\n')
          });
          currentBlockLines = [];
        }
        const level = match[1].length;
        const text = match[2];
        blocks.push({
          type: `h${level}`,
          content: text
        });
        currentBlockType = 'paragraph';
        continue;
      }
    }

    if (line.trim().startsWith('>')) {
      if (currentBlockType !== 'blockquote' && currentBlockLines.length > 0) {
        blocks.push({
          type: currentBlockType,
          content: currentBlockLines.join('\n')
        });
        currentBlockLines = [];
      }
      currentBlockType = 'blockquote';
      currentBlockLines.push(line.trim().replace(/^>\s*/, ''));
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (currentBlockType !== 'list' && currentBlockLines.length > 0) {
        blocks.push({
          type: currentBlockType,
          content: currentBlockLines.join('\n')
        });
        currentBlockLines = [];
      }
      currentBlockType = 'list';
      currentBlockLines.push(line.trim().replace(/^[-*]\s*/, ''));
      continue;
    }

    if (line.trim() === '') {
      if (currentBlockLines.length > 0) {
        blocks.push({
          type: currentBlockType,
          content: currentBlockLines.join('\n')
        });
        currentBlockLines = [];
      }
      currentBlockType = 'paragraph';
      continue;
    }

    if (currentBlockType === 'blockquote') {
      currentBlockLines.push(line.trim().replace(/^>\s*/, ''));
    } else if (currentBlockType === 'list') {
      currentBlockLines.push(line.trim().replace(/^[-*]\s*/, ''));
    } else {
      currentBlockLines.push(line);
    }
  }

  if (currentBlockLines.length > 0) {
    blocks.push({
      type: currentBlockType,
      content: currentBlockLines.join('\n'),
      language: codeLanguage
    });
  }

  const processedBlocks = blocks.map(block => {
    if (block.type === 'blockquote') {
      const content = block.content;
      if (content.startsWith('[!NOTE]')) {
        return { ...block, type: 'callout', alertType: 'note', content: content.replace('[!NOTE]', '').trim() };
      } else if (content.startsWith('[!TIP]')) {
        return { ...block, type: 'callout', alertType: 'tip', content: content.replace('[!TIP]', '').trim() };
      } else if (content.startsWith('[!WARNING]')) {
        return { ...block, type: 'callout', alertType: 'warning', content: content.replace('[!WARNING]', '').trim() };
      } else if (content.startsWith('[!IMPORTANT]')) {
        return { ...block, type: 'callout', alertType: 'important', content: content.replace('[!IMPORTANT]', '').trim() };
      } else if (content.startsWith('[!CAUTION]')) {
        return { ...block, type: 'callout', alertType: 'caution', content: content.replace('[!CAUTION]', '').trim() };
      }
    }
    return block;
  });

  return (
    <div className="space-y-6 text-foreground max-w-none">
      {processedBlocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1 key={idx} className="text-3xl font-black tracking-tight text-white mt-8 mb-4 border-b border-border/40 pb-4">
                {renderInlineText(block.content)}
              </h1>
            );
          case 'h2':
            return (
              <h2 key={idx} className="text-xl font-bold tracking-tight text-white mt-8 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-primary inline-block" />
                {renderInlineText(block.content)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={idx} className="text-base font-bold text-white mt-6 mb-2">
                {renderInlineText(block.content)}
              </h3>
            );
          case 'h4':
            return (
              <h4 key={idx} className="text-sm font-bold text-white mt-4 mb-2">
                {renderInlineText(block.content)}
              </h4>
            );
          case 'hr':
            return <hr key={idx} className="my-8 border-t border-border/40" />;
          case 'code':
            return <CodeBlock key={idx} code={block.content} language={block.language} />;
          case 'callout':
            return <CalloutBlock key={idx} content={block.content} alertType={block.alertType || 'note'} />;
          case 'list':
            return (
              <ul key={idx} className="list-none space-y-2.5 my-4 pl-1">
                {block.content.split('\n').map((item, itemIdx) => (
                  <li key={itemIdx} className="text-sm text-muted-foreground flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-2" />
                    <span className="leading-relaxed">{renderInlineText(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'blockquote':
            return (
              <blockquote key={idx} className="border-l-4 border-muted pl-4 py-1 italic text-muted-foreground my-4">
                {renderInlineText(block.content)}
              </blockquote>
            );
          default:
            return (
              <p key={idx} className="text-sm text-muted-foreground leading-relaxed my-4">
                {renderInlineText(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
};
