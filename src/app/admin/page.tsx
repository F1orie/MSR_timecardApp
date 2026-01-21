import { getAdminData } from '@/features/admin/actions'
import { MonthSelector } from '@/components/admin/month-selector'
import { DashboardTable } from '@/components/admin/DashboardTable'

interface AdminDashboardProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
    const resolvedParams = await searchParams
    // Parse year and month from searchParams (format: YYYY-MM)
    const dateParam = typeof resolvedParams.date === 'string' ? resolvedParams.date : undefined
    let year: number | undefined
    let month: number | undefined

    if (dateParam) {
        const [y, m] = dateParam.split('-').map(Number)
        if (!isNaN(y) && !isNaN(m)) {
            year = y
            month = m
        }
    }

    const { employees, attendanceStats, attendanceRecords } = await getAdminData(year, month)
    const currentMonth = dateParam || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">ダッシュボード</h1>
                    <p className="text-gray-400">月次概要と従業員管理</p>
                </div>
                <MonthSelector />
            </header>

            <DashboardTable
                employees={employees as any}
                attendanceStats={attendanceStats}
                attendanceRecords={attendanceRecords as any}
                currentMonth={currentMonth}
            />
        </div>
    )
}
