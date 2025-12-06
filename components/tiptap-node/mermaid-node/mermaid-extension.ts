"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { MermaidNodeView } from "./mermaid-node-view"

export interface MermaidOptions {
    HTMLAttributes: Record<string, unknown>
}

export interface MermaidStorage {
    markdown: {
        serialize: (state: MarkdownSerializerState, node: ProseMirrorNode) => void
        parse: Record<string, unknown>
    }
}

// Types for tiptap-markdown serialization
interface MarkdownSerializerState {
    write: (content: string) => void
    ensureNewLine: () => void
    closeBlock: (node: ProseMirrorNode) => void
}

interface ProseMirrorNode {
    attrs: Record<string, unknown>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MarkdownIt = any

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        mermaid: {
            /**
             * Insert a mermaid diagram
             */
            setMermaid: (code: string) => ReturnType
        }
    }
}

export const MermaidExtension = Node.create<MermaidOptions, MermaidStorage>({
    name: "mermaid",

    group: "block",

    atom: true,

    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: "mermaid-block",
            },
        }
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
                    const code = node.attrs.code as string || ""
                    state.write("```mermaid\n")
                    state.write(code)
                    state.ensureNewLine()
                    state.write("```")
                    state.closeBlock(node)
                },
                parse: {
                    // 配置 tiptap-markdown 解析 ```mermaid 代码块
                    setup(markdownit: MarkdownIt) {
                        // 使用 fence 规则拦截 mermaid 代码块
                        const defaultFence = markdownit.renderer.rules.fence
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        markdownit.renderer.rules.fence = (tokens: any, idx: any, options: any, env: any, self: any) => {
                            const token = tokens[idx]
                            if (token.info === 'mermaid') {
                                const code = token.content.trim()
                                return `<div data-type="mermaid" data-code="${code}"><pre class="language-mermaid"><code>${code}</code></pre></div>`
                            }
                            return defaultFence ? defaultFence(tokens, idx, options, env, self) : ''
                        }
                    },
                },
            },
        }
    },

    addAttributes() {
        return {
            code: {
                default: "graph TD\n  A[Start] --> B[End]",
                parseHTML: (element) => {
                    return element.querySelector("code")?.textContent
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="mermaid"]',
                getAttrs: (node) => {
                    if (typeof node === "string") return false
                    // 先尝试从 data-code 属性获取（URL encoded）
                    // const dataCode = node.getAttribute("data-code")
                    // if (dataCode) {
                    //     try {
                    //         return { code: decodeURIComponent(dataCode) }
                    //     } catch {
                    //         return { code: dataCode }
                    //     }
                    // }
                    // 否则从内部 code 元素获取
                    const codeEl = node.querySelector("code")
                    return { code: codeEl?.textContent || "" }
                },
            },
            {
                tag: "pre.language-mermaid",
                getAttrs: (node) => {
                    if (typeof node === "string") return false
                    const code = node.querySelector("code")?.textContent || ""
                    return { code }
                },
            },
        ]
    },

    renderHTML({ HTMLAttributes, node }) {
        return [
            "div",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                "data-type": "mermaid",
                "data-code": node.attrs.code,
            }),
            ["pre", { class: "language-mermaid" }, ["code", node.attrs.code]],
        ]
    },

    addNodeView() {
        return ReactNodeViewRenderer(MermaidNodeView)
    },

    addCommands() {
        return {
            setMermaid:
                (code: string) =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: { code },
                    })
                },
        }
    },

    // 支持输入 ```mermaid 创建 mermaid 块
    addInputRules() {
        return []
    },
})

export default MermaidExtension

