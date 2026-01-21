'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export function MonthSelector() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get current date from URL or default to now
    const currentParam = searchParams.get('date')

    // Ensure valid date
    const safeDate = useMemo(() => {
        const d = currentParam ? new Date(currentParam + '-01') : new Date()
        return isNaN(d.getTime()) ? new Date() : d
    }, [currentParam])

    const handleMonthChange = useCallback((offset: number) => {
        const newDate = new Date(safeDate)
        newDate.setMonth(newDate.getMonth() + offset)

        const year = newDate.getFullYear()
        const month = String(newDate.getMonth() + 1).padStart(2, '0')
        const dateString = `${year}-${month}`

        router.push(`${pathname}?date=${dateString}`)
    }, [safeDate, router, pathname])

    const year = safeDate.getFullYear()
    const month = safeDate.getMonth() + 1

    return (
        <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
            <button
                onClick={() => handleMonthChange(-1)}
                className="p-1 hover:bg-slate-700 rounded text-gray-400 hover:text-white transition-colors"
                aria-label="前月"
            >
                &lt;&lt;
            </button>

            <span className="text-lg font-bold text-white w-32 text-center">
                {year}年 {month}月
            </span>

            <button
                onClick={() => handleMonthChange(1)}
                className="p-1 hover:bg-slate-700 rounded text-gray-400 hover:text-white transition-colors"
                aria-label="翌月"
            >
                &gt;&gt;
            </button>
        </div>
    )
}
