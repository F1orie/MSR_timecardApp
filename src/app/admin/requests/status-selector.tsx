'use client'

import { useState } from 'react'
import { updateRequestStatus } from './actions'

interface StatusSelectorProps {
    requestId: string
    currentStatus: string
}

export default function StatusSelector({ requestId, currentStatus }: StatusSelectorProps) {
    const [status, setStatus] = useState(currentStatus)
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value
        setStatus(newStatus) // Optimistically update
        setIsLoading(true)

        const result = await updateRequestStatus(requestId, newStatus)

        if (result?.error) {
            alert('ステータスの更新に失敗しました')
            setStatus(currentStatus) // Revert on failure
        }
        setIsLoading(false)
    }

    return (
        <div className="relative">
            <select
                value={status}
                onChange={handleChange}
                disabled={isLoading}
                className={`appearance-none bg-transparent border border-white/20 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500 cursor-pointer ${status === 'pending' ? 'text-yellow-400' : 'text-green-400'
                    }`}
            >
                <option value="pending" className="bg-slate-800 text-yellow-400">未対応</option>
                <option value="completed" className="bg-slate-800 text-green-400">対応済</option>
            </select>
            {isLoading && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                </div>
            )}
        </div>
    )
}
