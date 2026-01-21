import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import StatusSelector from './status-selector'

interface Request {
    id: string
    created_at: string
    user_id: string
    type: string
    content: string
    status: string
    profiles: {
        full_name: string | null
        username: string | null
    }
}

export default async function RequestsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Admin check (also handled in layout, but double check)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((profile as any)?.role !== 'admin') {
        redirect('/')
    }

    const { data: requests } = await supabase
        .from('requests')
        .select(`
            *,
            profiles:user_id (
                full_name,
                username
            )
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="container mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">申請管理</h1>

            <div className="glass-panel overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-800 text-gray-400">
                        <tr>
                            <th className="p-4">日時</th>
                            <th className="p-4">氏名</th>
                            <th className="p-4">種別</th>
                            <th className="p-4">内容</th>
                            <th className="p-4">ステータス</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {requests?.map((req: Request) => (
                            <tr key={req.id} className="hover:bg-white/5 transition-colors text-gray-300">
                                <td className="p-4 whitespace-nowrap">
                                    {new Date(req.created_at).toLocaleString()}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    {req.profiles.full_name || req.profiles.username}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${req.type === 'attendance' ? 'bg-blue-500/20 text-blue-400' :
                                        req.type === 'password' ? 'bg-red-500/20 text-red-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {req.type === 'attendance' ? '勤怠修正' :
                                            req.type === 'password' ? 'パスワード' : 'その他'}
                                    </span>
                                </td>
                                <td className="p-4 max-w-md break-words">
                                    {req.content}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <StatusSelector
                                            requestId={req.id}
                                            currentStatus={req.status}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!requests || requests.length === 0) && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    申請はありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
