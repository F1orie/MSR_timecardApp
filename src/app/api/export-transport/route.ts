import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import ExcelJS from 'exceljs'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    if (!userId || !year || !month) {
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

    // 2. Fetch Target User
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

    if (!targetProfile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Fetch Records
    const targetYear = parseInt(year)
    const targetMonth = parseInt(month)
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1)
    const endOfMonth = new Date(targetYear, targetMonth, 1)

    const startStr = startOfMonth.toISOString().split('T')[0]
    const endStr = endOfMonth.toISOString().split('T')[0]

    const { data: records } = await supabase
        .from('transportation_records')
        .select(`
            *,
            attendance_records!inner (
                date
            )
        `)
        .eq('attendance_records.user_id', userId)
        .gte('attendance_records.date', startStr)
        .lt('attendance_records.date', endStr)
        .order('attendance_records(date)', { ascending: true })

    // 4. Load Excel Template
    const templatePath = path.join(process.cwd(), '立替交通費精算書_例.xlsx')

    // Read buffer first
    const templateBuffer = await fs.readFile(templatePath)

    const workbook = new ExcelJS.Workbook()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(templateBuffer as any)

    const sheet = workbook.getWorksheet(1)
    if (!sheet) {
        return NextResponse.json({ error: 'Invalid template' }, { status: 500 })
    }

    // 5. Fill Data
    // Name at E2
    const nameCell = sheet.getCell('E2')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nameCell.value = (targetProfile as any)?.full_name || ''

    // Clear sample data from row 6 downwards
    // We clear columns A-G to remove any template placeholders
    const rowCount = sheet.rowCount
    if (rowCount >= 6) {
        for (let i = 6; i <= rowCount; i++) {
            ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
                sheet.getCell(`${col}${i}`).value = null
            })
        }
    }

    // Records start at Row 6
    let lastRow = 5
    if (records && records.length > 0) {
        let currentRow = 6

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        records.forEach((rec: any) => {
            const date = new Date(rec.attendance_records.date) // 'YYYY-MM-DD'
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`

            // Col A: Date
            sheet.getCell(`A${currentRow}`).value = formattedDate
            // Col B: Origin
            sheet.getCell(`B${currentRow}`).value = rec.origin
            // Col C: Fixed ~
            sheet.getCell(`C${currentRow}`).value = '～'
            // Col D: Destination
            sheet.getCell(`D${currentRow}`).value = rec.destination
            // Col E: Method
            sheet.getCell(`E${currentRow}`).value = rec.transport_method
            // Col F: Route Type
            sheet.getCell(`F${currentRow}`).value = rec.route_type
            // Col G: Amount
            sheet.getCell(`G${currentRow}`).value = rec.amount

            lastRow = currentRow
            currentRow++
        })
    }

    // Update Total Formula in B3 (Sum of Column G)
    // The template has it at B3. Formula: SUM(G6:G28)
    // We update it to SUM(G6:G<lastRow>)
    // If no records, lastRow is 5, so SUM(G6:G5) which is valid (0) or empty.
    // Ensure we start at least at 6 for range if lastRow < 6 (empty)
    const endRow = Math.max(lastRow, 6)
    sheet.getCell('B3').value = { formula: `SUM(G6:G${endRow})` }

    // 6. Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // 7. Return Response with Filename
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filename = `${(targetProfile as any)?.full_name || 'unknown'}_立替交通費精算書.xlsx`
    // Encode filename for header
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
