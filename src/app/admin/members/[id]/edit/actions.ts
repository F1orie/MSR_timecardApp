'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateMember(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const id = formData.get('id') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as 'admin' | 'employee'
    const hourlyWage = parseInt(formData.get('hourlyWage') as string) || 0
    const commuterPassPrice = parseInt(formData.get('commuterPassPrice') as string) || 0
    const contactEmail = formData.get('contactEmail') as string

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            role,
            hourly_wage: hourlyWage,
            commuter_pass_price: commuterPassPrice,
            contact_email: contactEmail
        })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/members')
    redirect('/admin/members')
}
