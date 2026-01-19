'use server'

import { createClient } from '@/utils/supabase/server'

export type EmployeeTransportStats = {
    id: string
    full_name: string | null
    role: 'admin' | 'employee'
    department_id: string | null
    departments: { name: string } | null
    totalTransport: number
}

export async function getMonthlyTransportStats(): Promise<EmployeeTransportStats[]> {
    const supabase = await createClient()

    // Get all employees
    const { data: employees } = await supabase
        .from('profiles')
        .select('id, full_name, role, department_id, departments(name)')
        .neq('role', 'admin')

    if (!employees) return []

    // Get current month range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    // Get stats for each employee
    const stats = await Promise.all(employees.map(async (emp: any) => {
        console.log(`Fetching transport for emp: ${emp.id}`)

        const { data: transports, error } = await supabase
            .from('transportation_records')
            .select(`
                amount,
                attendance_records!inner (
                    user_id,
                    date
                )
            `)
            .eq('attendance_records.user_id', emp.id)
            .gte('attendance_records.date', startOfMonth)
            .lte('attendance_records.date', endOfMonth)

        if (error) {
            console.error('Error fetching transport stats:', error)
        } else {
            console.log(`Found ${transports?.length} records for ${emp.id}`)
        }

        const totalAmount = transports?.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0) || 0

        return {
            id: emp.id,
            full_name: emp.full_name,
            role: emp.role as 'admin' | 'employee',
            department_id: emp.department_id,
            departments: emp.departments as { name: string } | null,
            totalTransport: totalAmount
        }
    }))

    return stats
}

export async function getEmployeeTransportDetails(userId: string, monthStr?: string) {
    const supabase = await createClient()

    const targetDate = monthStr ? new Date(monthStr) : new Date()
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0]

    console.log(`Fetching details for user: ${userId}, range: ${startOfMonth} to ${endOfMonth}`)

    const { data: records, error } = await supabase
        .from('transportation_records')
        .select(`
            *,
            attendance_records!inner (
                date
            )
        `)
        .eq('attendance_records.user_id', userId)
        .gte('attendance_records.date', startOfMonth)
        .lte('attendance_records.date', endOfMonth)
        .order('attendance_records(date)', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching details:', error)
    } else {
        console.log(`Found ${records?.length} detail records`)
    }

    // Also get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    return { records: records || [], profile }
}
