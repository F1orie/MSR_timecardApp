'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row'] & {
    break_records: Database['public']['Tables']['break_records']['Row'][]
}

export async function getAdminData() {
    const supabase = await createClient()

    // Check auth and role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/')
    }

    // Fetch all employees
    const { data: employees } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (!employees) return { employees: [], attendanceStats: {} }

    // Fetch this month's attendance for all users
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: rawAttendanceRecords } = await supabase
        .from('attendance_records')
        .select(`
            *,
            break_records (*)
        `)
        .gte('date', startOfMonth.toISOString())

    // Cast the Result to include the joined breakdown_records properly because Supabase types can be tricky with joins
    const attendanceRecords = rawAttendanceRecords as unknown as AttendanceRecord[]

    // Calculate stats per employee
    const attendanceStats: Record<string, { totalHours: number, totalTransport: number, estimatedWage: number }> = {}

    employees.forEach((emp: Profile) => {
        const empRecords = attendanceRecords?.filter(r => r.user_id === emp.id) || []

        let totalMinutes = 0
        let totalTransport = 0

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
            totalTransport += record.transport_cost || 0
        })

        const hourlyWage = emp.hourly_wage || 1000
        // totalHours is used in the returned object, so keep it.
        const totalHours = parseFloat((totalMinutes / 60).toFixed(1))

        const estimatedWage = Math.floor((totalMinutes / 60) * hourlyWage)

        attendanceStats[emp.id] = {
            totalHours,
            totalTransport,
            estimatedWage
        }
    })

    return { employees: employees as Profile[], attendanceStats }
}
