import { createClient } from '@/utils/supabase/server'
import AddMemberForm from './add-member-form'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function MembersPage() {
    const supabase = await createClient()

    // Fetch all profiles
    const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
    // Fetch departments
    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .order('name')

    const profiles = profilesData as Profile[] | null


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">従業員管理</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Member List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">従業員一覧</h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400">
                                        <th className="p-4">氏名</th>
                                        <th className="p-4">役職</th>
                                        <th className="p-4">登録日</th>
                                        <th className="p-4 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {(profiles || []).map((profile) => (
                                        <tr key={profile.id} className="text-gray-300 hover:bg-white/5">
                                            <td className="p-4 font-medium text-white">
                                                <div>{profile.full_name}</div>
                                                <div className="text-xs text-gray-500">{profile.username}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs ${profile.role === 'admin'
                                                    ? 'bg-purple-500/20 text-purple-300'
                                                    : 'bg-cyan-500/20 text-cyan-300'
                                                    }`}>
                                                    {profile.role}
                                                </span>
                                            </td>
                                            <td className="p-4">{new Date(profile.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 text-right">
                                                <a
                                                    href={`/admin/members/${profile.id}/edit`}
                                                    className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                                                >
                                                    編集
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!profiles || profiles.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center text-gray-500">
                                                従業員が見つかりません。
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Add Member Form */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 sticky top-6">
                        <h3 className="text-lg font-semibold text-white mb-4">新規従業員登録</h3>
                        <AddMemberForm departments={departments || []} />
                    </div>
                </div>
            </div>
        </div>
    )
}
