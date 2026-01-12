'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { generateAuthEmail } from '@/utils/auth-helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createMember(prevState: any, formData: FormData) {
    const supabaseAdmin = createAdminClient()

    const fullName = formData.get('fullName') as string
    const username = (formData.get('username') as string).trim()
    const contactEmail = (formData.get('contactEmail') as string || '').trim() || null
    // Authenticate Admin
    const supabase = await createClient() // standard client for auth check
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) return { error: 'Unauthorized' }

    // Get Admin's Department Code
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select(`
            department_id,
            departments (code)
        `)
        .eq('id', adminUser.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const departmentCode = (adminProfile?.departments as any)?.code

    if (!departmentCode) {
        return { error: 'Admin department not found' }
    }

    let emailForAuth: string | null = null

    // Always prioritize Username + Dept for Auth if available
    if (username && departmentCode) {
        emailForAuth = generateAuthEmail(username, departmentCode)
    } else if (contactEmail) {
        emailForAuth = contactEmail
    }

    const password = username // Initial password is the same as username

    if (!emailForAuth || !password) {
        return { error: 'Email/Username (with Dept) are required' }
    }

    // 1. Create Auth User
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: emailForAuth,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            username: username || null,
            contact_email: contactEmail,
            department_code: departmentCode || null,
            is_password_change_required: true // Force password change on first login
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
