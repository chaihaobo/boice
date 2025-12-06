"use client"

import React, { useEffect, useRef, useState, useCallback, Component, ErrorInfo, ReactNode } from "react"
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react"
import mermaid from "mermaid"
import { cn } from "@/lib/utils"

// 初始化 mermaid - 使用 suppressErrors 避免抛出异常
mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    fontFamily: "inherit",
    suppressErrorRendering: true, // 阻止 mermaid 渲染错误到 DOM
})

// 错误边界组件
interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

class MermaidErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Mermaid Error Boundary caught an error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive font-medium">Render Error</p>
                    <p className="text-xs text-destructive/80 mt-1">
                        {this.state.error?.message || "An error occurred while rendering"}
                    </p>
                </div>
            )
        }

        return this.props.children
    }
}

export const MermaidNodeView: React.FC<NodeViewProps> = ({
    node,
    updateAttributes,
    selected,
    editor,
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [showCode, setShowCode] = useState(false) // 新增：显示代码切换
    const [editCode, setEditCode] = useState(node.attrs.code || "")
    const [error, setError] = useState<string | null>(null)
    const [svgContent, setSvgContent] = useState<string>("")

    const renderMermaid = useCallback(async (code: string) => {
        if (!code.trim()) {
            setSvgContent("")
            setError(null)
            return
        }

        try {
            // 先验证语法
            const isValid = await mermaid.parse(code, { suppressErrors: true })
            if (!isValid) {
                setError("Invalid mermaid syntax")
                setSvgContent("")
                return
            }

            // 每次渲染使用新的 ID
            const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
            const { svg } = await mermaid.render(uniqueId, code)
            setSvgContent(svg)
            setError(null)
        } catch (err) {
            console.error("Mermaid render error:", err)
            // 提取更友好的错误信息
            let errorMessage = "Failed to render diagram"
            if (err instanceof Error) {
                // Mermaid 错误通常包含详细信息
                errorMessage = err.message.split('\n')[0] || errorMessage
            }
            setError(errorMessage)
            setSvgContent("")
        }
    }, [])

    useEffect(() => {
        renderMermaid(node.attrs.code || "")
    }, [node.attrs.code, renderMermaid])

    // 检测暗色模式并更新 mermaid 主题
    useEffect(() => {
        const updateTheme = () => {
            try {
                const isDark = document.documentElement.classList.contains("dark")
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? "dark" : "default",
                    securityLevel: "loose",
                    fontFamily: "inherit",
                    suppressErrorRendering: true,
                })
                renderMermaid(node.attrs.code || "")
            } catch (err) {
                console.error("Error updating mermaid theme:", err)
            }
        }

        // 初始检测
        updateTheme()

        // 监听主题变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "class") {
                    updateTheme()
                }
            })
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        })

        return () => observer.disconnect()
    }, [node.attrs.code, renderMermaid])

    const handleSave = useCallback(() => {
        updateAttributes({ code: editCode })
        setIsEditing(false)
    }, [editCode, updateAttributes])

    const handleCancel = useCallback(() => {
        setEditCode(node.attrs.code || "")
        setIsEditing(false)
    }, [node.attrs.code])

    const handleDoubleClick = useCallback(() => {
        if (editor.isEditable) {
            setIsEditing(true)
        }
    }, [editor.isEditable])

    const toggleShowCode = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowCode((prev) => !prev)
    }, [])

    const handleEditClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsEditing(true)
    }, [])

    return (
        <NodeViewWrapper
            className={cn(
                "mermaid-node my-4 rounded-lg border transition-colors",
                selected && "ring-2 ring-primary ring-offset-2",
                error && "border-destructive"
            )}
        >
            {isEditing ? (
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                            Edit Mermaid Diagram
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-3 py-1 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="w-full h-48 p-3 font-mono text-sm bg-muted rounded-md border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter mermaid code here..."
                        spellCheck={false}
                    />
                    {/* 实时预览 */}
                    <div className="border-t pt-3">
                        <span className="text-xs text-muted-foreground mb-2 block">Preview:</span>
                        <MermaidPreview code={editCode} />
                    </div>
                </div>
            ) : (
                <div className="group">
                    {/* 顶部工具栏 */}
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                        <span className="text-xs font-medium text-muted-foreground">Mermaid</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleShowCode}
                                className={cn(
                                    "px-2 py-1 text-xs rounded transition-colors",
                                    showCode 
                                        ? "bg-primary text-primary-foreground" 
                                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                )}
                            >
                                {showCode ? "Hide Code" : "Show Code"}
                            </button>
                            {editor.isEditable && (
                                <button
                                    type="button"
                                    onClick={handleEditClick}
                                    className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* 内容区域 */}
                    <div
                        className="p-4"
                        onDoubleClick={handleDoubleClick}
                    >
                        {/* 代码显示区域 */}
                        {showCode && (
                            <div className="mb-4">
                                <pre className="p-3 bg-muted rounded-md text-sm overflow-x-auto">
                                    <code className="font-mono text-foreground">{node.attrs.code}</code>
                                </pre>
                            </div>
                        )}
                        
                        {/* 渲染区域 */}
                        {error ? (
                            <div className="p-4 bg-destructive/10 rounded-md">
                                <p className="text-sm text-destructive font-medium">Mermaid Error:</p>
                                <p className="text-xs text-destructive/80 mt-1">{error}</p>
                                {!showCode && (
                                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                        <code>{node.attrs.code}</code>
                                    </pre>
                                )}
                            </div>
                        ) : svgContent ? (
                            <div className="relative">
                                <div
                                    ref={containerRef}
                                    className="mermaid-svg overflow-x-auto flex justify-center"
                                    dangerouslySetInnerHTML={{ __html: svgContent }}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-24 text-muted-foreground">
                                <span className="text-sm">Empty mermaid diagram</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </NodeViewWrapper>
    )
}

// 预览组件
const MermaidPreview: React.FC<{ code: string }> = ({ code }) => {
    const [svg, setSvg] = useState<string>("")
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const render = async () => {
            if (!code.trim()) {
                setSvg("")
                setError(null)
                return
            }

            try {
                // 先验证语法
                const isValid = await mermaid.parse(code, { suppressErrors: true })
                if (!isValid) {
                    setError("Invalid mermaid syntax")
                    setSvg("")
                    return
                }

                const uniqueId = `preview-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
                const { svg: svgCode } = await mermaid.render(uniqueId, code)
                setSvg(svgCode)
                setError(null)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message.split('\n')[0] : "Syntax error"
                setError(errorMessage)
                setSvg("")
            }
        }

        // 防抖渲染
        const timer = setTimeout(render, 300)
        return () => clearTimeout(timer)
    }, [code])

    if (error) {
        return (
            <div className="p-2 text-xs text-destructive bg-destructive/10 rounded">
                {error}
            </div>
        )
    }

    if (!svg) {
        return (
            <div className="p-2 text-xs text-muted-foreground">
                Enter mermaid code to see preview...
            </div>
        )
    }

    return (
        <MermaidErrorBoundary
            fallback={
                <div className="p-2 text-xs text-destructive bg-destructive/10 rounded">
                    Failed to render preview
                </div>
            }
        >
            <div
                className="overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </MermaidErrorBoundary>
    )
}

export default MermaidNodeView

