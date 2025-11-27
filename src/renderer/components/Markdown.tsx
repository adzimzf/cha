import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material'
import { useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { a11yDark, atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import * as toastActions from '../stores/toastActions'
import { sanitizeUrl } from '@braintree/sanitize-url'

import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you
import { copyToClipboard } from '@/packages/navigator'
import platform from '@/packages/platform'
import katex from 'katex'

export default function Markdown(props: {
    children: string
    hiddenCodeCopyButton?: boolean
    className?: string
}) {
    const { children, hiddenCodeCopyButton, className } = props
    const normalizeLatex = (s: string) => {
        let c = s
        c = c.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
        c = c.replace(/\\\(([^]*?)\\\)/g, '$$$1$')
        return c
    }
    const content = normalizeLatex(children)
    return useMemo(() => (
        <ReactMarkdown
            remarkPlugins={
                [remarkMath, remarkGfm, remarkBreaks]
            }
            rehypePlugins={[rehypeKatex]}
            className={`break-words ${className || ''}`}
            urlTransform={(url) => sanitizeUrl(url)}
            components={{
                table: (props: any) => Table({...props}),
                code: (props: any) => CodeBlock({ ...props, hiddenCodeCopyButton }),
                a: ({ node, ...props }) => (
                    <a
                        {...props}
                        target="_blank"
                        rel="noreferrer"
                        onClick={async (e) => {
                            e.stopPropagation()
                            if (props.href) await platform.openLink(props.href);
                        }}
                    />
                ),
            }}
        >
            { content }
        </ReactMarkdown>
    ), [content])
}

export function Table(props: any){
    const { t } = useTranslation()
    const theme = useTheme()
    return useMemo(() => {
        return (
            <div style={{ width: '100%' }}>
                <table
                    {...props}
                    style={{ width: '100%', tableLayout: 'fixed' }}
                />
            </div>
        )
    },[props.children, theme.palette.mode])
}

export function CodeBlock(props: any) {
    const { t } = useTranslation()
    const theme = useTheme()
    return useMemo(() => {
        const { children, className, node, hiddenCodeCopyButton, ...rest } = props
        const match = /language-(\w+)/.exec(className || '')
        const language = match?.[1] || 'text'
        if (!String(children).includes('\n')) {
            const s = String(children)
            const parts: Array<{ type: 'text' | 'math', value: string }> = []
            const regex = /\${1,2}([\s\S]+?)\${1,2}/g
            let lastIndex = 0
            let match
            while ((match = regex.exec(s)) !== null) {
                if (match.index > lastIndex) {
                    parts.push({ type: 'text', value: s.slice(lastIndex, match.index) })
                }
                const displayMode = match[0].startsWith('$$') && match[0].endsWith('$$')
                const html = katex.renderToString(match[1], { throwOnError: false, displayMode })
                parts.push({ type: 'math', value: html })
                lastIndex = regex.lastIndex
            }
            if (lastIndex < s.length) {
                parts.push({ type: 'text', value: s.slice(lastIndex) })
            }

            if (parts.some(p => p.type === 'math')) {
                return (
                    <span>
                        {parts.map((p, i) => p.type === 'math'
                            ? <span key={i} dangerouslySetInnerHTML={{ __html: p.value }} />
                            : <span key={i}>{p.value}</span>
                        )}
                    </span>
                )
            }

            return (
                <code
                    {...rest}
                    className={className}
                    style={{
                        backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f1f1f1',
                        padding: '2px 4px',
                        marigin: '0 4px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? '#444' : '#ddd',
                    }}
                >
                    {children}
                </code>
            )
        }
        return (
            <div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        backgroundColor: 'rgb(50, 50, 50)',
                        fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        borderTopLeftRadius: '0.3rem',
                        borderTopRightRadius: '0.3rem',
                        borderBottomLeftRadius: '0',
                        borderBottomRightRadius: '0',
                    }}
                >
                    <span
                        style={{
                            textDecoration: 'none',
                            color: 'gray',
                            padding: '2px',
                            margin: '2px 10px 0 10px',
                        }}
                    >
                        {'<' + language.toUpperCase() + '>'}
                    </span>
                    {
                        !hiddenCodeCopyButton && (
                            <ContentCopyIcon
                                sx={{
                                    textDecoration: 'none',
                                    color: 'white',
                                    padding: '1px',
                                    margin: '2px 10px 0 10px',
                                    cursor: 'pointer',
                                    opacity: 0.5,
                                    ':hover': {
                                        backgroundColor: 'rgb(80, 80, 80)',
                                        opacity: 1,
                                    },
                                }}
                                onClick={() => {
                                    copyToClipboard(String(children))
                                    toastActions.add(t('copied to clipboard'))
                                }}
                            />
                        )
                    }
                </div>
                <SyntaxHighlighter
                    children={String(children).replace(/\n$/, '')}
                    style={
                        theme.palette.mode === 'dark'
                            ? atomDark
                            : a11yDark
                    }
                    language={language}
                    PreTag="div"
                    wrapLongLines
                    customStyle={{
                        marginTop: '0',
                        margin: '0',
                        borderTopLeftRadius: '0',
                        borderTopRightRadius: '0',
                        borderBottomLeftRadius: '0.3rem',
                        borderBottomRightRadius: '0.3rem',
                        border: 'none',
                        overflowX: 'hidden',
                    }}
                />
            </div>
        )
    }, [props.children, theme.palette.mode])
}
