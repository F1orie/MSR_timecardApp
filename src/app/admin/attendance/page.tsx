import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import AttendanceDashboard from '@/components/admin/AttendanceDashboard'

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

    const resolvedParams = await searchParams
    const currentMonth = typeof resolvedParams.month === 'string' ? resolvedParams.month : format(new Date(), 'yyyy-MM')

    // Calculate date range for the query
    const startDate = startOfMonth(new Date(currentMonth + '-01')).toISOString()
    const endDate = endOfMonth(new Date(currentMonth + '-01')).toISOString()

    // Build Query
    const query = supabase
        .from('attendance_records')
        .select(`
            *,
            profiles!inner (
                full_name,
                username,
                role,
                department_id,
                hourly_wage,
                departments (
                    name,
                    code
                )
            ),
            break_records (
                start_time,
                end_time
            )
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

    const { data: attendanceData } = await query

    // Fetch Active Employees for the create modal
    const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name')
        .neq('role', 'admin') // Only active employees usually
        .order('full_name')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">勤怠履歴</h1>
            </div>

            <AttendanceDashboard
                initialRecords={attendanceData || []}
                currentMonth={currentMonth}
                users={users || []}
            />
        </div>
    )
}
