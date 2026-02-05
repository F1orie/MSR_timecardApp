'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type EmployeeTransportStats = {
    id: string
    full_name: string | null
    role: 'admin' | 'member' | 'arbeit' | 'intern'
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

    // Get current month range (Fiscal month based on 11th-10th cycle)
    const now = new Date()
    // If today is before 11th, we are in the previous fiscal cycle (e.g., Jan 5 is in Dec 11 - Jan 10)
    // If today is 11th or after, we are in the current fiscal cycle (e.g., Jan 15 is in Jan 11 - Feb 10)
    const currentFiscalYear = now.getDate() < 11 ? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()) : now.getFullYear()
    const currentFiscalMonth = now.getDate() < 11 ? (now.getMonth() === 0 ? 11 : now.getMonth() - 1) : now.getMonth()

    const startPeriod = new Date(currentFiscalYear, currentFiscalMonth, 11)
    const endPeriod = new Date(currentFiscalYear, currentFiscalMonth + 1, 10, 23, 59, 59)

    const startIso = startPeriod.toISOString()
    const endIso = endPeriod.toISOString()

    // Get stats for each employee
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = await Promise.all(employees.map(async (emp: any) => {
        const { data: transports } = await supabase
            .from('transportation_records')
            .select(`
                amount,
                attendance_records!inner (
                    user_id,
                    date
                )
            `)
            .eq('attendance_records.user_id', emp.id)
            .gte('attendance_records.date', startIso)
            .lte('attendance_records.date', endIso)

        const totalAmount = transports?.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0) || 0

        return {
            id: emp.id,
            full_name: emp.full_name,
            role: emp.role as 'admin' | 'member' | 'arbeit' | 'intern',
            department_id: emp.department_id,
            departments: emp.departments as { name: string } | null,
            totalTransport: totalAmount
        }
    }))

    return stats
}

export async function getEmployeeTransportDetails(userId: string, monthStr?: string) {
    const supabase = await createClient()

    let startPeriod: Date
    let endPeriod: Date

    if (monthStr) {
        // monthStr is typically YYYY-MM
        // Aligning with the requirement: "1月11日～2月10日"
        const [y, m] = monthStr.split('-').map(Number)
        // Note: m is 1-indexed here from the split string '2024-01' -> 1
        // new Date constructor takes 0-indexed month for the second argument.
        // So (y, m-1, 11) is 11th of that month.
        startPeriod = new Date(y, m - 1, 11)
        endPeriod = new Date(y, m, 10) // m is (m-1) + 1, so next month
    } else {
        const now = new Date()
        const currentFiscalYear = now.getDate() < 11 ? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()) : now.getFullYear()
        const currentFiscalMonth = now.getDate() < 11 ? (now.getMonth() === 0 ? 11 : now.getMonth() - 1) : now.getMonth()

        startPeriod = new Date(currentFiscalYear, currentFiscalMonth, 11)
        endPeriod = new Date(currentFiscalYear, currentFiscalMonth + 1, 10)
    }

    const startIso = startPeriod.toISOString().split('T')[0]
    const endIso = endPeriod.toISOString().split('T')[0]

    console.log(`Fetching details for user: ${userId}, range: ${startIso} to ${endIso}`)

    const { data: records, error } = await supabase
        .from('transportation_records')
        .select(`
            *,
            attendance_records!inner (
                date
            )
        `)
        .eq('attendance_records.user_id', userId)
        .gte('attendance_records.date', startIso)
        .lte('attendance_records.date', endIso)
        .order('attendance_records(date)', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching details:', error)
    }

    // Also get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    return { records: records || [], profile }
}

export type TransportationUpdateData = {
    origin: string
    destination: string
    transport_method: string
    route_type: string
    amount: number
}

export async function updateTransportationRecord(recordId: string, data: TransportationUpdateData) {
    const supabase = await createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((adminProfile as any)?.role !== 'admin') {
        throw new Error('Forbidden')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('transportation_records') as any)
        .update({
            origin: data.origin,
            destination: data.destination,
            transport_method: data.transport_method,
            route_type: data.route_type,
            amount: data.amount,
            // updated_at: new Date().toISOString() // if column exists
        })
        .eq('id', recordId)

    if (error) {
        console.error('Update Transport Error:', error)
        throw new Error('Failed to update transportation record')
    }

    revalidatePath('/admin/transportation/[userId]', 'page')
    return { success: true }
}

export async function deleteTransportationRecord(recordId: string) {
    const supabase = await createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((adminProfile as any)?.role !== 'admin') {
        throw new Error('Forbidden')
    }

    const { error } = await supabase
        .from('transportation_records')
        .delete()
        .eq('id', recordId)

    if (error) {
        throw new Error('Failed to delete transportation record')
    }

    revalidatePath('/admin/transportation/[userId]', 'page')
    return { success: true }
}

export async function createTransportationRecord(userId: string, date: string, data: TransportationUpdateData) {
    const supabase = await createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((adminProfile as any)?.role !== 'admin') {
        throw new Error('Forbidden')
    }

    // 1. Find or Create Attendance Record
    let attendanceId: string | null = null

    const { data: existingAttendance } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

    if (existingAttendance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attendanceId = (existingAttendance as any).id
    } else {
        // Create new attendance record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newAttendance, error: createError } = await (supabase.from('attendance_records') as any)
            .insert({
                user_id: userId,
                date: date
                // clock_in/out/break can be null
            })
            .select('id')
            .single()

        if (createError || !newAttendance) {
            console.error('Failed to create attendance for transport:', createError)
            throw new Error('Failed to create parent attendance record')
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attendanceId = (newAttendance as any).id
    }

    // 2. Create Transportation Record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('transportation_records') as any)
        .insert({
            attendance_record_id: attendanceId,
            origin: data.origin,
            destination: data.destination,
            transport_method: data.transport_method,
            route_type: data.route_type,
            amount: data.amount
        })

    if (error) {
        console.error('Create Transport Error:', error)
        throw new Error('Failed to create transportation record')
    }

    revalidatePath('/admin/transportation/[userId]', 'page')
    return { success: true }
}
