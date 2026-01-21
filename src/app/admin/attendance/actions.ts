'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type AttendanceUpdateData = {
    clock_in: string | null
    clock_out: string | null
    break_start: string | null
    break_end: string | null
}

export async function updateAttendance(recordId: string, data: AttendanceUpdateData) {
    const supabase = await createClient()

    // 1. Check Admin
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

    // 2. Update Attendance Record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: attendanceError } = await (supabase.from('attendance_records') as any)
        .update({
            clock_in: data.clock_in,
            clock_out: data.clock_out
        })
        .eq('id', recordId)

    if (attendanceError) throw new Error('Failed to update attendance')

    // 3. Update Break Record
    const { data: breakRecord } = await supabase
        .from('break_records')
        .select('id')
        .eq('attendance_record_id', recordId)
        .single()

    if (breakRecord) {
        if (data.break_start) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: breakError } = await (supabase.from('break_records') as any)
                .update({
                    start_time: data.break_start,
                    end_time: data.break_end
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .eq('id', (breakRecord as any).id)

            if (breakError) throw new Error('Failed to update break record')
        } else {
            if (!data.break_start && !data.break_end) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await supabase.from('break_records').delete().eq('id', (breakRecord as any).id)
            }
        }
    } else {
        if (data.break_start) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: createBreakError } = await (supabase.from('break_records') as any)
                .insert({
                    attendance_record_id: recordId,
                    start_time: data.break_start,
                    end_time: data.break_end
                })

            if (createBreakError) throw new Error('Failed to create break record')
        }
    }

    revalidatePath('/admin/attendance')
    return { success: true }
}

export async function createAttendance(userId: string, date: string, data: AttendanceUpdateData) {
    const supabase = await createClient()

    // 1. Check Admin
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

    // 2. Validate Duplicate
    const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

    if (existing) {
        throw new Error('This user already has a record for this date.')
    }

    // 3. Create Record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newRecord, error: createError } = await (supabase.from('attendance_records') as any)
        .insert({
            user_id: userId,
            date: date,
            clock_in: data.clock_in,
            clock_out: data.clock_out
        })
        .select()
        .single()

    if (createError || !newRecord) {
        throw new Error('Failed to create attendance record')
    }

    // 4. Create Break Record if needed
    if (data.break_start) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: breakError } = await (supabase.from('break_records') as any)
            .insert({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                attendance_record_id: (newRecord as any).id,
                start_time: data.break_start,
                end_time: data.break_end
            })

        if (breakError) console.error('Failed to create break record', breakError)
    }

    revalidatePath('/admin/attendance')
    return { success: true }
}

export async function deleteAttendance(recordId: string) {
    const supabase = await createClient()

    // 1. Check Admin
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

    // 2. Delete Record
    const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordId)

    if (error) {
        throw new Error('Failed to delete attendance record')
    }

    revalidatePath('/admin/attendance')
    return { success: true }
}
