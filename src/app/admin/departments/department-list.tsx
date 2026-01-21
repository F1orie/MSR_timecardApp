'use client'

import { useActionState } from 'react'
import { createDepartment } from './actions'

const initialState = {
    error: '',
    success: false,
}

export function DepartmentList({ departments }: { departments: any[] }) {
    // @ts-expect-error - useActionState type mismatch
    const [state, formAction, isPending] = useActionState(createDepartment, initialState)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4">登録済み所属 (企業)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400">
                                <th className="p-4">所属名</th>
                                <th className="p-4">所属コード</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {departments.map((dept) => (
                                <tr key={dept.id} className="text-gray-300 hover:bg-white/5">
                                    <td className="p-4 font-medium text-white">{dept.name}</td>
                                    <td className="p-4 font-mono text-purple-300">{dept.code}</td>
                                </tr>
                            ))}
                            {departments.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="p-4 text-center text-gray-500">
                                        所属が見つかりません。
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="lg:col-span-1 glass-panel p-6 sticky top-6 h-fit">
                <h3 className="text-lg font-semibold text-white mb-4">所属情報</h3>
                <div className="text-gray-400 text-sm">
                    <p className="mb-4">
                        所属コードは企業ごとに発行されます。
                        管理画面からの変更・追加はできません。
                    </p>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-purple-400 mb-1">現在の所属コード</p>
                        <p className="text-xl font-mono text-white">
                            {departments[0]?.code || '-'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
