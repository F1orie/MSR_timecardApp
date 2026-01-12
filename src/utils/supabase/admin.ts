import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Note: This client should ONLY be used in Server Actions or API Routes
// NEVER use this on the client side
export const createAdminClient = () => {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
