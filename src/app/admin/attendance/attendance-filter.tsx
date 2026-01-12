'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function AttendanceFilter({ departments }: { departments: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentFilter = searchParams.get('department') || ''

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        const params = new URLSearchParams(searchParams.toString())

        if (value) {
            params.set('department', value)
        } else {
            params.delete('department')
        }

        router.push(`?${params.toString()}`)
    }

    return (
        <div className="glass-panel p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-300">部署で絞り込み:</label>
                <select
                    value={currentFilter}
                    onChange={handleFilterChange}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                    <option value="">すべての部署</option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
