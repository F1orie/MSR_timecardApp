import { differenceInMinutes } from 'date-fns'

export interface BreakRecord {
    start_time: string
    end_time: string | null
}

export interface AttendanceRecord {
    user_id?: string
    date?: string // YYYY-MM-DD
    clock_in: string | null
    clock_out: string | null
    break_records: BreakRecord[]
    is_telework?: boolean | null
}

export interface DailyStats {
    workMinutes: number
    weekdayMinutes: number
    saturdayMinutes: number
    sundayMinutes: number
    lateNightMinutes: number
}

export function calculateDailyStats(record: AttendanceRecord): DailyStats {
    const workMinutes = calculateWorkDurationMinutes(record)
    const lateNightMinutes = calculateLateNightWorkMinutes(record)

    let weekdayMinutes = 0
    let saturdayMinutes = 0
    let sundayMinutes = 0

    if (record.date) {
        const holidayType = isHoliday(record.date)
        if (holidayType === 'Saturday') {
            saturdayMinutes = workMinutes
        } else if (holidayType === 'Sunday') {
            sundayMinutes = workMinutes
        } else {
            weekdayMinutes = workMinutes
        }
    } else {
        weekdayMinutes = workMinutes
    }

    return {
        workMinutes,
        weekdayMinutes,
        saturdayMinutes,
        sundayMinutes,
        lateNightMinutes
    }
}

/**
 * Calculate total break duration in minutes
 */
export function calculateBreakDurationMinutes(breaks: BreakRecord[]): number {
    return breaks.reduce((total, record) => {
        if (record.start_time && record.end_time) {
            return total + differenceInMinutes(new Date(record.end_time), new Date(record.start_time))
        }
        return total
    }, 0)
}

/**
 * Calculate total work duration in minutes (Clock Out - Clock In - Breaks)
 */
export function calculateWorkDurationMinutes(record: AttendanceRecord): number {
    if (!record.clock_in || !record.clock_out) return 0

    const totalDuration = differenceInMinutes(new Date(record.clock_out), new Date(record.clock_in))
    const breakDuration = calculateBreakDurationMinutes(record.break_records || [])

    return Math.max(0, totalDuration - breakDuration)
}

/**
 * Calculate wage based on minutes worked and hourly wage
 */
export function calculateWage(minutes: number, hourlyWage: number): number {
    const hours = minutes / 60
    return Math.floor(hours * hourlyWage)
}

export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}時間${m}分`
}

/**
 * Calculate late night work minutes (22:00 - 05:00 usually, but user said 22:00 - 07:00)
 * User Rule: 22:00 - 07:00
 */
export function calculateLateNightWorkMinutes(record: AttendanceRecord): number {
    if (!record.clock_in || !record.clock_out) return 0

    const start = new Date(record.clock_in)
    const end = new Date(record.clock_out)

    // We need to handle cross-day shifts? 
    // Assuming simple case first or shifts that might cross midnight.
    // Range is 22:00 (prev day?) to 07:00 (next day?).
    // Usually standard day shift: 09:00 - 18:00. No late night.
    // Late sift: 20:00 - 02:00. Late night 22:00 - 02:00.

    // To simplify, we calculate overlap of [start, end] with [22:00, 24:00] + [00:00, 07:00] (next day)
    // Actually, simple Logic: Iterate minutes or use intervals.

    // Let's use a simpler approach since we might not have date-fns-interval
    // Convert everything to timestamps?

    // Let's assume start and end are correct Date objects.
    let totalLateMinutes = 0
    const current = new Date(start)

    // Loop minute by minute? No, too slow.
    // Intersect logic.
    // Segments of interest for a given day YYYY-MM-DD:
    // 1. YYYY-MM-DD 00:00 - 07:00 (Early morning)
    // 2. YYYY-MM-DD 22:00 - 24:00 (Night)
    // And if shift spans multiple days, check next day's 00:00-07:00 etc.

    // However, `clock_in` and `clock_out` have dates.
    // We just check overlap with "Late Night Zones".

    // Create Late Night Zones relevant to the shift
    // Zone 1: [ShiftStartDay 00:00, ShiftStartDay 07:00]
    // Zone 2: [ShiftStartDay 22:00, ShiftStartDay+1 07:00] -- Wait, 22:00 to 07:00 continues.
    // It's easier to say: Any time T is late if (H >= 22 || H < 7).

    // Note: Deduct breaks!
    // This is complex. If break is during late night, it shouldn't count.

    // Quick approximation:
    // Total Work Minutes in Late Zone.
    // If break overlaps Late Zone, subtract it.

    return calculateMinutesInZone(start, end, record.break_records || [])
}

function calculateMinutesInZone(start: Date, end: Date, breaks: BreakRecord[]): number {
    let minutes = 0
    let current = new Date(start)
    // Round up/down to nearest minute?
    current.setSeconds(0, 0)

    const endTime = new Date(end)
    endTime.setSeconds(0, 0)

    while (current < endTime) {
        const h = current.getHours()
        // Target: 22:00 ~ 07:00 (i.e. >= 22 or < 7)
        if (h >= 22 || h < 7) {
            // Check if inside any break
            const inBreak = breaks.some(b => {
                if (!b.start_time) return false
                const bStart = new Date(b.start_time)
                const bEnd = b.end_time ? new Date(b.end_time) : new Date() // shouldn't happen for closed records
                return current >= bStart && current < bEnd
            })

            if (!inBreak) {
                minutes++
            }
        }
        current.setMinutes(current.getMinutes() + 1)
    }
    return minutes
}

export function isHoliday(dateStr: string): 'Saturday' | 'Sunday' | null {
    const date = new Date(dateStr)
    const day = date.getDay()
    if (day === 0) return 'Sunday'
    if (day === 6) return 'Saturday'
    return null
}
