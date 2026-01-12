'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { generateAuthEmail } from '@/utils/auth-helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createMember(prevState: any, formData: FormData) {
    const supabaseAdmin = createAdminClient()

    const fullName = formData.get('fullName') as string
    const username = (formData.get('username') as string).trim()
    const contactEmail = (formData.get('contactEmail') as string || '').trim() || null
    const departmentCode = (formData.get('department') as string).trim()

    // Generate dummy email for Auth if username is provided
    // If we have a department code, use it in the domain?
    // Plan says: [username]@[dept_code].local
    // But for now, let's stick to simple logic or follow the plan.
    // Plan: [username]@[dept_code].local

    let emailForAuth: string | null = null

    // Always prioritize Username + Dept for Auth if available
    if (username && departmentCode) {
        emailForAuth = generateAuthEmail(username, departmentCode)
    } else if (username) {
        // Fallback if no department selected (should not happen for normal members but just in case)
        // Using 'default' as dummy dept code
        emailForAuth = generateAuthEmail(username, 'default')
    } else if (contactEmail) {
        // Only if NO username is provided, try to use contact email (e.g. creating another Admin via this form?)
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
