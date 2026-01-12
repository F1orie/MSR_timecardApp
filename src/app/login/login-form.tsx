'use client'

import { useActionState } from 'react'
import { login } from '@/app/login/actions'

const initialState = {
    error: '',
}

export function LoginForm() {
    const [state, formAction, isPending] = useActionState(login, initialState)

    return (
        <form action={formAction} className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="name@example.com"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="password">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="••••••••"
                />
            </div>

            {state?.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {state.error}
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-purple-500/25 transform transition-all active:scale-[0.98] duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? 'Signing In...' : 'Sign In'}
            </button>
        </form>
    )
}
