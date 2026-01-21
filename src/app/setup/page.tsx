'use client'

import { useActionState } from 'react'
import { createInitialAdmin } from './actions'

const initialState = {
    error: '',
}

export default function SetupPage() {
    const [state, formAction, isPending] = useActionState(createInitialAdmin, initialState)

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8">
                <h1 className="text-3xl font-bold text-white mb-2">企業アカウント作成</h1>
                <p className="text-gray-400 mb-8">管理者アカウントと企業コードを作成</p>

                <form action={formAction} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">団体名 (企業名)</label>
                        <input
                            name="companyName"
                            type="text"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            placeholder="例: 株式会社A"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">ユーザー名</label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            placeholder="例: admin"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">パスワード</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            placeholder="••••••••"
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
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg"
                    >
                        {isPending ? '作成中...' : 'アカウント作成'}
                    </button>
                </form>
            </div>
        </div>
    )
}
