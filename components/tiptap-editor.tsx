"use client"

import React, { useEffect, useCallback, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "tiptap-markdown"
import TableOfContents, { getHierarchicalIndexes } from "@tiptap/extension-table-of-contents"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Minus,
    CodeSquare,
    ListTree,
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Image } from '@tiptap/extension-image'
import { ImageUploadButton } from '@/components/tiptap-ui/image-upload-button'
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node'
import { handleImageUpload, MAX_FILE_SIZE } from '@/lib/tiptap-utils'
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { all, createLowlight } from "lowlight"
import { MermaidExtension } from "@/components/tiptap-node/mermaid-node"

// 创建 lowlight 实例，注册所有语言
const lowlight = createLowlight(all)

// TOC Anchor 类型定义
interface TocAnchor {
    id: string
    level: number
    textContent: string
    isActive: boolean
    isScrolledOver: boolean
    itemIndex: number
    pos: number
}

interface TiptapEditorProps {
    content?: string
    onChange?: (content: string) => void
    placeholder?: string
    className?: string
    editable?: boolean
    showToc?: boolean
    onTocUpdate?: (anchors: TocAnchor[]) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditorStorage = any

interface ToolbarButtonProps {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    tooltip: string
    children: React.ReactNode
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    onClick,
    isActive,
    disabled,
    tooltip,
    children,
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClick}
                disabled={disabled}
                className={cn(
                    "h-8 w-8 p-0",
                    isActive && "bg-muted"
                )}
            >
                {children}
            </Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>{tooltip}</p>
        </TooltipContent>
    </Tooltip>
)

export function TiptapEditor({
    content = "",
    onChange,
    className,
    editable = true,
    showToc = false,
    onTocUpdate,
}: TiptapEditorProps) {
    const [tocAnchors, setTocAnchors] = useState<TocAnchor[]>([])
    const [isTocVisible, setIsTocVisible] = useState(showToc)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            CodeBlockLowlight.configure({
                lowlight,
                defaultLanguage: 'plaintext',
                languageClassPrefix: 'language-',
            }),
            MermaidExtension,
            Markdown.configure({
                html: false,
                tightLists: true,
                bulletListMarker: "-",
                transformPastedText: true,
                transformCopiedText: true,
            }),
            Image,
            ImageUploadNode.configure({
                accept: 'image/*',
                maxSize: MAX_FILE_SIZE,
                limit: 3,
                upload: handleImageUpload,
                onError: (error) => console.error('Upload failed:', error),
            }),
            TableOfContents.configure({
                getIndex: getHierarchicalIndexes,
                onUpdate: (anchors) => {
                    const tocData = anchors.map((anchor) => ({
                        id: anchor.id,
                        level: anchor.level,
                        textContent: anchor.textContent,
                        isActive: anchor.isActive,
                        isScrolledOver: anchor.isScrolledOver,
                        itemIndex: anchor.itemIndex,
                        pos: anchor.pos,
                    }))
                    setTocAnchors(tocData)
                    onTocUpdate?.(tocData)
                },
            }),
        ],
        content: content,
        editable: editable,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: cn(
                    "prose max-w-none dark:prose-invert max-w-none",
                    "min-h-[200px] p-4 focus:outline-none"
                ),
            },
        },
        onUpdate: ({ editor }) => {
            if (onChange) {
                const storage = editor.storage as EditorStorage
                const markdown = storage.markdown?.getMarkdown() || ""
                onChange(markdown)
            }
        },
    })

    // Update content when prop changes
    useEffect(() => {
        if (editor) {
            const storage = editor.storage as EditorStorage
            const currentMarkdown = storage.markdown?.getMarkdown() || ""
            if (content !== currentMarkdown) {
                editor.commands.setContent(content)
            }
        }
    }, [content, editor])

    const setHeading = useCallback((level: 1 | 2 | 3) => {
        if (editor) {
            editor.chain().focus().toggleHeading({ level }).run()
        }
    }, [editor])

    const scrollToHeading = useCallback((pos: number) => {
        if (editor) {
            editor.chain().focus().setTextSelection(pos).run()
            // 滚动到对应位置
            const element = editor.view.domAtPos(pos)
            if (element.node instanceof HTMLElement) {
                element.node.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }
    }, [editor])

    const toggleToc = useCallback(() => {
        setIsTocVisible((prev) => !prev)
    }, [])

    if (!editor) {
        return (
            <div className={cn("border rounded-lg", className)}>
                <div className="h-8 border-b bg-muted/50 animate-pulse" />
                <div className="min-h-[200px] p-4 animate-pulse" />
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className={cn("border rounded-lg overflow-hidden", className)}>
                {/* Toolbar */}
                {editable && (
                    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
                        {/* Undo/Redo */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            tooltip="Undo"
                        >
                            <Undo className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            tooltip="Redo"
                        >
                            <Redo className="h-4 w-4" />
                        </ToolbarButton>

                        <Separator orientation="vertical" className="mx-1 h-6" />

                        {/* Headings */}
                        <ToolbarButton
                            onClick={() => setHeading(1)}
                            isActive={editor.isActive("heading", { level: 1 })}
                            tooltip="Heading 1"
                        >
                            <Heading1 className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => setHeading(2)}
                            isActive={editor.isActive("heading", { level: 2 })}
                            tooltip="Heading 2"
                        >
                            <Heading2 className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => setHeading(3)}
                            isActive={editor.isActive("heading", { level: 3 })}
                            tooltip="Heading 3"
                        >
                            <Heading3 className="h-4 w-4" />
                        </ToolbarButton>

                        <Separator orientation="vertical" className="mx-1 h-6" />

                        {/* Text formatting */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive("bold")}
                            tooltip="Bold"
                        >
                            <Bold className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive("italic")}
                            tooltip="Italic"
                        >
                            <Italic className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            isActive={editor.isActive("strike")}
                            tooltip="Strikethrough"
                        >
                            <Strikethrough className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            isActive={editor.isActive("code")}
                            tooltip="Inline Code"
                        >
                            <Code className="h-4 w-4" />
                        </ToolbarButton>

                        <Separator orientation="vertical" className="mx-1 h-6" />

                        {/* Lists */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive("bulletList")}
                            tooltip="Bullet List"
                        >
                            <List className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive("orderedList")}
                            tooltip="Ordered List"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </ToolbarButton>

                        <Separator orientation="vertical" className="mx-1 h-6" />

                        {/* Block elements */}
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            isActive={editor.isActive("blockquote")}
                            tooltip="Blockquote"
                        >
                            <Quote className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            isActive={editor.isActive("codeBlock")}
                            tooltip="Code Block"
                        >
                            <CodeSquare className="h-4 w-4" />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().setHorizontalRule().run()}
                            tooltip="Horizontal Rule"
                        >
                            <Minus className="h-4 w-4" />
                        </ToolbarButton>
                        <ImageUploadButton
                            editor={editor}
                            text="Add"
                            hideWhenUnavailable={true}
                            showShortcut={true}
                            onInserted={() => console.log('Image inserted!')}
                        />

                        <Separator orientation="vertical" className="mx-1 h-6" />

                        {/* TOC Toggle */}
                        <ToolbarButton
                            onClick={toggleToc}
                            isActive={isTocVisible}
                            tooltip="Table of Contents"
                        >
                            <ListTree className="h-4 w-4" />
                        </ToolbarButton>
                    </div>
                )}

                {/* Editor with optional TOC sidebar */}
                <div className="flex">
                    {/* TOC Sidebar */}
                    {isTocVisible && tocAnchors.length > 0 && (
                        <div className="w-56 border-r p-3 bg-muted/20 overflow-y-auto max-h-[500px]">
                            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                                Table of Contents
                            </h4>
                            <nav className="space-y-1">
                                {tocAnchors.map((anchor) => (
                                    <button
                                        key={anchor.id}
                                        type="button"
                                        onClick={() => scrollToHeading(anchor.pos)}
                                        className={cn(
                                            "block w-full text-left text-sm py-1 px-2 rounded hover:bg-muted transition-colors truncate",
                                            anchor.isActive && "bg-muted font-medium text-primary",
                                            anchor.isScrolledOver && !anchor.isActive && "text-muted-foreground"
                                        )}
                                        style={{ paddingLeft: `${(anchor.level - 1) * 12 + 8}px` }}
                                    >
                                        {anchor.textContent || `Heading ${anchor.itemIndex}`}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    )}

                    {/* Editor Content */}
                    <div className="flex-1">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}

export default TiptapEditor

