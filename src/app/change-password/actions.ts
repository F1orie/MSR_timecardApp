'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePassword(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'パスワードが一致しません。' }
    }

    if (password.length < 6) {
        return { error: 'パスワードは6文字以上で設定してください。' }
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
        data: { is_password_change_required: false }
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
