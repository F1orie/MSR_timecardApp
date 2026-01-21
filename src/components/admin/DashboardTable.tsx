'use client'

import { Download } from 'lucide-react'
import { AttendanceRecord, calculateDailyStats } from '@/utils/calculations'

interface Profile {
    id: string
    full_name: string | null
    role: string
    hourly_wage: number | null
    username: string | null
}

interface AttendanceStats {
    totalHours: number
    totalTransport: number
    estimatedWage: number
}

interface Props {
    employees: Profile[]
    attendanceStats: Record<string, AttendanceStats>
    attendanceRecords: AttendanceRecord[]
    currentMonth: string
}

export function DashboardTable({ employees, attendanceRecords, currentMonth }: Props) {
    // Filter out admins from the display list as per request
    const displayEmployees = employees.filter(e => e.role !== 'admin')

    const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return `${h}:${String(m).padStart(2, '0')}`
    }

    const handleExport = () => {
        const [year, month] = currentMonth.split('-')
        window.location.href = `/api/export-monthly-report?year=${year}&month=${month}`
    }

    const roleMap: Record<string, string> = {
        'admin': '管理者',
        'member': '社員',
        'arbeit': 'アルバイト',
        'intern': 'インターン'
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <h2 className="text-xl font-bold text-white">月次詳細レポート ({currentMonth})</h2>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition shadow-lg shadow-emerald-900/20 font-medium"
                >
                    <Download className="w-5 h-5" />
                    エクセル出力
                </button>
            </div>

            <div className="glass-panel p-6 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="text-gray-400 border-b border-gray-700">
                            <tr>
                                <th className="p-3 min-w-[100px]">ID</th>
                                <th className="p-3 min-w-[150px] sticky left-0 bg-slate-900">氏名</th>
                                <th className="p-3 min-w-[100px]">役職</th>
                                <th className="p-3">出勤日数</th>
                                <th className="p-3">平日出勤日数</th>
                                <th className="p-3">所定休日労働日数</th>
                                <th className="p-3">法定休日労働日数</th>
                                <th className="p-3">実労働時間</th>
                                <th className="p-3">平日労働時間</th>
                                <th className="p-3">所定休日労働時間</th>
                                <th className="p-3">法定休日労働時間</th>
                                <th className="p-3">深夜労働時間</th>
                                <th className="p-3">テレワーク回数</th>
                                {/* Optional: placeholders for 0 items if space permits, or omit for cleaner view unless strictly required to show ALL columns in UI */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-gray-300">
                            {displayEmployees.map((emp) => {
                                const userRecords = attendanceRecords.filter(r => r.user_id === emp.id)

                                const stats = {
                                    workDays: 0,
                                    weekdayDays: 0,
                                    satDays: 0,
                                    sunDays: 0,
                                    workMinutes: 0,
                                    weekdayMinutes: 0,
                                    satMinutes: 0,
                                    sunMinutes: 0,
                                    lateNightMinutes: 0,
                                    teleworkCount: 0
                                }

                                userRecords.forEach(rec => {
                                    const daily = calculateDailyStats(rec)
                                    if (daily.workMinutes > 0) {
                                        stats.workDays++
                                        if (daily.saturdayMinutes > 0) stats.satDays++
                                        else if (daily.sundayMinutes > 0) stats.sunDays++
                                        else stats.weekdayDays++
                                    }

                                    stats.workMinutes += daily.workMinutes
                                    stats.weekdayMinutes += daily.weekdayMinutes
                                    stats.satMinutes += daily.saturdayMinutes
                                    stats.sunMinutes += daily.sundayMinutes
                                    stats.lateNightMinutes += daily.lateNightMinutes

                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    if ((rec as any).is_telework) stats.teleworkCount++
                                })

                                return (
                                    <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-mono text-gray-400">{emp.username}</td>
                                        <td className="p-3 font-medium text-white sticky left-0 bg-slate-900 shadow-xl">{emp.full_name || '名称未設定'}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${emp.role === 'admin'
                                                ? 'bg-purple-500/20 text-purple-300'
                                                : emp.role === 'member'
                                                    ? 'bg-cyan-500/20 text-cyan-300'
                                                    : emp.role === 'arbeit'
                                                        ? 'bg-green-500/20 text-green-300'
                                                        : 'bg-orange-500/20 text-orange-300'
                                                }`}>
                                                {roleMap[emp.role] || emp.role}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">{stats.workDays}</td>
                                        <td className="p-3 text-right">{stats.weekdayDays}</td>
                                        <td className="p-3 text-right">{stats.satDays}</td>
                                        <td className="p-3 text-right">{stats.sunDays}</td>
                                        <td className="p-3 text-right font-mono font-bold text-white">{formatTime(stats.workMinutes)}</td>
                                        <td className="p-3 text-right font-mono">{formatTime(stats.weekdayMinutes)}</td>
                                        <td className="p-3 text-right font-mono">{formatTime(stats.satMinutes)}</td>
                                        <td className="p-3 text-right font-mono">{formatTime(stats.sunMinutes)}</td>
                                        <td className="p-3 text-right font-mono">{formatTime(stats.lateNightMinutes)}</td>
                                        <td className="p-3 text-right">{stats.teleworkCount}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {displayEmployees.length === 0 && (
                        <div className="text-center py-8 text-gray-500">従業員が見つかりません。</div>
                    )}
                </div>
            </div>
        </>
    )
}
