export const toISO = (dateStr: string, timeStr: string) => {
    if (!timeStr) return null
    return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}
