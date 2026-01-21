'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { EditTransportationModal } from './EditTransportationModal'
import { CreateTransportationModal } from './CreateTransportationModal'

interface RecordType {
    id: string
    amount: number
    origin: string
    destination: string
    transport_method: string
    route_type: string
    attendance_records: {
        date: string
    }
}

interface TransportationListProps {
    records: RecordType[]
    userId: string
}

export function TransportationList({ records, userId }: TransportationListProps) {
    const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const handleEdit = (record: RecordType) => {
        setSelectedRecord(record)
        setIsEditModalOpen(true)
    }

    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)

    return (
        <div className="glass-panel p-6">
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                    <span>＋</span> 新規追加
                </button>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                    <tr>
                        <th className="pb-3 pl-4">日付</th>
                        <th className="pb-3">利用区間</th>
                        <th className="pb-3">交通手段</th>
                        <th className="pb-3">区分</th>
                        <th className="pb-3 text-right pr-4">金額</th>
                        <th className="pb-3 text-center">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                    {records.map((rec) => (
                        <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 pl-4 text-gray-400">
                                {new Date(rec.attendance_records.date).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                                {rec.origin} ～ {rec.destination}
                            </td>
                            <td className="py-3">
                                {rec.transport_method}
                            </td>
                            <td className="py-3">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-xs">
                                    {rec.route_type}
                                </span>
                            </td>
                            <td className="py-3 text-right pr-4 font-mono text-emerald-400">
                                ¥{rec.amount.toLocaleString()}
                            </td>
                            <td className="py-3 text-center">
                                <button
                                    onClick={() => handleEdit(rec)}
                                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-blue-400 transition"
                                    title="編集"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="border-t border-gray-700">
                    <tr>
                        <td colSpan={4} className="py-4 pl-4 font-bold text-gray-400 text-right">合計</td>
                        <td className="py-4 pr-4 font-bold text-xl text-emerald-400 text-right">
                            ¥{totalAmount.toLocaleString()}
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            {records.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    この月の交通費記録はありません
                </div>
            )}

            {selectedRecord && (
                <EditTransportationModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    record={selectedRecord}
                />
            )}
            {isCreateModalOpen && (
                <CreateTransportationModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    userId={userId}
                />
            )}
        </div>
    )
}
