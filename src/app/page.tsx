import { createClient } from '@/utils/supabase/server'
import Header from '@/components/header'
import { redirect } from 'next/navigation'
import { getTodayAttendance } from '@/features/attendance/actions'
import { getTodayTransportation } from '@/features/transportation/actions'
import { MainActionButtons, BreakActionButtons } from '@/components/attendance-actions'
import { TransportInputForm } from '@/components/transport-input-form'
import { RequestForm } from '@/components/request-form'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      role,
      full_name,
      password_reset_required,
      departments (
        name
      )
    `)
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((profile as any)?.password_reset_required) {
    redirect('/change-password')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (profile as any)?.role || 'employee'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((profile as any)?.role === 'admin') {
    redirect('/admin')
  }

  const attendance = await getTodayAttendance()
  const transportRecords = attendance ? await getTodayTransportation(attendance.id) : []

  // Determine current state
  const isClockedIn = !!attendance?.clock_in
  const isClockedOut = !!attendance?.clock_out
  const activeBreak = attendance?.break_records?.find((b: { end_time: string | null }) => !b.end_time)
  const isOnBreak = !!activeBreak

  // Status Color and Text
  let statusText = '未出勤'
  let statusColor = 'text-gray-400'
  if (isClockedOut) {
    statusText = '退勤済み'
    statusColor = 'text-red-400'
  } else if (isOnBreak) {
    statusText = '休憩中'
    statusColor = 'text-yellow-400'
  } else if (isClockedIn) {
    statusText = '勤務中'
    statusColor = 'text-emerald-400'
  }

  return (
    <main className="min-h-screen bg-black">
      <Header
        user={user}
        role={role}
        departmentName={(profile as any)?.departments?.name}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userName={(profile as any)?.full_name}
      />

      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">本日の勤怠</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Section */}
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-4">
                <span className="text-gray-400">現在の状況</span>
                <span className={`text-3xl font-bold ${statusColor}`}>{statusText}</span>

                <MainActionButtons
                  attendance={attendance}
                  isClockedIn={isClockedIn}
                  isClockedOut={isClockedOut}
                  isOnBreak={isOnBreak}
                />
              </div>

              {/* Controls Section */}
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-4">
                <span className="text-gray-400">休憩操作</span>

                <BreakActionButtons
                  attendance={attendance}
                  isClockedIn={isClockedIn}
                  isClockedOut={isClockedOut}
                  isOnBreak={isOnBreak}
                  activeBreakId={activeBreak?.id}
                />

                <div className="w-full h-px bg-slate-800 my-2" />

                <div className="w-full flex justify-center">
                  <RequestForm />
                </div>

                {attendance?.clock_in && (
                  <div className="mt-4 text-sm text-gray-400">
                    出勤時間: {new Date(attendance.clock_in).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </div>
                )}
              </div>
            </div>

            {/* Transportation Section */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-4 md:col-span-2">
              <div className="w-full">
                {attendance ? (
                  <TransportInputForm
                    attendanceId={attendance.id}
                    currentRecords={transportRecords}
                  />
                ) : (
                  <div className="text-gray-500 text-sm text-center">出勤後に交通費を入力できます</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-white mb-4">休憩履歴</h2>
          {attendance?.break_records && attendance.break_records.length > 0 ? (
            <div className="space-y-2">
              {attendance.break_records.map((br: { id: string, start_time: string, end_time: string | null }) => (
                <div key={br.id} className="flex justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  <span>休憩</span>
                  <div className="space-x-4 text-gray-400">
                    <span>{new Date(br.start_time).toLocaleTimeString()}</span>
                    <span>-</span>
                    <span>{br.end_time ? new Date(br.end_time).toLocaleTimeString() : '継続中'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              本日の休憩はありません
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
