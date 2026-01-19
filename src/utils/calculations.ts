import { differenceInMinutes } from 'date-fns'

export interface BreakRecord {
    start_time: string
    end_time: string | null
}

export interface AttendanceRecord {
    clock_in: string | null
    clock_out: string | null
    break_records: BreakRecord[]
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

/**
 * Format minutes into "HH:MM" string
 */
export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}時間${m}分`
}
