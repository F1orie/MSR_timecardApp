'use client'

import { useActionState } from 'react'
import { createMember } from './actions'

const initialState = {
    success: false,
    error: '',
}

export function AddMemberForm() {
    // @ts-expect-error - useActionState type mismatch with Server Action Return Type in Next.js 15 RC sometimes
    const [state, formAction, isPending] = useActionState(createMember, initialState)

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm text-gray-400">Full Name</label>
                <input
                    name="fullName"
                    type="text"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm text-gray-400">Email Address</label>
                <input
                    name="email"
                    type="email"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm text-gray-400">Default Password</label>
                <input
                    name="password"
                    type="text"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    defaultValue="12345678"
                    required
                />
            </div>

            {state?.error && (
                <p className="text-xs text-red-400">{state.error}</p>
            )}
            {state?.success && (
                <p className="text-xs text-green-400">Member created successfully!</p>
            )}

            <button
                disabled={isPending}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
                {isPending ? 'Creating...' : 'Create Member'}
            </button>

            <p className="text-xs text-yellow-500/80 mt-2">
                * Requires Service Role functionality
            </p>
        </form>
    )
}
