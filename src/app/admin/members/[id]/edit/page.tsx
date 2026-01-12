import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { EditMemberForm } from './edit-member-form'

export default async function EditMemberPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (!profile) {
        notFound()
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Edit Member</h1>
            <div className="glass-panel p-8">
                <EditMemberForm profile={profile} />
            </div>
        </div>
    )
}
