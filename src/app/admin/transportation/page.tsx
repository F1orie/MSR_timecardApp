import { getMonthlyTransportStats } from '@/features/admin/transportation-actions'
import Link from 'next/link'

export default async function AdminTransportationPage() {
    const employees = await getMonthlyTransportStats()

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">交通費管理</h1>
                <p className="text-gray-400">所属内従業員の月次交通費</p>
            </header>

            <div className="glass-panel p-6 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="text-gray-400 border-b border-gray-700">
                        <tr>
                            <th className="pb-3 pl-4">氏名</th>
                            <th className="pb-3">所属</th>
                            <th className="pb-3">役職</th>
                            <th className="pb-3 text-right pr-4">今月の交通費 (合計)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                        {employees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                                <td className="py-4 pl-4">
                                    <Link href={`/admin/transportation/${emp.id}`} className="font-medium text-white group-hover:text-emerald-400 transition-colors block">
                                        {emp.full_name || '名称未設定'}
                                    </Link>
                                </td>
                                <td className="py-4 text-sm text-gray-400">{emp.departments?.name}</td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-xs ${emp.role === 'admin'
                                        ? 'bg-purple-500/20 text-purple-300'
                                        : emp.role === 'member'
                                            ? 'bg-cyan-500/20 text-cyan-300'
                                            : emp.role === 'arbeit'
                                                ? 'bg-green-500/20 text-green-300'
                                                : emp.role === 'intern'
                                                    ? 'bg-orange-500/20 text-orange-300'
                                                    : 'bg-slate-500/20 text-slate-300'
                                        }`}>
                                        {emp.role === 'admin' && '管理者'}
                                        {emp.role === 'member' && 'メンバー'}
                                        {emp.role === 'arbeit' && 'アルバイト'}
                                        {emp.role === 'intern' && 'インターン'}
                                        {!['admin', 'member', 'arbeit', 'intern'].includes(emp.role) && emp.role}
                                    </span>
                                </td>
                                <td className="py-4 text-right pr-4 font-bold text-emerald-400">
                                    ¥{emp.totalTransport.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {employees.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        従業員が見つかりません
                    </div>
                )}
            </div>
        </div>
    )
}
