'use client'

import { useActionState } from 'react'
import { updatePassword } from './actions'

const initialState = {
    error: '',
}

export default function ChangePasswordForm() {
    // @ts-expect-error - useActionState type mismatch
    const [state, formAction, isPending] = useActionState(updatePassword, initialState)

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8">
                <h1 className="text-2xl font-bold text-white mb-2">パスワードの変更</h1>
                <p className="text-gray-400 mb-6">
                    初回ログインのため、パスワードの変更が必要です。
                </p>

                <form action={formAction} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">新しいパスワード</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            placeholder="新しいパスワードを入力"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">新しいパスワード (確認)</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            placeholder="もう一度入力"
                        />
                    </div>

                    {state?.error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {state.error}
                        </div>
                    )}

                    <button
                        disabled={isPending}
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50"
                    >
                        {isPending ? '更新中...' : 'パスワードを変更してログイン'}
                    </button>
                </form>
            </div>
        </div>
    )
}
