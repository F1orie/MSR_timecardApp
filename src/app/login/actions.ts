'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { generateAuthEmail } from '@/utils/auth-helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const loginId = (formData.get('loginId') as string).trim()
    const password = formData.get('password') as string
    const deptCode = (formData.get('deptCode') as string).trim()

    if (!deptCode) {
        return { error: 'Department Code is required' }
    }

    // Always use constructed email: Hex(username)@[deptCode].local
    // Even for admins, they must provide their Tenant Code.
    const email = generateAuthEmail(loginId, deptCode)

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    if (data.user) {
        // Check for forced password change
        if (data.user.user_metadata?.is_password_change_required) {
            redirect('/change-password')
        }

        // Check user role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((profile as any)?.role === 'admin') {
            revalidatePath('/admin', 'layout')
            redirect('/admin')
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
