'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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

    // 1. まず現在のユーザーを確認
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'ユーザーが見つかりません' }
    }

    // 2. パスワードを更新 (と同時にメタデータも更新)
    const { error: authError } = await supabase.auth.updateUser({
        password: password,
        data: { is_password_change_required: false }
    })

    if (authError) {
        return { error: authError.message }
    }

    // 3. Service Roleクライアントを使用して確実にプロフィールのフラグを更新
    // (RLSやセッション状態の影響を受けないようにするため)
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabaseAdmin.from('profiles') as any)
        .update({ password_reset_required: false })
        .eq('id', user.id)

    if (profileError) {
        console.error('Failed to update profile flag:', profileError)
        return { error: 'プロフィールの更新に失敗しました' }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
