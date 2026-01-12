import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceFilter from './attendance-filter'

export default async function AdminAttendancePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const resolvedSearchParams = await searchParams
    const departmentFilter = resolvedSearchParams.department as string | undefined

    // Fetch departments for filter dropdown
    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .order('name')

    // Build Query
    let query = supabase
        .from('attendance_records')
        .select(`
            *,
            profiles!inner (
                full_name,
                username,
                department_id,
                departments (
                    name,
                    code
                )
            )
        `)
        .order('date', { ascending: false })

    if (departmentFilter) {
        query = query.eq('profiles.department_id', departmentFilter)
    }

    const { data: attendanceData } = await query

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">勤怠履歴</h1>
            </div>

            {/* Filter Section */}
            <AttendanceFilter departments={departments || []} />

            <div className="glass-panel p-6 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400">
                                <th className="p-4">日付</th>
                                <th className="p-4">従業員</th>
                                <th className="p-4">部署</th>
                                <th className="p-4">出勤</th>
                                <th className="p-4">退勤</th>
                                <th className="p-4">交通費</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(attendanceData || []).map((record: any) => (
                                <tr key={record.id} className="text-gray-300 hover:bg-white/5">
                                    <td className="p-4">{new Date(record.date).toLocaleDateString()}</td>
                                    <td className="p-4 text-white">
                                        <div className="font-medium">{record.profiles?.full_name}</div>
                                        <div className="text-xs text-gray-500">{record.profiles?.username}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {record.profiles?.departments?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {record.clock_in ? new Date(record.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td className="p-4">
                                        {record.clock_out ? new Date(record.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm">{record.transport_route || '-'}</div>
                                        {record.transport_cost ? <div className="text-xs text-emerald-400">¥{record.transport_cost}</div> : null}
                                    </td>
                                </tr>
                            ))}
                            {(!attendanceData || attendanceData.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        勤怠データがありません。
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
