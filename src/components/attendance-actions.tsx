'use client'

import { useState, useTransition } from 'react'
import { clockIn, clockOut, startBreak, endBreak } from '@/features/attendance/actions'

type Props = {
    attendance: any
    isClockedIn: boolean
    isClockedOut: boolean
    isOnBreak: boolean
    activeBreakId?: string
}

export function AttendanceActions({ attendance, isClockedIn, isClockedOut, isOnBreak, activeBreakId }: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleAction = async (action: () => Promise<any>) => {
        setError(null)
        startTransition(async () => {
            try {
                const result = await action()
                if (result && result.error) {
                    setError(result.error)
                }
            } catch (e: any) {
                setError(e.message || 'An unexpected error occurred')
            }
        })
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-6">
                {/* Clock In/Out Section */}
                <div className="w-full">
                    {!isClockedIn && !isClockedOut && (
                        <button
                            onClick={() => handleAction(clockIn)}
                            disabled={isPending}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? '処理中...' : '出勤'}
                        </button>
                    )}

                    {isClockedIn && !isClockedOut && !isOnBreak && (
                        <button
                            onClick={() => handleAction(() => clockOut(attendance.id))}
                            disabled={isPending}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? '処理中...' : '退勤'}
                        </button>
                    )}

                    {(isClockedOut || isOnBreak) && (
                        <div className="w-full bg-slate-700 text-gray-400 font-bold py-4 px-6 rounded-lg text-center cursor-not-allowed">
                            {isClockedOut ? '退勤済み' : '休憩中'}
                        </div>
                    )}
                </div>

                {/* Break Controls Section (Moved inside here or kept separate? User had them separate in page.tsx) */}
                {/* To keep layout consistent with page.tsx, maybe we should export separate components or just one big one? 
                     The original layout had two panels. Status and Controls. 
                     Refactoring strictly the buttons might be cleaner.
                     Let's make this component handle just the main Clock In/Out button? 
                     No, state is shared. Let's make two components or one that renders everything?
                     The original `page.tsx` split them into two divs.
                     I will create `MainAttendanceButton` and `BreakControlButtons`? 
                     Or just pass `children`?
                     Let's mimic the UI structure in `page.tsx` but using this client component.
                  */}
            </div>
        </div>
    )
}

// Breaking it down for flexibility
export function MainActionButtons({ attendance, isClockedIn, isClockedOut, isOnBreak }: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [isTelework, setIsTelework] = useState(false)

    const handleClockIn = () => {
        setError(null)
        startTransition(async () => {
            const res = await clockIn(isTelework)
            if (res?.error) setError(res.error)
        })
    }

    const handleClockOut = () => {
        setError(null)
        startTransition(async () => {
            const res = await clockOut(attendance.id)
            if (res?.error) setError(res.error)
        })
    }

    return (
        <div className="w-full flex flex-col gap-4">
            {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

            {!isClockedIn && !isClockedOut && (
                <div className="flex items-center justify-center gap-2 mb-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <input
                        type="checkbox"
                        id="telework-toggle"
                        checked={isTelework}
                        onChange={(e) => setIsTelework(e.target.checked)}
                        disabled={isPending}
                        className="w-5 h-5 text-blue-600 rounded bg-gray-700 border-gray-600 focus:ring-blue-500 ring-offset-gray-800"
                    />
                    <label htmlFor="telework-toggle" className="text-white font-medium cursor-pointer select-none">
                        テレワーク勤務
                    </label>
                </div>
            )}

            {!isClockedIn && !isClockedOut && (
                <button onClick={handleClockIn} disabled={isPending} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50">
                    {isPending ? '処理中...' : '出勤'}
                </button>
            )}

            {isClockedIn && !isClockedOut && !isOnBreak && (
                <button onClick={handleClockOut} disabled={isPending} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] disabled:opacity-50">
                    {isPending ? '処理中...' : '退勤'}
                </button>
            )}

            {(isClockedOut || isOnBreak) && (
                <button disabled className="w-full bg-slate-700 text-gray-400 font-bold py-4 px-6 rounded-lg cursor-not-allowed">
                    {isClockedOut ? '退勤済み' : '休憩中'}
                </button>
            )}
        </div>
    )
}

export function BreakActionButtons({ attendance, isClockedIn, isClockedOut, isOnBreak, activeBreakId }: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleStartBreak = () => {
        setError(null)
        startTransition(async () => {
            const res = await startBreak(attendance.id)
            if (res?.error) setError(res.error)
        })
    }

    const handleEndBreak = () => {
        if (!activeBreakId) return
        setError(null)
        startTransition(async () => {
            const res = await endBreak(activeBreakId)
            if (res?.error) setError(res.error)
        })
    }

    return (
        <div className="w-full flex flex-col gap-2">
            {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

            <div className="flex gap-2 w-full">
                {isClockedIn && !isClockedOut && !isOnBreak ? (
                    <button onClick={handleStartBreak} disabled={isPending} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50">
                        休憩開始
                    </button>
                ) : (
                    <button disabled className="flex-1 bg-slate-800 text-slate-500 font-bold py-3 px-4 rounded-lg transition-all cursor-not-allowed">
                        休憩開始
                    </button>
                )}

                {isOnBreak ? (
                    <button onClick={handleEndBreak} disabled={isPending} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50">
                        休憩終了
                    </button>
                ) : (
                    <button disabled className="flex-1 bg-slate-800 text-slate-500 font-bold py-3 px-4 rounded-lg transition-all cursor-not-allowed">
                        休憩終了
                    </button>
                )}
            </div>
        </div>
    )
}
