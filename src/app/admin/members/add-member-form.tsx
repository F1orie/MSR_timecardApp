'use client'

import { useActionState } from 'react'
import { createMember } from './actions'

const initialState = {
    success: false,
    error: '',
}

export default function AddMemberForm() {
    // @ts-expect-error - useActionState type mismatch with Server Action Return Type in Next.js 15 RC sometimes
    const [state, formAction, isPending] = useActionState(createMember, initialState)

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm text-gray-400">氏名</label>
                <input
                    name="fullName"
                    type="text"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm text-gray-400">ユーザー名 (ログインID)</label>
                <input
                    name="username"
                    type="text"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    required
                />
            </div>

            {/* Department selection removed - automatically assigned to Admin's department */}

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">連絡先メールアドレス (任意)</label>
                <input
                    name="contactEmail"
                    type="email"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="text-sm text-blue-200">
                    初期パスワードは「ユーザー名」と同じに設定されます。
                    初回ログイン時に変更が必要です。
                </p>
            </div>

            {state?.error && (
                <p className="text-xs text-red-400">{state.error}</p>
            )}
            {state?.success && (
                <p className="text-xs text-green-400">従業員を登録しました！</p>
            )}

            <button
                disabled={isPending}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
                {isPending ? '登録中...' : '登録する'}
            </button>

            <p className="text-xs text-yellow-500/80 mt-2">
                * サービスロール機能が必要です
            </p>
        </form>
    )
}
