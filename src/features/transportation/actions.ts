'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type TransportationRecordInput = {
    attendance_record_id: string
    origin: string
    destination: string
    transport_method: string
    route_type: '片道' | '往復'
    amount: number
}

export async function addTransportationRecords(records: TransportationRecordInput[]) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify attendance record belongs to user
    // We do this check implicitly via RLS, but explicit check is good practice or rely on RLS insert policy
    // Our RLS policy checks "exists in attendance_records where user_id = auth.uid()"

    const { error } = await supabase
        .from('transportation_records')
        .insert(records)

    if (error) {
        console.error('AddTransportation Error:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function getTodayTransportation(attendanceId: string) {
    if (!attendanceId) return []

    const supabase = await createClient()
    const { data } = await supabase
        .from('transportation_records')
        .select('*')
        .eq('attendance_record_id', attendanceId)
        .order('created_at', { ascending: true })

    return data || []
}
