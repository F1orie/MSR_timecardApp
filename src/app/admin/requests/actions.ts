'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateRequestStatus(requestId: string, newStatus: string) {
    const supabase = await createClient()

    // Auth check
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Role check
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((profile as any)?.role !== 'admin') {
        return { error: 'Forbidden' }
    }

    // Update status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('requests') as any)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId)

    if (error) {
        console.error('Error updating request status:', error)
        return { error: 'Failed to update status' }
    }

    revalidatePath('/admin/requests')
    return { success: true }
}
