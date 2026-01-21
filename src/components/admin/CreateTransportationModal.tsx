'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { createTransportationRecord } from '@/features/admin/transportation-actions'

interface CreateTransportationModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
}

export function CreateTransportationModal({ isOpen, onClose, userId }: CreateTransportationModalProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        transport_method: '',
        route_type: '片道',
        amount: 0
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
        setError(null)

        try {
            if (!date) {
                throw new Error('日付を選択してください')
            }

            await createTransportationRecord(userId, date, formData)

            // Reset form
            setFormData({
                origin: '',
                destination: '',
                transport_method: '',
                route_type: '片道',
                amount: 0
            })
            onClose()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '作成に失敗しました'
            console.error(err)
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-panel text-white border-white/10">
                <DialogHeader>
                    <DialogTitle>交通費の新規追加</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>日付</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>出発</Label>
                            <Input
                                name="origin"
                                value={formData.origin}
                                onChange={handleChange}
                                placeholder="例: 東京駅"
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
                                placeholder="例: 新宿駅"
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
                            placeholder="例: 1200"
                            className="bg-slate-800 border-slate-700 text-white font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <DialogFooter>
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
                            {loading ? '作成中...' : '作成する'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
