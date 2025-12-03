"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ImagePlus, X, Loader2 } from "lucide-react"
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"
import Image from "next/image"

interface CoverImageUploadProps {
    value: string | null
    onChange: (url: string | null) => void
    className?: string
}

export function CoverImageUpload({ value, onChange, className }: CoverImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Reset states
        setError(null)
        setIsUploading(true)
        setUploadProgress(0)

        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select an image file')
            }

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
            }

            const url = await handleImageUpload(
                file,
                (event) => setUploadProgress(event.progress)
            )

            onChange(url)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
            // Reset input
            if (inputRef.current) {
                inputRef.current.value = ''
            }
        }
    }

    const handleRemove = () => {
        onChange(null)
    }

    const handleClick = () => {
        inputRef.current?.click()
    }

    return (
        <div className={cn("space-y-2", className)}>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
            />

            {value ? (
                <div className="relative group">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                        <Image
                            src={value}
                            alt="Cover image"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleClick}
                            disabled={isUploading}
                        >
                            <ImagePlus className="h-4 w-4 mr-1" />
                            Replace
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemove}
                            disabled={isUploading}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={handleClick}
                    className={cn(
                        "relative aspect-video w-full rounded-lg border-2 border-dashed",
                        "flex flex-col items-center justify-center gap-2 cursor-pointer",
                        "hover:border-primary hover:bg-muted/50 transition-colors",
                        isUploading && "pointer-events-none opacity-50"
                    )}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Uploading... {uploadProgress}%
                            </p>
                        </>
                    ) : (
                        <>
                            <ImagePlus className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Click to upload cover image
                            </p>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG, GIF, WebP (max 5MB)
                            </p>
                        </>
                    )}
                </div>
            )}

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    )
}


