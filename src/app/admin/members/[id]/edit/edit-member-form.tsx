'use client'

import { useActionState, useTransition } from 'react'
import { updateMember, initializePassword } from './actions'

type Profile = {
    id: string
    full_name: string | null
    role: 'admin' | 'member' | 'arbeit' | 'intern' | string | null
    hourly_wage: number | null
    commuter_pass_price: number | null
    username: string | null
    contact_email: string | null
}

const initialState = {
    error: '',
}

export function EditMemberForm({ profile }: { profile: Profile }) {
    const [state, formAction, isPending] = useActionState(updateMember, initialState)

    return (
        <div className="space-y-8">
            <form action={formAction} className="space-y-6">
                <input type="hidden" name="id" value={profile.id} />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">ユーザー名（変更不可）</label>
                    <input
                        type="text"
                        value={profile.username || ''}
                        disabled
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">氏名</label>
                    <input
                        name="fullName"
                        type="text"
                        defaultValue={profile.full_name || ''}
                        required
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">メールアドレス</label>
                    <input
                        name="contactEmail"
                        type="email"
                        defaultValue={profile.contact_email || ''}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">時給 (円)</label>
                        <input
                            name="hourlyWage"
                            type="number"
                            defaultValue={profile.hourly_wage || 1000}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">通勤定期代 (円/月)</label>
                        <input
                            name="commuterPassPrice"
                            type="number"
                            defaultValue={profile.commuter_pass_price || 0}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">ロール</label>
                    <select
                        name="role"
                        defaultValue={profile.role || 'member'}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                        <option value="admin">管理者</option>
                        <option value="member">メンバー</option>
                        <option value="arbeit">アルバイト</option>
                        <option value="intern">インターン</option>
                    </select>
                </div>

                {state?.error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {state.error}
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <a
                        href="/admin/members"
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-gray-300 hover:bg-slate-800 text-center transition-colors"
                    >
                        キャンセル
                    </a>
                    <button
                        disabled={isPending}
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isPending ? '保存中...' : '変更を保存'}
                    </button>
                </div>
            </form>

            <div className="pt-8 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">注意</h3>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <h4 className="text-red-400 font-bold">パスワード初期化</h4>
                        <p className="text-sm text-gray-400 mt-1">
                            パスワードを「Password123」にリセットし、次回ログイン時に変更を強制します。
                        </p>
                    </div>

                    <InitializePasswordButton userId={profile.id} />
                </div>
            </div>
        </div>
    )
}

function InitializePasswordButton({ userId }: { userId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleClick = () => {
        if (!confirm('本当にパスワードを初期化しますか？')) return

        startTransition(async () => {
            const result = await initializePassword(userId)
            if (result?.error) {
                alert('エラー: ' + result.error)
            } else {
                alert('パスワードを初期化しました。')
            }
        })
    }

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            type="button"
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors disabled:opacity-50 font-medium whitespace-nowrap"
        >
            {isPending ? '処理中...' : '初期化する'}
        </button>
    )
}
