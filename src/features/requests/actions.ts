'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitRequest(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const type = formData.get('type') as string
    const content = formData.get('content') as string

    if (!type || !content) {
        return { error: 'Type and content are required' }
    }

    const { error } = await supabase
        .from('requests')
        .insert({
            user_id: user.id,
            type,
            content,
            status: 'pending'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)

    if (error) {
        console.error('Request submission error:', error)
        return { error: 'Failed to submit request' }
    }

    revalidatePath('/')
    return { success: true }
}
