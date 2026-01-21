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

    // Auto-generate Username (User ID) logic: 3 digits starting from 101
    // Fetch existing users in this department to determine the next ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deptId = (adminProfile as any).department_id
    const { data: deptProfiles } = await supabase
        .from('profiles')
        .select('username')
        .eq('department_id', deptId)

    let nextId = 101
    if (deptProfiles && deptProfiles.length > 0) {
        // Filter and find max ID
        const ids = deptProfiles
            .map((p: { username: string | null }) => parseInt(p.username || '0', 10))
            .filter((id: number) => !isNaN(id) && id >= 101) // Only consider valid 101+ IDs

        if (ids.length > 0) {
            nextId = Math.max(...ids) + 1
        }
    }

    const username = nextId.toString()
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
