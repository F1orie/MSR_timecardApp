'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTodayAttendance() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const today = new Date().toISOString().split('T')[0]

    const { data: attendanceData, error } = await supabase
        .from('attendance_records')
        .select(`
            *,
            break_records (*)
        `)
        .eq('user_id', user.id)
        .eq('date', today)
        // If multiple exist, take the first one created
        .order('created_at', { ascending: true })
        .limit(1)

    if (error) {
        console.error('GetAttendance Error:', error)
        console.error('GetAttendance Error Details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return null
    }

    return attendanceData?.[0] || null
}

export async function clockIn() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const today = new Date().toISOString().split('T')[0]

    // Check if already clocked in
    const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

    if (existing) {
        return { error: '既に本日の出勤記録が存在します' }
    }

    const { error } = await supabase.from('attendance_records').insert({
        user_id: user.id,
        date: today,
        clock_in: new Date().toISOString(),
    })

    if (error) {
        console.error('ClockIn Error:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function clockOut(attendanceId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('attendance_records')
        .update({
            clock_out: new Date().toISOString(),
        })
        .eq('id', attendanceId)

    if (error) {
        console.error('ClockOut Error:', error)
        return { error: error.message }
    }
    revalidatePath('/')
    return { success: true }
}

export async function startBreak(attendanceId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('break_records').insert({
        attendance_record_id: attendanceId,
        start_time: new Date().toISOString(),
    })

    if (error) {
        console.error('StartBreak Error:', error)
        return { error: error.message }
    }
    revalidatePath('/')
    return { success: true }
}

export async function endBreak(breakId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('break_records')
        .update({
            end_time: new Date().toISOString(),
        })
        .eq('id', breakId)

    if (error) {
        console.error('EndBreak Error:', error)
        return { error: error.message }
    }
    revalidatePath('/')
    return { success: true }
}
