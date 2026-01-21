import { createClient } from '@/utils/supabase/server'
import { DepartmentList } from './department-list'

export default async function DepartmentsPage() {
    const supabase = await createClient()

    const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">所属管理</h1>
            <DepartmentList departments={departments || []} />
        </div>
    )
}
