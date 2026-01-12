'use client'

import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'

export default function Header({ user, role, departmentName }: { user: any, role?: string, departmentName?: string }) {
    return (
        <header className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 text-white">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Timecard App
                </h1>
                {departmentName && (
                    <span className="text-sm font-medium text-gray-400 border-l border-gray-700 pl-4">
                        {departmentName}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4">
                {role === 'admin' && (
                    <a href="/admin" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                        管理者画面へ
                    </a>
                )}
                <span className="text-sm text-gray-400">
                    {user?.email}
                </span>
                <form action={signOut}>
                    <Button variant="outline" className="text-black dark:text-white border-slate-700 hover:bg-slate-800">
                        Sign Out
                    </Button>
                </form>
            </div>
        </header>
    )
}
