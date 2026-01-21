'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateTransportationRecord, deleteTransportationRecord } from '@/features/admin/transportation-actions'

interface EditTransportationModalProps {
    isOpen: boolean
    onClose: () => void
    record: {
        id: string
        origin: string
        destination: string
        transport_method: string
        route_type: string
        amount: number
    }
}

export function EditTransportationModal({ isOpen, onClose, record }: EditTransportationModalProps) {
    const [formData, setFormData] = useState({
        origin: record.origin,
        destination: record.destination,
        transport_method: record.transport_method,
        route_type: record.route_type,
        amount: record.amount
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseInt(value) || 0 : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await updateTransportationRecord(record.id, formData)
            onClose()
        } catch (err) {
            console.error(err)
            setError('更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('本当に削除しますか？')) return
        setLoading(true)
        try {
            await deleteTransportationRecord(record.id)
            onClose()
        } catch (err) {
            console.error(err)
            setError('削除に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-panel text-white border-white/10">
                <DialogHeader>
                    <DialogTitle>交通費の修正</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>出発</Label>
                            <Input
                                name="origin"
                                value={formData.origin}
                                onChange={handleChange}
                                className="bg-slate-800 border-slate-700 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>到着</Label>
                            <Input
                                name="destination"
                                value={formData.destination}
                                onChange={handleChange}
                                className="bg-slate-800 border-slate-700 text-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>交通手段</Label>
                            <Input
                                name="transport_method"
                                value={formData.transport_method}
                                onChange={handleChange}
                                placeholder="例: 電車(千代田線)"
                                className="bg-slate-800 border-slate-700 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>区分</Label>
                            <select
                                name="route_type"
                                value={formData.route_type}
                                onChange={handleChange}
                                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                            >
                                <option value="片道">片道</option>
                                <option value="往復">往復</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>金額</Label>
                        <Input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="bg-slate-800 border-slate-700 text-white font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="text-red-400 hover:text-red-300 text-sm px-2"
                        >
                            削除
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded hover:bg-white/10 text-gray-300 transition"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
                            >
                                {loading ? '更新中...' : '保存'}
                            </button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
