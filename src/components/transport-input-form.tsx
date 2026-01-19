'use client'

import { useState } from 'react'
import { Plus, Trash2, Train } from 'lucide-react'
import { addTransportationRecords, TransportationRecordInput } from '@/features/transportation/actions'

type Props = {
    attendanceId: string
    currentRecords?: {
        id: string
        origin: string
        destination: string
        transport_method: string
        amount: number
    }[]
    onSuccess?: () => void
}

type FormRow = {
    id: string // temporary id for react key
    origin: string
    destination: string
    transport_method: string
    route_type: '片道' | '往復'
    amount: number | ''
}

export function TransportInputForm({ attendanceId, currentRecords = [], onSuccess }: Props) {
    const [rows, setRows] = useState<FormRow[]>([
        { id: '1', origin: '', destination: '', transport_method: '電車', route_type: '片道', amount: '' }
    ])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const addRow = () => {
        setRows([...rows, {
            id: Math.random().toString(36).substr(2, 9),
            origin: '',
            destination: '',
            transport_method: '電車',
            route_type: '片道',
            amount: ''
        }])
    }

    const removeRow = (id: string) => {
        if (rows.length === 1) return
        setRows(rows.filter(r => r.id !== id))
    }

    const updateRow = (id: string, field: keyof FormRow, value: string | number) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
    }

    const handleSubmit = async () => {
        if (loading) return
        setError(null)

        // Validation
        const validRows = rows.filter(r => r.origin && r.destination && r.amount !== '')
        if (validRows.length === 0) {
            setError('少なくとも1つの有効な経路を入力してください')
            return
        }

        setLoading(true)

        const payload: TransportationRecordInput[] = validRows.map(r => ({
            attendance_record_id: attendanceId,
            origin: r.origin,
            destination: r.destination,
            transport_method: r.transport_method,
            route_type: r.route_type,
            amount: Number(r.amount)
        }))

        const result = await addTransportationRecords(payload)

        setLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            setRows([{ id: Math.random().toString(36), origin: '', destination: '', transport_method: '電車', route_type: '片道', amount: '' }])
            setIsOpen(false)
            if (onSuccess) onSuccess()
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
                <Train className="w-4 h-4" />
                交通費を入力
            </button>
        )
    }

    return (
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Train className="w-4 h-4 text-emerald-400" />
                    本日の交通費
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-sm">
                    閉じる
                </button>
            </div>

            {currentRecords.length > 0 && (
                <div className="mb-4 text-sm text-gray-400 bg-slate-800/50 p-3 rounded">
                    <p className="mb-1 text-xs font-bold text-gray-500">登録済み:</p>
                    {currentRecords.map((rec) => (
                        <div key={rec.id} className="flex justify-between border-b border-gray-700/50 last:border-0 py-1">
                            <span>{rec.origin} ↔ {rec.destination} ({rec.transport_method})</span>
                            <span>¥{rec.amount}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-3">
                {rows.map((row) => (
                    <div key={row.id} className="p-3 bg-slate-800 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="出発 (例: 北千住)"
                                value={row.origin}
                                onChange={(e) => updateRow(row.id, 'origin', e.target.value)}
                                className="bg-black/30 border border-slate-600 rounded px-2 py-1 text-white text-sm w-full"
                            />
                            <span className="text-gray-500">~</span>
                            <input
                                type="text"
                                placeholder="到着 (例: 明治神宮前)"
                                value={row.destination}
                                onChange={(e) => updateRow(row.id, 'destination', e.target.value)}
                                className="bg-black/30 border border-slate-600 rounded px-2 py-1 text-white text-sm w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="手段 (例: 電車)"
                                value={row.transport_method}
                                onChange={(e) => updateRow(row.id, 'transport_method', e.target.value)}
                                className="bg-black/30 border border-slate-600 rounded px-2 py-1 text-white text-sm flex-1"
                            />
                            <select
                                value={row.route_type}
                                onChange={(e) => updateRow(row.id, 'route_type', e.target.value)}
                                className="bg-black/30 border border-slate-600 rounded px-2 py-1 text-white text-sm w-20"
                            >
                                <option value="片道">片道</option>
                                <option value="往復">往復</option>
                            </select>
                            <input
                                type="number"
                                placeholder="金額"
                                value={row.amount}
                                onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                                className="bg-black/30 border border-slate-600 rounded px-2 py-1 text-white text-sm w-20 text-right"
                            />
                            {rows.length > 1 && (
                                <button onClick={() => removeRow(row.id)} className="text-red-400 hover:text-red-300 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mt-4">
                <button
                    onClick={addRow}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-sm flex items-center justify-center gap-1 border border-slate-700"
                >
                    <Plus className="w-4 h-4" />
                    経路を追加
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                    {loading ? '保存中...' : '保存する'}
                </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        </div>
    )
}
