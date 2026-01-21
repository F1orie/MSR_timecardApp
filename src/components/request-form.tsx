'use client'

import { useState } from 'react'
import { submitRequest } from '@/features/requests/actions'
import * as Dialog from '@radix-ui/react-dialog'
import { X, MessageSquarePlus } from 'lucide-react'

export function RequestForm() {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        setError('')

        const result = await submitRequest(formData)

        if (result?.error) {
            setError(result.error)
        } else {
            setOpen(false)
            // Optional: Show success toast
        }
        setIsSubmitting(false)
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700">
                    <MessageSquarePlus size={20} />
                    <span>申請・問い合わせ</span>
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl z-50">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-bold text-white">申請・問い合わせ</Dialog.Title>
                        <Dialog.Close className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </Dialog.Close>
                    </div>

                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">種別</label>
                            <select
                                name="type"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            >
                                <option value="attendance">勤怠修正</option>
                                <option value="password">パスワード関連</option>
                                <option value="other">その他</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">内容</label>
                            <textarea
                                name="content"
                                rows={4}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="修正内容や問い合わせ詳細を入力してください..."
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Dialog.Close asChild>
                                <button type="button" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                                    キャンセル
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                            >
                                {isSubmitting ? '送信中...' : '送信する'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
