'use client'

import { useActionState } from 'react'
import { updateMember } from './actions'

type Profile = {
    id: string
    full_name: string | null
    role: 'admin' | 'employee' | string | null
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
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="id" value={profile.id} />

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Username (Read Only)</label>
                <input
                    type="text"
                    value={profile.username || ''}
                    disabled
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Full Name</label>
                <input
                    name="fullName"
                    type="text"
                    defaultValue={profile.full_name || ''}
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Contact Email</label>
                <input
                    name="contactEmail"
                    type="email"
                    defaultValue={profile.contact_email || ''}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Hourly Wage (¥)</label>
                    <input
                        name="hourlyWage"
                        type="number"
                        defaultValue={profile.hourly_wage || 1000}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Commuter Pass (¥/mo)</label>
                    <input
                        name="commuterPassPrice"
                        type="number"
                        defaultValue={profile.commuter_pass_price || 0}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Role</label>
                <select
                    name="role"
                    defaultValue={profile.role || 'employee'}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
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
                    Cancel
                </a>
                <button
                    disabled={isPending}
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    {isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    )
}
