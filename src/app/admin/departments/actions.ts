'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createDepartment(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const code = formData.get('code') as string

    if (!name || !code) {
        return { error: 'Name and Code are required' }
    }

    const { error } = await supabase
        .from('departments')
        .insert({ name, code })

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { error: 'Department code must be unique' }
        }
        return { error: error.message }
    }

    revalidatePath('/admin/departments')
    return { success: true }
}
