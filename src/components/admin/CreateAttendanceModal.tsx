'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createAttendance } from '@/app/admin/attendance/actions'
import { toISO } from '@/utils/date-helpers'

type CreateAttendanceModalProps = {
    isOpen: boolean
    onClose: () => void
    users: { id: string, full_name: string | null }[]
}

export function CreateAttendanceModal({ isOpen, onClose, users }: CreateAttendanceModalProps) {
    const [userId, setUserId] = useState(users[0]?.id || '')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [clockIn, setClockIn] = useState('09:00')
    const [clockOut, setClockOut] = useState('18:00')
    const [breakStart, setBreakStart] = useState('12:00')
    const [breakEnd, setBreakEnd] = useState('13:00')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // validate
            if (!userId) {
                throw new Error('ユーザーを選択してください')
            }
            if (!date) {
                throw new Error('日付を選択してください')
            }

            const data = {
                clock_in: toISO(date, clockIn),
                clock_out: toISO(date, clockOut),
                break_start: toISO(date, breakStart),
                break_end: toISO(date, breakEnd)
            }

            await createAttendance(userId, date, data)
            onClose()
            // Reset form optionally?
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
                    <DialogTitle>勤怠データの新規追加</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>従業員</Label>
                        <select
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-white"
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id} className="bg-slate-800 text-white">
                                    {user.full_name || 'No Name'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>日付</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>

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
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-white/10 hover:text-white">
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? '作成中...' : '作成する'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
