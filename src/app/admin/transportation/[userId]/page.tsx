import { getEmployeeTransportDetails } from '@/features/admin/transportation-actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ExportButton } from '@/components/admin/export-button'
import { TransportationList } from '@/components/admin/TransportationList'
import { MonthSelector } from '@/components/admin/month-selector'

// Correct usage for Next.js 15+ (App Router): params is a Promise
type Props = {
    params: Promise<{ userId: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TransportationDetailPage({ params, searchParams }: Props) {
    const { userId } = await params
    const resolvedSearchParams = await searchParams
    const dateParam = typeof resolvedSearchParams.date === 'string' ? resolvedSearchParams.date : undefined

    // Parse date for display and export
    let year: number
    let month: number

    if (dateParam) {
        const [y, m] = dateParam.split('-').map(Number)
        if (!isNaN(y) && !isNaN(m)) {
            year = y
            month = m
        } else {
            const now = new Date()
            year = now.getFullYear()
            month = now.getMonth() + 1
        }
    } else {
        const now = new Date()
        year = now.getFullYear()
        month = now.getMonth() + 1
    }

    const { records, profile } = await getEmployeeTransportDetails(userId, dateParam)

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/transportation" className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(profile as any)?.full_name || '従業員'} の交通費詳細
                        </h1>
                    </div>
                </div>

                <div className='flex items-center gap-4'>
                    <MonthSelector />
                    <ExportButton
                        userId={userId}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        userName={(profile as any)?.full_name || 'user'}
                        year={year}
                        month={month}
                    />
                </div>
            </header>

            <TransportationList records={records} userId={userId} />
        </div>
    )
}
