import { File, Upload, X } from "lucide-react"
import { useState } from "react"
import { Card } from "./ui/Card"

interface FileUploadCardProps {
  title?: string
  description?: string
  acceptedFileTypes?: string[]
  maxSize?: number // in MB
  maxFiles?: number
  onFilesSelected?: (files: File[]) => void
}

export function FileUploadCard({
  title = "Upload Files",
  description = "Drag and drop your files here or click to browse",
  acceptedFileTypes = ["*"],
  maxSize = 10,
  maxFiles = 10,
  onFilesSelected
}: FileUploadCardProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validType = acceptedFileTypes.includes("*") || 
        acceptedFileTypes.includes(file.type)
      const validSize = file.size <= maxSize * 1024 * 1024
      return validType && validSize
    })

    if (selectedFiles.length + validFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`)
      return
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
    onFilesSelected?.(validFiles)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <div className="p-6">
        <div
          className={`
            border-2 border-dashed rounded-lg p-8
            ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
            <input
              type="file"
              multiple
              accept={acceptedFileTypes.join(",")}
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer"
            >
              Browse Files
            </label>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(file.size / 1024)}KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
} 