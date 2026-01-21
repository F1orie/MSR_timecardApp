'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function changePassword(prevState: any, formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'パスワードが一致しません' }
    }

    if (password.length < 6) {
        return { error: 'パスワードは6文字以上で設定してください' }
    }

    const supabase = await createClient()

    const { error: authError } = await supabase.auth.updateUser({
        password: password
    })

    if (authError) {
        return { error: authError.message }
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: profileError } = await (supabase.from('profiles') as any)
            .update({ password_reset_required: false })
            .eq('id', user.id)

        if (profileError) {
            console.error('Failed to update profile flag:', profileError)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
