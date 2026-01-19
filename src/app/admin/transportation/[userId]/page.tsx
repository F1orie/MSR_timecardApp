import { getEmployeeTransportDetails } from '@/features/admin/transportation-actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Correct usage for Next.js 15+ (App Router): params is a Promise
type Props = {
    params: Promise<{ userId: string }>
}

type RecordType = {
    id: string
    amount: number
    origin: string
    destination: string
    transport_method: string
    route_type: string
    attendance_records: {
        date: string
    }
}

export default async function TransportationDetailPage({ params }: Props) {
    const { userId } = await params
    const { records, profile } = await getEmployeeTransportDetails(userId)

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-4">
                <Link href="/admin/transportation" className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        {profile?.full_name || '従業員'} の交通費詳細
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {new Date().getFullYear()}年{new Date().getMonth() + 1}月
                    </p>
                </div>
            </header>

            <div className="glass-panel p-6">
                <table className="w-full text-left text-sm">
                    <thead className="text-gray-400 border-b border-gray-700">
                        <tr>
                            <th className="pb-3 pl-4">日付</th>
                            <th className="pb-3">利用区間</th>
                            <th className="pb-3">交通手段</th>
                            <th className="pb-3">区分</th>
                            <th className="pb-3 text-right pr-4">金額</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                        {records.map((rec: RecordType) => (
                            <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 pl-4 text-gray-400">
                                    {new Date(rec.attendance_records.date).toLocaleDateString()}
                                </td>
                                <td className="py-3">
                                    {rec.origin} ～ {rec.destination}
                                </td>
                                <td className="py-3">
                                    {rec.transport_method}
                                </td>
                                <td className="py-3">
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs">
                                        {rec.route_type}
                                    </span>
                                </td>
                                <td className="py-3 text-right pr-4 font-mono text-emerald-400">
                                    ¥{rec.amount.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="border-t border-gray-700">
                        <tr>
                            <td colSpan={4} className="py-4 pl-4 font-bold text-gray-400 text-right">合計</td>
                            <td className="py-4 pr-4 font-bold text-xl text-emerald-400 text-right">
                                ¥{records.reduce((sum: number, r: any) => sum + r.amount, 0).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                {records.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        この月の交通費記録はありません
                    </div>
                )}
            </div>
        </div>
    )
}
