'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createMember(prevState: any, formData: FormData) {
    const supabaseAdmin = createAdminClient()

    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 1. Create Auth User
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName
        }
    })

    if (authError) {
        console.error('Error creating user:', authError)
        return { error: authError.message }
    }

    // 2. Profile is automatically created by Trigger (supabase_schema.sql)
    // However, we might want to ensure properties are set correctly or handle custom data logic here if needed.
    // The trigger sets role='employee' by default.

    revalidatePath('/admin/members')
    return { success: true }
}
