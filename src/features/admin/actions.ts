'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'] & {
    break_records: Database['public']['Tables']['break_records']['Row'][]
}

export async function getAdminData(year?: number, month?: number) {
    const supabase = await createClient()

    // Check auth and role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((profile as any)?.role !== 'admin') {
        redirect('/')
    }

    // Fetch all employees
    const { data: employees } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (!employees) return { employees: [], attendanceStats: {} }

    // Date range calculation
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month || (now.getMonth() + 1) // 1-indexed

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1) // 0-indexed month for Date constructor
    // End of month: First day of next month
    const endOfMonth = new Date(targetYear, targetMonth, 1)

    // Convert to ISO string for DB comparison (start is inclusive, end is exclusive)
    // Note: To match "entire day" correctly in TZ, usually best to use simply day ranges,
    // but here we just iterate 00:00:00 to next month 00:00:00
    // timezone offset might be an issue, but let's assume server time / UTC consistent for now or simple dates.
    // Ideally we store dates as 'YYYY-MM-DD' which filters easily.

    // Using formatted strings for 'date' column comparison if it's type date
    const startStr = startOfMonth.toISOString().split('T')[0]

    // For end date comparison, since 'date' column is just DATE type, 
    // we want < first day of next month.
    const endStr = endOfMonth.toISOString().split('T')[0]

    const { data: rawAttendanceRecords } = await supabase
        .from('attendance_records')
        .select(`
            *,
            break_records (*)
        `)
        .gte('date', startStr)
        .lt('date', endStr)

    // Cast the Result
    const attendanceRecords = rawAttendanceRecords as unknown as AttendanceRecord[]

    // Fetch this month's transportation records
    // Assuming transportation is linked to attendance_record which has a date
    const { data: rawTransportRecords } = await supabase
        .from('transportation_records')
        .select(`
            amount,
            attendance_records!inner (
                user_id,
                date
            )
        `)
        .gte('attendance_records.date', startStr)
        .lt('attendance_records.date', endStr)


    // Calculate stats per employee
    const attendanceStats: Record<string, { totalHours: number, totalTransport: number, estimatedWage: number }> = {}

    employees.forEach((emp: Profile) => {
        const empRecords = attendanceRecords?.filter(r => r.user_id === emp.id) || []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const empTransportRecords = rawTransportRecords?.filter((tr: any) => tr.attendance_records.user_id === emp.id) || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newTransportTotal = empTransportRecords.reduce((sum: number, tr: any) => sum + tr.amount, 0)

        let totalMinutes = 0
        let legacyTransport = 0

        empRecords.forEach(record => {
            if (record.clock_in && record.clock_out) {
                const start = new Date(record.clock_in).getTime()
                const end = new Date(record.clock_out).getTime()
                let duration = (end - start) / 1000 / 60 // minutes

                // Subtract breaks
                record.break_records.forEach((br) => {
                    if (br.start_time && br.end_time) {
                        const bStart = new Date(br.start_time).getTime()
                        const bEnd = new Date(br.end_time).getTime()
                        duration -= (bEnd - bStart) / 1000 / 60
                    }
                })

                if (duration > 0) totalMinutes += duration
            }
            legacyTransport += record.transport_cost || 0
        })

        const totalTransport = legacyTransport + newTransportTotal

        const hourlyWage = emp.hourly_wage || 1000
        const totalHours = parseFloat((totalMinutes / 60).toFixed(1))

        const estimatedWage = Math.floor((totalMinutes / 60) * hourlyWage)

        attendanceStats[emp.id] = {
            totalHours,
            totalTransport,
            estimatedWage
        }
    })

    return { employees: employees as Profile[], attendanceStats, attendanceRecords }
}
