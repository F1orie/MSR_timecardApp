'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'

interface Employee {
    id: string
    full_name: string | null
    username: string | null
    role: string
}

interface ExportModalProps {
    isOpen: boolean
    onClose: () => void
    employees: Employee[]
    currentMonth: string
}

export function ExportModal({ isOpen, onClose, employees, currentMonth }: ExportModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isExporting, setIsExporting] = useState(false)

    if (!isOpen) return null

    const handleSelectAll = () => {
        if (selectedIds.size === employees.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(employees.map(e => e.id)))
        }
    }

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const handleExport = async () => {
        if (selectedIds.size === 0) return

        setIsExporting(true)
        try {
            const [year, month] = currentMonth.split('-')
            const response = await fetch(`/api/export-monthly-report?year=${year}&month=${month}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userIds: Array.from(selectedIds) }),
            })

            if (!response.ok) throw new Error('Export failed')

            // Trigger file download
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            // If multiple users selected, it's a zip file. If 1, it's an xlsx.
            // But we can check Content-Disposition or content-type if we want,
            // or just rely on backend to set filename via Content-Disposition.
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = 'export'
            if (contentDisposition) {
                const match = contentDisposition.match(/filename\*=UTF-8''(.+)/) || contentDisposition.match(/filename="(.+)"/)
                if (match && match[1]) {
                    filename = decodeURIComponent(match[1])
                }
            } else {
                filename = selectedIds.size > 1 ? `${month}月_勤務表.zip` : '勤務表.xlsx'
            }

            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            onClose()
        } catch (error) {
            console.error('Failed to export:', error)
            alert('エクセル出力に失敗しました。')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-white">エクセル出力対象の選択</h2>
                        <p className="text-gray-400 text-sm mt-1">{currentMonth}の出力対象メンバーを選択してください</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-sm text-gray-400">{selectedIds.size}名選択中</span>
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            {selectedIds.size === employees.length ? 'すべて解除' : 'すべて選択'}
                        </button>
                    </div>

                    <div className="space-y-2">
                        {employees.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => toggleSelection(emp.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${
                                    selectedIds.has(emp.id)
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                        : 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                                    selectedIds.has(emp.id)
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-gray-500 bg-transparent'
                                }`}>
                                    {selectedIds.has(emp.id) && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{emp.full_name || '名称未設定'}</div>
                                    <div className="text-xs opacity-70">ID: {emp.username}</div>
                                </div>
                            </div>
                        ))}
                        {employees.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                選択可能なメンバーがいません
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                        disabled={isExporting}
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={selectedIds.size === 0 || isExporting}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isExporting ? '処理中...' : '出力および保存'}
                    </button>
                </div>
            </div>
        </div>
    )
}
