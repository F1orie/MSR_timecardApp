import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
            departments (
                name
            )
        `)
        .eq('id', user.id)
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((profile as any)?.role !== 'admin') {
        redirect('/')
    }

    return (
        <div className="flex h-screen bg-slate-900">
            {/* Sidebar */}
            <aside className="w-64 glass-panel m-4 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                        管理画面
                    </h2>
                    {profile?.departments?.name && (
                        <div className="mt-2 text-sm text-gray-400 font-medium">
                            {profile.departments.name}
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <a href="/admin" className="block px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                        ダッシュボード
                    </a>
                    <a href="/admin/members" className="block px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                        従業員管理
                    </a>
                    {/* 部署管理はシングルテナント仕様のため非表示 */}
                    <a href="/admin/attendance" className="block px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                        勤怠管理
                    </a>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <form action={async () => {
                        'use server'
                        const sb = await createClient()
                        await sb.auth.signOut()
                        redirect('/login')
                    }}>
                        <button className="w-full px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                            ログアウト
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-auto">
                {children}
            </main>
        </div>
    )
}
