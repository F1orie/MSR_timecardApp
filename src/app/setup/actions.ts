'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { generateAuthEmail } from '@/utils/auth-helpers'
import { redirect } from 'next/navigation'

// Helper to generate a 3-digit code (000-999)
function generateCompanyCode() {
    return Math.floor(Math.random() * 1000).toString().padStart(3, '0')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createInitialAdmin(prevState: any, formData: FormData) {
    const supabaseAdmin = createAdminClient()

    const companyName = formData.get('companyName') as string
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    // Default Full Name to Username since field is removed
    const fullName = username

    let companyCode = ''
    let deptError = null
    let retries = 5

    // 0. Create Company Department with Auto-Generated Code
    while (retries > 0) {
        companyCode = generateCompanyCode()

        const { error } = await supabaseAdmin
            .from('departments')
            .insert({
                name: companyName,
                code: companyCode
            })
            .select()

        if (!error) {
            deptError = null
            break // Success
        }

        // If duplicate key (code), retry
        if (error.code === '23505') {
            retries--
            continue
        }

        // Other error
        deptError = error
        break
    }

    if (deptError) {
        return { error: '部署(企業)の作成に失敗しました: ' + deptError.message }
    }
    if (retries === 0) {
        return { error: '企業コードの生成に失敗しました。もう一度お試しください。' }
    }

    // 1. Create Auth User with Admin Role
    // Auth Email: Hex(username)@companyCode.local
    const authEmail = generateAuthEmail(username, companyCode)

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            username: username,
            department_code: companyCode,
        }
    })

    if (error || !data.user) {
        return { error: error?.message || 'ユーザー作成に失敗しました。' }
    }

    // 2. Update Profile Role to Admin and Wage to 0
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
            role: 'admin',
            hourly_wage: 0
        })
        .eq('id', data.user.id)

    if (updateError) {
        return { error: 'User created but failed to set as Admin: ' + updateError.message }
    }

    // 3. Auto-Login
    // Use the standard client to set session cookies
    const supabase = await createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password
    })

    if (loginError) {
        // If login fails, redirect to login page with message? 
        // Or just redirect to login page.
        redirect('/login')
    }

    redirect('/admin')
}
