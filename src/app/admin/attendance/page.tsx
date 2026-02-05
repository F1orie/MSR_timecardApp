import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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

    let currentMonth = typeof resolvedParams.month === 'string' ? resolvedParams.month : undefined

    if (!currentMonth) {
        const now = new Date()
        // Determine fiscal month based on 11th cutoff
        // If today is < 11th, it's previous month's cycle (e.g., Jan 5 is Dec cycle)
        const y = now.getDate() < 11 ? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()) : now.getFullYear()
        const m = now.getDate() < 11 ? (now.getMonth() === 0 ? 11 : now.getMonth() - 1) : now.getMonth()
        // m is 0-indexed in Date, so +1 for string
        currentMonth = `${y}-${String(m + 1).padStart(2, '0')}`
    }

    // Calculate date range for the query (11th to 10th of next month)
    const [yStr, mStr] = currentMonth.split('-')
    const year = parseInt(yStr, 10)
    const month = parseInt(mStr, 10)

    // startDate: 11th of the currentMonth
    const startDate = new Date(year, month - 1, 11).toISOString()
    // endDate: 10th of the next month
    const endDate = new Date(year, month, 10, 23, 59, 59).toISOString()

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
