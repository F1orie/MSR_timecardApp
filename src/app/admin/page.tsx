import { getAdminData } from '@/features/admin/actions'

export default async function AdminDashboard() {
    const { employees, attendanceStats } = await getAdminData()

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">ダッシュボード</h1>
                <p className="text-gray-400">月次概要と従業員管理</p>
            </header>

            <div className="glass-panel p-6 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="text-gray-400 border-b border-gray-700">
                        <tr>
                            <th className="pb-3 pl-4">氏名</th>
                            <th className="pb-3">役職</th>
                            <th className="pb-3">時給</th>
                            <th className="pb-3">稼働時間 (月)</th>
                            <th className="pb-3">交通費</th>
                            <th className="pb-3">推定給与</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                        {employees.map((emp) => {
                            const stats = attendanceStats[emp.id] || { totalHours: 0, totalTransport: 0, estimatedWage: 0 }
                            return (
                                <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4 pl-4 font-medium text-white">{emp.full_name || '名称未設定'}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded text-xs ${emp.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td className="py-4">¥{emp.hourly_wage?.toLocaleString()}</td>
                                    <td className="py-4">{stats.totalHours} h</td>
                                    <td className="py-4">¥{stats.totalTransport.toLocaleString()}</td>
                                    <td className="py-4 font-bold text-emerald-400">¥{stats.estimatedWage.toLocaleString()}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {employees.length === 0 && (
                    <div className="text-center py-8 text-gray-500">従業員が見つかりません。</div>
                )}
            </div>
        </div>
    )
}
