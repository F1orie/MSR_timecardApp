import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import ExcelJS from 'exceljs'
import path from 'path'
import { promises as fs } from 'fs'
import { calculateDailyStats, AttendanceRecord } from '@/utils/calculations'
import JSZip from 'jszip'

interface EmployeeProfile {
    id: string
    username: string | null
    full_name: string | null
    role: string | null
    hourly_wage: number | null
}

const getJSTTimeStr = (isoString: string) => {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(d)
}

export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year') // YYYY
    const month = searchParams.get('month') // MM

    if (!year || !month) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    let userIds: string[] = []
    try {
        const body = await request.json()
        if (Array.isArray(body.userIds)) {
            userIds = body.userIds
        }
    } catch (e) {
        // ignore
    }

    if (userIds.length === 0) {
        return NextResponse.json({ error: 'No users selected' }, { status: 400 })
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

    // 2. Fetch Selected Users
    const { data: employees } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

    if (!employees || employees.length === 0) {
        return NextResponse.json({ error: 'No valid employees found' }, { status: 404 })
    }

    // 3. Date Range (11th of prev month to 10th of current month)
    const targetYear = parseInt(year)
    const targetMonth = parseInt(month)

    const prevMonthDate = new Date(targetYear, targetMonth - 2, 11)
    const currentMonthDate = new Date(targetYear, targetMonth - 1, 10)

    const startStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-11`
    const endStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}-10`

    // Fetch Attendance Records
    const { data: rawRecords } = await supabase
        .from('attendance_records')
        .select(`
            *,
            break_records (*)
        `)
        .in('user_id', userIds)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true })

    const allRecords = (rawRecords || []) as unknown as AttendanceRecord[]

    // Fetch Transportation Records linked to these attendance records
    const attendanceIds = allRecords.map(r => r.id).filter(Boolean)
    let allTransport: any[] = []
    if (attendanceIds.length > 0) {
        const { data: transportRecords, error: transportError } = await supabase
            .from('transportation_records')
            .select('*')
            .in('attendance_record_id', attendanceIds)
        
        if (transportError) {
            console.error('Fetch Transportation Records Error:', transportError)
        }
        allTransport = transportRecords || []
    }

    // 4. Load Excel Template
    const templatePath = path.join(process.cwd(), 'public', '勤怠表_サンプル.xlsx')
    let templateBuffer: Buffer
    try {
        templateBuffer = await fs.readFile(templatePath)
    } catch {
        return NextResponse.json({ error: 'Template not found' }, { status: 500 })
    }

    const zip = new JSZip()
    const generatedFiles: { name: string, buffer: Buffer }[] = []

    for (const emp of (employees as unknown as EmployeeProfile[])) {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(templateBuffer as any)
        const sheet = workbook.getWorksheet(1)
        if (!sheet) continue

        const empRecords = allRecords.filter(r => r.user_id === emp.id)

        // Generate Dates array for the period
        const dateList: Date[] = []
        const curr = new Date(prevMonthDate)
        while (curr <= currentMonthDate) {
            dateList.push(new Date(curr))
            curr.setDate(curr.getDate() + 1)
        }

        const daysCount = dateList.length

        // Top Headers
        sheet.getCell('A1').value = `${prevMonthDate.getMonth() + 1}/${prevMonthDate.getDate()}`
        sheet.getCell('C1').value = `${currentMonthDate.getMonth() + 1}/${currentMonthDate.getDate()}`
        sheet.getCell('D1').value = `氏名：${emp.full_name || emp.username || ''}` // D1 instead of E1

        // Data Rows
        // Row 2 is headers. We insert starting at Row 3 up to Row 15.
        let teleworkCount = 0
        let totalWorkMinutes = 0
        let totalTransport = 0

        const fmt = (mins: number) => {
            const safeMins = Math.round(mins)
            const h = Math.floor(safeMins / 60)
            const m = safeMins % 60
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        }

        // Filter only days with attendance records (work or telework)
        const workedDays = dateList.filter(dateObj => {
            const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
            const record = empRecords.find(r => r.date === dateStr)
            if (!record) return false
            const daily = calculateDailyStats(record)
            return daily.workMinutes > 0 || record.is_telework
        })

        // 行の動的挿入 (13行を超える場合)
        const extraRows = workedDays.length - 13
        if (extraRows > 0) {
            sheet.insertRows(16, Array(extraRows).fill([]))
            
            // 挿入された行に Row 3 (テンプレートのデータ行) のスタイルをコピー
            for (let r = 0; r < extraRows; r++) {
                const srcRow = sheet.getRow(3)
                const destRow = sheet.getRow(16 + r)
                for (let col = 1; col <= 8; col++) {
                    destRow.getCell(col).style = srcRow.getCell(col).style
                }
                destRow.height = srcRow.height
            }
        }

        for (let i = 0; i < workedDays.length; i++) {

            const dateObj = workedDays[i]
            const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
            
            const record = empRecords.find(r => r.date === dateStr)
            
            const rowIdx = 3 + i
            const row = sheet.getRow(rowIdx)
            
            // Format: M月D日
            row.getCell(1).value = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
            
            if (record) {
                // 在宅
                if (record.is_telework) {
                    row.getCell(2).value = '✓'
                    teleworkCount++
                }

                // 始業
                if (record.clock_in) {
                    row.getCell(3).value = getJSTTimeStr(record.clock_in)
                }
                
                // 終業
                if (record.clock_out) {
                    row.getCell(4).value = getJSTTimeStr(record.clock_out)
                }

                const daily = calculateDailyStats(record)

                // 休憩
                if (daily.breakMinutes > 0) {
                    row.getCell(5).value = fmt(daily.breakMinutes)
                }

                // 勤務時間
                if (daily.workMinutes > 0) {
                    row.getCell(6).value = fmt(daily.workMinutes)
                    totalWorkMinutes += daily.workMinutes
                }

                // 場所 & 交通費
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const dayTransports = allTransport.filter((t: any) => t.attendance_record_id === record.id)
                if (dayTransports.length > 0) {
                    let cost = 0
                    const locations = new Set<string>()
                    
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    dayTransports.forEach((t: any) => {
                        cost += t.amount || 0
                        if ((t.origin && t.origin.includes('渋谷')) || (t.destination && t.destination.includes('渋谷'))) {
                            locations.add('渋谷')
                        } else if ((t.origin && t.origin.includes('池尻大橋')) || (t.destination && t.destination.includes('池尻大橋'))) {
                            locations.add('池尻')
                        } else {
                            // 渋谷・池尻大橋以外は入力値をそのまま使用
                            const label = t.destination || t.origin || ''
                            if (label) locations.add(label)
                        }
                    })

                    // Custom Location display rules
                    if (locations.size > 0 && !record.is_telework) {
                        row.getCell(7).value = Array.from(locations).join('・')
                    }
                    
                    if (cost > 0) {
                        row.getCell(8).value = `\\${cost.toLocaleString()}`
                        totalTransport += cost
                    }
                }
                
            }

            // Commit row changes
            row.commit()
        }

        // Footer update position shifts based on inserted rows
        const footerStartRow = 16 + (extraRows > 0 ? extraRows : 0)
        
        const f1 = sheet.getRow(footerStartRow)
        // It should have 'テレワーク回数' at A, '合計時間数' at E (carried over from template)
        f1.getCell(2).value = teleworkCount // B
        f1.getCell(6).value = fmt(totalWorkMinutes) // F

        const f2 = sheet.getRow(footerStartRow + 1)
        // A: 120, D: 時給
        const teleworkTotal = 120 * teleworkCount
        f2.getCell(2).value = `\\${teleworkTotal.toLocaleString()}` // B
        f2.getCell(4).value = '時給' // D (Override "自給")
        
        const hourlyWage = emp.hourly_wage || 1300
        f2.getCell(5).value = `\\${hourlyWage.toLocaleString()}` // E
        
        const totalHoursDecimal = totalWorkMinutes / 60
        const salary = Math.floor(totalHoursDecimal * hourlyWage)
        f2.getCell(6).value = `\\${salary.toLocaleString()}` // F
        f2.getCell(8).value = `\\${totalTransport.toLocaleString()}` // H

        const f3 = sheet.getRow(footerStartRow + 2)
        // E: 支給額
        const totalPayment = teleworkTotal + salary + totalTransport
        f3.getCell(6).value = `\\${totalPayment.toLocaleString()}` // F

        const buffer = await workbook.xlsx.writeBuffer()
        const filename = `${emp.full_name || emp.username}${targetMonth}月_勤務表.xlsx`
        
        generatedFiles.push({ name: filename, buffer: Buffer.from(buffer) })
    }

    if (generatedFiles.length === 1) {
        // Return single xlsx
        const file = generatedFiles[0]
        const headers = new Headers()
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`)

        return new NextResponse(file.buffer as any, { status: 200, headers })
    } else {
        // Return ZIP
        generatedFiles.forEach(file => {
            zip.file(file.name, file.buffer)
        })
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
        
        const headers = new Headers()
        headers.set('Content-Type', 'application/zip')
        headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${month}月_勤務表.zip`)}`)

        return new NextResponse(zipBuffer as any, { status: 200, headers })
    }
}
