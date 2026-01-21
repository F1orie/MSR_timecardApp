import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import ExcelJS from 'exceljs'
import path from 'path'
import { promises as fs } from 'fs'
import { calculateDailyStats, AttendanceRecord } from '@/utils/calculations'

interface EmployeeProfile {
    id: string
    username: string | null
    full_name: string | null
    role: string | null
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year') // YYYY
    const month = searchParams.get('month') // MM

    if (!year || !month) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Check Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((adminProfile as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Fetch All Non-Admin Users
    const { data: employees } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin') // Exclude admins as requested
        .order('username', { ascending: true }) // Order by ID?

    if (!employees || employees.length === 0) {
        return NextResponse.json({ error: 'No employees found' }, { status: 404 })
    }

    // 3. Fetch Records for the month
    const targetYear = parseInt(year)
    const targetMonth = parseInt(month)
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1)
    const endOfMonth = new Date(targetYear, targetMonth, 1) // First day of next month

    const startStr = startOfMonth.toISOString().split('T')[0]
    const endStr = endOfMonth.toISOString().split('T')[0]

    const { data: rawRecords } = await supabase
        .from('attendance_records')
        .select(`
            *,
            break_records (*)
        `)
        .gte('date', startStr)
        .lt('date', endStr)

    const allRecords = (rawRecords || []) as unknown as AttendanceRecord[]

    // 4. Load Excel Template
    const templatePath = path.join(process.cwd(), 'sample', '30XXXX_25年12月.xlsx') // Use the sample as template
    // Verify file exists
    try {
        await fs.access(templatePath)
    } catch {
        return NextResponse.json({ error: 'Template not found' }, { status: 500 })
    }

    const templateBuffer = await fs.readFile(templatePath)
    const workbook = new ExcelJS.Workbook()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(templateBuffer as any)

    const sheet = workbook.getWorksheet(1)
    if (!sheet) return NextResponse.json({ error: 'Invalid sheet' }, { status: 500 })

    // 5. Aggregate and Fill Data
    // Clear existing data from row 2 downwards (User said Row 1 is header, Row 2 onwards is data)
    // Actually the sample might have data. Let's start filling from Row 2.
    // If there were existing rows, we overwrite.

    let currentRow = 2

    // Helper to format hours (minutes -> H.HH or H:MM?) 
    // Usually reports like H:MM or decimal hours. 
    // Let's assume decimal 1.5h or "1:30". 
    // Calculations.ts formatDuration returns "H:MM". Let's use that string.
    // Or if Excel expects number, we do decimal. 
    // Looking at the sample file headers "時間" usually implies hours.
    // Let's stick to "H:MM" string for now as it's safe for display.

    const fmt = (mins: number) => {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return `${h}:${String(m).padStart(2, '0')}`
    }

    (employees as unknown as EmployeeProfile[]).forEach(emp => {
        const userRecords = allRecords.filter(r => r.user_id === emp.id)

        const stats = {
            workDays: 0,
            weekdayDays: 0,
            satDays: 0,
            sunDays: 0,
            workMinutes: 0,
            weekdayMinutes: 0,
            satMinutes: 0,
            sunMinutes: 0,
            lateNightMinutes: 0,
            teleworkCount: 0
        }

        userRecords.forEach(rec => {
            const daily = calculateDailyStats(rec)
            if (daily.workMinutes > 0) {
                stats.workDays++
                if (daily.saturdayMinutes > 0) stats.satDays++
                else if (daily.sundayMinutes > 0) stats.sunDays++
                else stats.weekdayDays++
            }

            stats.workMinutes += daily.workMinutes
            stats.weekdayMinutes += daily.weekdayMinutes
            stats.satMinutes += daily.saturdayMinutes
            stats.sunMinutes += daily.sundayMinutes
            stats.lateNightMinutes += daily.lateNightMinutes

            if (rec.is_telework) stats.teleworkCount++
        })

        const roleMap: Record<string, string> = {
            'admin': '管理者',
            'member': '社員',
            'arbeit': 'アルバイト',
            'intern': 'インターン'
        }

        const row = sheet.getRow(currentRow)

        // 1: User ID
        row.getCell(1).value = emp.username || ''
        // 2: Name
        row.getCell(2).value = emp.full_name || ''
        // 3: Role (Group)
        row.getCell(3).value = roleMap[emp.role || ''] || emp.role || ''

        // 4: Work Days
        row.getCell(4).value = stats.workDays
        // 5: Weekday Days
        row.getCell(5).value = stats.weekdayDays
        // 6: Sat Days
        row.getCell(6).value = stats.satDays
        // 7: Sun Days
        row.getCell(7).value = stats.sunDays

        // 8: Total Hours
        row.getCell(8).value = fmt(stats.workMinutes)
        // 9: Weekday Hours
        row.getCell(9).value = fmt(stats.weekdayMinutes)
        // 10: Sat Hours
        row.getCell(10).value = fmt(stats.satMinutes)
        // 11: Sun Hours
        row.getCell(11).value = fmt(stats.sunMinutes)
        // 12: Late Night Hours
        row.getCell(12).value = fmt(stats.lateNightMinutes)

        // 13: Weekday Overtime 
        row.getCell(13).value = '0:00'
        // 14: Deemed Overtime
        row.getCell(14).value = '0:00'
        // 15: Holiday Overtime
        row.getCell(15).value = '0:00'

        // 16-22: Leave (Paid, Substitution, etc.)
        row.getCell(16).value = 0 // Remaining Paid Leave
        row.getCell(17).value = 0 // Expired Paid Leave
        row.getCell(18).value = 0 // Used Paid Leave
        row.getCell(19).value = 0 // Remaining Sub Leave
        row.getCell(20).value = 0 // Expired Sub Leave
        row.getCell(21).value = 0 // Remaining Comp Leave
        row.getCell(22).value = 0 // Expired Comp Leave

        // 23: Telework Count
        row.getCell(23).value = stats.teleworkCount

        // Apply styles to the row: Font color black
        row.eachCell((cell) => {
            cell.font = { color: { argb: '00000000' } } // Black
        })

        row.commit()
        currentRow++
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const shortYear = year.slice(-2)
    const filename = `30XXX_${shortYear}年${month}月.xlsx`
    const encodedFilename = encodeURIComponent(filename)

    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(buffer as any, {
        status: 200,
        headers
    })
}
