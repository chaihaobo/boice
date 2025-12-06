"use client"

import React, { useEffect, useRef, useState, useCallback, Component, ErrorInfo, ReactNode } from "react"
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react"
import mermaid from "mermaid"
import { cn } from "@/lib/utils"
import { X, ZoomIn, Code, Edit3, EyeOff } from "lucide-react"

// 初始化 mermaid - 使用 suppressErrors 避免抛出异常
mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    fontFamily: "inherit",
    suppressErrorRendering: true, // 阻止 mermaid 渲染错误到 DOM
})

// 图片预览 Modal 组件
interface PreviewModalProps {
    isOpen: boolean
    onClose: () => void
    svgContent: string
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, svgContent }) => {
    const [scale, setScale] = useState(1)

    // 关闭时重置缩放
    useEffect(() => {
        if (!isOpen) {
            setScale(1)
        }
    }, [isOpen])

    // ESC 键关闭
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown)
            // 防止背景滚动
            document.body.style.overflow = "hidden"
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = ""
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3))
    const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5))
    const handleReset = () => setScale(1)

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* 控制栏 - 手机端适配 */}
            <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 bg-background/90 rounded-full px-2 sm:px-4 py-1.5 sm:py-2 shadow-lg z-10">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleZoomOut() }}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-muted transition-colors text-foreground"
                    title="Zoom Out"
                >
                    <span className="text-base sm:text-lg font-bold">−</span>
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReset() }}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full hover:bg-muted transition-colors text-foreground min-w-[50px] sm:min-w-[60px]"
                >
                    {Math.round(scale * 100)}%
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleZoomIn() }}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-muted transition-colors text-foreground"
                    title="Zoom In"
                >
                    <span className="text-base sm:text-lg font-bold">+</span>
                </button>
            </div>

            {/* 关闭按钮 - 手机端适配 */}
            <button
                type="button"
                onClick={onClose}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full bg-background/90 hover:bg-background transition-colors text-foreground shadow-lg z-10"
                title="Close"
            >
                <X className="size-5 sm:size-6" />
            </button>

            {/* 图片内容 - 手机端全宽适配 */}
            <div
                className="w-[calc(100vw-1rem)] sm:w-auto sm:max-w-[95vw] max-h-[85vh] sm:max-h-[90vh] overflow-auto p-1 sm:p-4 mt-14 sm:mt-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="mermaid-preview-content bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-4 shadow-2xl transition-transform duration-200"
                    style={{ 
                        transform: `scale(${scale})`, 
                        transformOrigin: "center top",
                        maxWidth: '100%',
                    }}
                >
                    <div 
                        className="overflow-x-auto"
                        style={{
                            maxWidth: '100%',
                        }}
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                </div>
            </div>
        </div>
    )
}

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
    const [showCode, setShowCode] = useState(false)
    const [showPreview, setShowPreview] = useState(false) // 图片预览 Modal
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

    const handlePreviewClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (svgContent) {
            setShowPreview(true)
        }
    }, [svgContent])

    const handleClosePreview = useCallback(() => {
        setShowPreview(false)
    }, [])

    return (
        <NodeViewWrapper
            className={cn(
                "mermaid-node my-4 rounded-lg border transition-colors",
                selected && "ring-2 ring-primary ring-offset-2",
                error && "border-destructive"
            )}
        >
            {/* 图片预览 Modal */}
            <PreviewModal
                isOpen={showPreview}
                onClose={handleClosePreview}
                svgContent={svgContent}
            />

            {isEditing ? (
                <div className="p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Edit Mermaid
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="w-full h-32 sm:h-48 p-2 sm:p-3 font-mono text-xs sm:text-sm bg-muted rounded-md border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
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
                    {/* 顶部工具栏 - 手机端适配 */}
                    <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b bg-muted/30 flex-wrap gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Mermaid</span>
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* 预览按钮 */}
                            {svgContent && (
                                <button
                                    type="button"
                                    onClick={handlePreviewClick}
                                    className="p-1.5 sm:px-2 sm:py-1 text-xs rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors flex items-center gap-1"
                                    title="Fullscreen Preview"
                                >
                                    <ZoomIn className="size-3.5 sm:size-4" />
                                    <span className="hidden sm:inline">Preview</span>
                                </button>
                            )}
                            {/* 显示代码按钮 */}
                            <button
                                type="button"
                                onClick={toggleShowCode}
                                className={cn(
                                    "p-1.5 sm:px-2 sm:py-1 text-xs rounded transition-colors flex items-center gap-1",
                                    showCode 
                                        ? "bg-primary text-primary-foreground" 
                                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                )}
                                title={showCode ? "Hide Code" : "Show Code"}
                            >
                                {showCode ? <EyeOff className="size-3.5 sm:size-4" /> : <Code className="size-3.5 sm:size-4" />}
                                <span className="hidden sm:inline">{showCode ? "Hide" : "Code"}</span>
                            </button>
                            {/* 编辑按钮 */}
                            {editor.isEditable && (
                                <button
                                    type="button"
                                    onClick={handleEditClick}
                                    className="p-1.5 sm:px-2 sm:py-1 text-xs rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors flex items-center gap-1"
                                    title="Edit"
                                >
                                    <Edit3 className="size-3.5 sm:size-4" />
                                    <span className="hidden sm:inline">Edit</span>
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* 内容区域 */}
                    <div
                        className="p-2 sm:p-4"
                        onDoubleClick={handleDoubleClick}
                    >
                        {/* 代码显示区域 */}
                        {showCode && (
                            <div className="mb-4">
                                <pre className="p-2 sm:p-3 bg-muted rounded-md text-xs sm:text-sm overflow-x-auto max-h-48 sm:max-h-64">
                                    <code className="font-mono text-foreground whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal">{node.attrs.code}</code>
                                </pre>
                            </div>
                        )}
                        
                        {/* 渲染区域 - 点击打开预览 */}
                        {error ? (
                            <div className="p-3 sm:p-4 bg-destructive/10 rounded-md">
                                <p className="text-xs sm:text-sm text-destructive font-medium">Mermaid Error:</p>
                                <p className="text-xs text-destructive/80 mt-1">{error}</p>
                                {!showCode && (
                                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto max-h-32">
                                        <code className="whitespace-pre-wrap break-all">{node.attrs.code}</code>
                                    </pre>
                                )}
                            </div>
                        ) : svgContent ? (
                            <div 
                                className="relative cursor-pointer group/svg"
                                onClick={handlePreviewClick}
                            >
                                <div
                                    ref={containerRef}
                                    className="mermaid-svg overflow-x-auto flex justify-center"
                                    dangerouslySetInnerHTML={{ __html: svgContent }}
                                />
                                {/* 点击提示遮罩 - 手机端显示 */}
                                <div className="absolute inset-0 bg-black/0 group-hover/svg:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover/svg:opacity-100 sm:hidden pointer-events-none">
                                    <div className="bg-background/90 rounded-full p-2 shadow-lg">
                                        <ZoomIn className="size-5 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-20 sm:h-24 text-muted-foreground">
                                <span className="text-xs sm:text-sm">Empty mermaid diagram</span>
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

