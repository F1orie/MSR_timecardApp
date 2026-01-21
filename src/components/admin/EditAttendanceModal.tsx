'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateAttendance, deleteAttendance } from '@/app/admin/attendance/actions'

interface EditAttendanceModalProps {
    isOpen: boolean
    onClose: () => void
    record: {
        id: string
        date: string
        clock_in: string | null
        clock_out: string | null
        break_records: {
            start_time: string
            end_time: string | null
        }[]
    }
}

export function EditAttendanceModal({ isOpen, onClose, record }: EditAttendanceModalProps) {
    const defaultBreak = record.break_records?.[0] || { start_time: '', end_time: '' }

    // Helper to extract HH:mm from ISO string
    const toTime = (iso: string | null) => {
        if (!iso) return ''
        const date = new Date(iso)
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
    }

    // Helper to combine Date + Time -> ISO
    const toISO = (dateStr: string, timeStr: string) => {
        if (!timeStr) return null
        return new Date(`${dateStr.split('T')[0]}T${timeStr}:00`).toISOString()
    }

    const [clockIn, setClockIn] = useState(toTime(record.clock_in))
    const [clockOut, setClockOut] = useState(toTime(record.clock_out))
    const [breakStart, setBreakStart] = useState(toTime(defaultBreak.start_time))
    const [breakEnd, setBreakEnd] = useState(toTime(defaultBreak.end_time))
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Use the record.date (which is like 2026-01-01) as the base date.
            // Note: clock_out might be next day technically, but for simple UI we assume same day 
            // OR if the system supports crossing midnight we need more complex logic.
            // For this app, let's assume same day entry or user handles date if we switch to datetime picker.
            // However, the input type="time" only gives HH:mm.
            // Current system likely assumes the date associated with the record.
            // If clock_in < clock_out, fine. If clock_out < clock_in (overnight), we might need to add a day.
            // For simplicity in this iteration: combine with record.date.

            // Wait, record.date is likely YYYY-MM-DD or ISO.
            const baseDate = record.date.split('T')[0]

            const data = {
                clock_in: toISO(baseDate, clockIn),
                clock_out: toISO(baseDate, clockOut), // Potential issue if overnight
                break_start: toISO(baseDate, breakStart),
                break_end: toISO(baseDate, breakEnd)
            }

            // Simple overnight check: if out < in, assume out is next day?
            // This is risky without explicit "Next Day" checkbox or datetime picker.
            // Let's stick to same day for now, as is common in simple editors unless specified.
            // If the user really needs next day, they usually edit the actual timestamp or we provide a checkbox.
            // Given the constraints, let's trust the base date.

            await updateAttendance(record.id, data)
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
            await deleteAttendance(record.id)
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
                    <DialogTitle>勤怠時間の修正</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>出勤時間</Label>
                            <Input
                                type="time"
                                value={clockIn}
                                onChange={(e) => setClockIn(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>退勤時間</Label>
                            <Input
                                type="time"
                                value={clockOut}
                                onChange={(e) => setClockOut(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>休憩開始</Label>
                            <Input
                                type="time"
                                value={breakStart}
                                onChange={(e) => setBreakStart(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>休憩終了</Label>
                            <Input
                                type="time"
                                value={breakEnd}
                                onChange={(e) => setBreakEnd(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
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
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50 mr-auto"
                        >
                            削除
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
                        >
                            {loading ? '更新中...' : '保存'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
