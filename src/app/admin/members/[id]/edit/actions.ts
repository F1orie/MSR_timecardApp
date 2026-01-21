'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createAdminClient } from '@/utils/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateMember(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const id = formData.get('id') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as 'admin' | 'member' | 'arbeit' | 'intern'
    const hourlyWage = parseInt(formData.get('hourlyWage') as string) || 0
    const commuterPassPrice = parseInt(formData.get('commuterPassPrice') as string) || 0
    const contactEmail = formData.get('contactEmail') as string

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any)
        .update({
            full_name: fullName,
            role,
            hourly_wage: hourlyWage,
            commuter_pass_price: commuterPassPrice,
            contact_email: contactEmail
        })
        .eq('id', id)

    if (error) {
        if (error.message.includes('profiles_role_check')) {
            return { error: 'データベースエラー: 役職の設定が更新されていません。SupabaseのSQL Editorでマイグレーションスクリプトを実行してください。' }
        }
        return { error: error.message }
    }

    revalidatePath('/admin/members')
    revalidatePath('/admin')
    redirect('/admin/members')
}

export async function initializePassword(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Check if requester is admin
    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((requesterProfile as any)?.role !== 'admin') {
        return { error: 'Unauthorized' }
    }

    const adminClient = createAdminClient()
    const tempPassword = 'Password123'

    // Update Auth User
    const { error: authError } = await adminClient.auth.admin.updateUserById(
        userId,
        { password: tempPassword }
    )

    if (authError) return { error: authError.message }

    // Update Profile Flag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (adminClient.from('profiles') as any)
        .update({ password_reset_required: true })
        .eq('id', userId)

    if (profileError) return { error: profileError.message }

    revalidatePath('/admin/members')
    return { success: true }
}
