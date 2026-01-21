import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AttendanceRecord, calculateLateNightWorkMinutes, isHoliday, formatDuration } from "@/utils/calculations"

interface Props {
    isOpen: boolean
    onClose: () => void
    user: { id: string, full_name: string | null, username: string | null, role: string }
    month: string // YYYY-MM
    records: AttendanceRecord[]
}

export function UserMonthlyReportModal({ isOpen, onClose, user, month, records }: Props) {
    // 1. Filter records for this user (already done by parent usually, but good to be safe)
    const userRecords = records.filter(r => r.user_id === user.id)

    // 2. Calculations
    const totalDays = userRecords.length

    const saturdayWork = userRecords.filter(r => isHoliday(r.date || '') === 'Saturday').length
    const sundayWork = userRecords.filter(r => isHoliday(r.date || '') === 'Sunday').length

    // Late Night: Sum of minutes
    const lateNightMinutes = userRecords.reduce((sum, r) => sum + calculateLateNightWorkMinutes(r), 0)

    // Telework: Count where is_telework is true
    // Note: is_telework might be null, so check for true
    const teleworkCount = userRecords.filter(r => (r as any).is_telework === true).length

    // Role display
    const roleMap: Record<string, string> = {
        'admin': '管理者',
        'member': '社員',
        'arbeit': 'アルバイト',
        'intern': 'インターン'
    }
    const roleDisplay = roleMap[user.role] || user.role

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{month} 出勤詳細レポート</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800 rounded-lg">
                        <div>
                            <div className="text-sm text-gray-400">氏名</div>
                            <div className="font-bold text-lg">{user.full_name}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">ユーザID</div>
                            <div className="font-mono">{user.username}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">役職 (打刻グループ)</div>
                            <div>{roleDisplay}</div>
                        </div>
                    </div>

                    {/* Stats Table */}
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <tbody className="divide-y divide-slate-700">
                                <tr className="bg-slate-800/50">
                                    <th className="p-3 font-medium text-gray-400">項目</th>
                                    <th className="p-3 font-medium text-gray-400 text-right">値</th>
                                </tr>
                                <tr>
                                    <td className="p-3">実働日数</td>
                                    <td className="p-3 text-right font-mono">{totalDays} 日</td>
                                </tr>
                                <tr>
                                    <td className="p-3">土曜日出勤 (所定休日)</td>
                                    <td className="p-3 text-right font-mono">{saturdayWork} 日</td>
                                </tr>
                                <tr>
                                    <td className="p-3">日曜日出勤 (法定休日)</td>
                                    <td className="p-3 text-right font-mono">{sundayWork} 日</td>
                                </tr>
                                <tr>
                                    <td className="p-3">深夜労働時間 (22:00-07:00)</td>
                                    <td className="p-3 text-right font-mono">{formatDuration(lateNightMinutes)}</td>
                                </tr>
                                <tr>
                                    <td className="p-3">テレワーク回数</td>
                                    <td className="p-3 text-right font-mono">{teleworkCount} 回</td>
                                </tr>
                                <tr>
                                    <td className="p-3 text-gray-500">残業・代休</td>
                                    <td className="p-3 text-right font-mono text-gray-500">0 (固定)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                        {/* Future: Excel Download here */}
                        <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition">
                            閉じる
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
