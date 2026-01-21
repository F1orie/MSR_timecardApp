'use client'

import { Download } from 'lucide-react'
import { useState } from 'react'

interface ExportButtonProps {
    userId: string
    userName: string
    year: number
    month: number
}

export function ExportButton({ userId, userName, year, month }: ExportButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownload = () => {
        setIsDownloading(true)
        // Direct navigation to trigger download
        const url = `/api/export-transport?userId=${userId}&year=${year}&month=${month}`

        // Use a temporary anchor to download to avoid replacing current page state if possible,
        // or just window.location.href works for attachments.
        // window.location.href = url

        // Better UX: Create hidden link
        const link = document.createElement('a')
        link.href = url
        link.download = `${userName}_立替交通費精算書.xlsx` // Fallback, though server sets it
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Reset state after a short delay
        setTimeout(() => setIsDownloading(false), 2000)
    }

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? '出力中...' : 'Excel出力'}</span>
        </button>
    )
}
