'use client'

import { useState, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format, parseISO, isSameDay, addMonths, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css' // Ensure styles are imported
import { calculateWorkDurationMinutes, calculateWage, formatDuration } from '@/utils/calculations'
import { EditAttendanceModal } from './EditAttendanceModal'
import { CreateAttendanceModal } from './CreateAttendanceModal'
import { UserMonthlyReportModal } from './UserMonthlyReportModal'
import { FileText } from 'lucide-react'

interface Profile {
    full_name: string
    username: string
    department_id: string
    departments: {
        name: string
    } | null
    hourly_wage: number
    role: string
}

interface BreakRecord {
    start_time: string
    end_time: string | null
}

interface AttendanceRecord {
    id: string
    user_id: string
    date: string
    clock_in: string | null
    clock_out: string | null
    transport_cost: number
    transport_route: string | null
    profiles: Profile
    break_records: BreakRecord[]
}

interface AttendanceDashboardProps {
    initialRecords: AttendanceRecord[]
    currentMonth: string // YYYY-MM
    users: { id: string, full_name: string | null }[]
}

export default function AttendanceDashboard({ initialRecords, currentMonth, users }: AttendanceDashboardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
    const [selectedReportUser, setSelectedReportUser] = useState<any | null>(null)

    // Current month date object
    const monthDate = useMemo(() => new Date(currentMonth + '-01'), [currentMonth])

    // Filter records by month (client-side safety, though server filters too)
    // and by selectedDate if set
    const filteredRecords = useMemo(() => {
        let records = initialRecords
        if (selectedDate) {
            records = records.filter(r => isSameDay(parseISO(r.date), selectedDate))
        }
        return records
    }, [initialRecords, selectedDate])



    // Handlers
    const handleMonthChange = (offset: number) => {
        const newDate = offset > 0 ? addMonths(monthDate, 1) : subMonths(monthDate, 1)
        const newMonthStr = format(newDate, 'yyyy-MM')

        const params = new URLSearchParams(searchParams.toString())
        params.set('month', newMonthStr)
        router.push(pathname + '?' + params.toString())
        setSelectedDate(undefined) // Reset selection on month change
    }

    const resetFilter = () => setSelectedDate(undefined)

    const handleEdit = (record: AttendanceRecord) => {
        setSelectedRecord(record)
        setIsEditModalOpen(true)
    }

    // Calendar Modifiers
    const modifiers = {
        hasData: (date: Date) => initialRecords.some(r => isSameDay(parseISO(r.date), date))
    }
    const modifiersStyles = {
        hasData: { fontWeight: 'bold', color: 'var(--primary)' }
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                    <span>＋</span> 新規追加
                </button>

                {/* Month Selector */}
                <div className="flex items-center gap-4">
                    <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <h2 className="text-xl font-bold font-mono tracking-wider text-white">
                        {format(monthDate, 'yyyy年 MM月', { locale: ja })}
                    </h2>
                    <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* View Toggles */}
                <div className="flex bg-black/20 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <ListIcon className="w-4 h-4" />
                        <span>リスト</span>
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        <span>カレンダー</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}


            {/* Main Content */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* CALENDAR SIDEBAR (visible in Calendar mode, or split view?) 
                    User asked to "see attendance for that day". 
                    In Calendar mode, we show Calendar + List of selected day.
                    In List mode, we show just the full list.
                */}

                {viewMode === 'calendar' && (
                    <div className="w-full lg:w-auto shrink-0 flex justify-center lg:justify-start">
                        <div className="glass-panel p-4 inline-block">
                            <DayPicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                month={monthDate}
                                onMonthChange={(m) => {
                                    // Sync DayPicker navigation with our monthly filter
                                    // But since we control month via URL, we might want to disable built-in nav or sync it.
                                    // For now, let's just keep it simple. If they navigate away in calendar, it doesn't fetch new data unless we hook it up.
                                    // Better to force month to match URL.
                                }}
                                disableNavigation // Disable built-in nav to enforce URL control
                                showOutsideDays={false}
                                modifiers={modifiers}
                                modifiersStyles={modifiersStyles}
                                styles={{
                                    head_cell: { width: '40px', color: '#9ca3af' },
                                    cell: { width: '40px' },
                                    day: { width: '40px', height: '40px', margin: 'auto' },
                                    caption: { display: 'none' } // We have our own header
                                }}
                                className="rdp-custom"
                            />
                        </div>
                    </div>
                )}

                {/* RECORD LIST */}
                <div className="flex-1 glass-panel p-6 overflow-hidden min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">
                            {selectedDate ? format(selectedDate, 'yyyy年MM月dd日', { locale: ja }) + 'の勤怠' : '勤怠履歴一覧'}
                        </h3>
                        {selectedDate && (
                            <button onClick={resetFilter} className="text-xs text-blue-400 hover:text-blue-300">
                                絞り込み解除
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400">
                                    <th className="p-4 whitespace-nowrap">日付</th>
                                    <th className="p-4 whitespace-nowrap">メンバー</th>
                                    <th className="p-4 whitespace-nowrap">実働時間</th>
                                    <th className="p-4 whitespace-nowrap">出勤</th>
                                    <th className="p-4 whitespace-nowrap">退勤</th>
                                    <th className="p-4 whitespace-nowrap text-right">参考給与</th>
                                    <th className="p-4 whitespace-nowrap text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredRecords.length > 0 ? (
                                    filteredRecords.map((record) => {
                                        const workMinutes = calculateWorkDurationMinutes(record)
                                        const wage = calculateWage(workMinutes, record.profiles?.hourly_wage || 1000)
                                        return (
                                            <tr key={record.id} className="text-gray-300 hover:bg-white/5 transition-colors">
                                                <td className="p-4 whitespace-nowrap">{format(parseISO(record.date), 'MM/dd')}</td>
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{record.profiles?.full_name}</div>
                                                    <div className="text-xs text-gray-500">{record.profiles?.departments?.name}</div>
                                                </td>
                                                <td className="p-4 font-mono text-white font-bold">
                                                    {formatDuration(workMinutes)}
                                                </td>
                                                <td className="p-4 text-sm">
                                                    {record.clock_in ? format(parseISO(record.clock_in), 'HH:mm') : '-'}
                                                </td>
                                                <td className="p-4 text-sm">
                                                    {record.clock_out ? format(parseISO(record.clock_out), 'HH:mm') : '-'}
                                                </td>
                                                <td className="p-4 text-right font-mono text-white">
                                                    ¥{wage.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedReportUser({ ...record.profiles, id: record.user_id })}
                                                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-emerald-400 transition"
                                                            title="詳細レポート"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(record)}
                                                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-blue-400 transition"
                                                            title="編集"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-500">
                                            該当するデータがありません。
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedRecord && (
                <EditAttendanceModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false)
                        setSelectedRecord(null)
                    }}
                    record={selectedRecord}
                />
            )}

            {selectedReportUser && (
                <UserMonthlyReportModal
                    isOpen={!!selectedReportUser}
                    onClose={() => setSelectedReportUser(null)}
                    user={{
                        id: selectedReportUser.id,
                        full_name: selectedReportUser.full_name,
                        username: selectedReportUser.username,
                        role: selectedReportUser.role
                    }}
                    month={currentMonth}
                    records={initialRecords}
                />
            )}

            <CreateAttendanceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                users={users}
            />
        </div>
    )
}
