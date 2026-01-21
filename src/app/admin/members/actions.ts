'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { generateAuthEmail } from '@/utils/auth-helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createMember(prevState: any, formData: FormData) {
    const supabaseAdmin = createAdminClient()

    const fullName = formData.get('fullName') as string
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
    const departmentCode = ((adminProfile as any)?.departments as any)?.code

    if (!departmentCode) {
        return { error: 'Admin department not found' }
    }

    // Check duplication within department
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deptId = (adminProfile as any).department_id

    const usernameInput = (formData.get('username') as string || '').trim()
    if (!usernameInput) {
        return { error: 'ユーザー名 (ログインID) は必須です' }
    }

    // Check existing
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('department_id', deptId)
        .eq('username', usernameInput)
        .single()

    if (existingUser) {
        return { error: 'このIDはすでにこの部署で使用されています。別のIDを指定してください。' }
    }

    const username = usernameInput
    // password default same as username
    const password = username

    let emailForAuth: string | null = null
    if (departmentCode) {
        emailForAuth = generateAuthEmail(username, departmentCode)
    }

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

    revalidatePath('/admin/members')
    return { success: true }
}
