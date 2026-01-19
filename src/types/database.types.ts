export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    role: 'admin' | 'employee'
                    username: string | null
                    contact_email: string | null
                    department_id: string | null
                    hourly_wage: number | null
                    commuter_pass_price: number | null
                    created_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    role?: 'admin' | 'employee'
                    username?: string | null
                    contact_email?: string | null
                    hourly_wage?: number | null
                    commuter_pass_price?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    role?: 'admin' | 'employee'
                    username?: string | null
                    contact_email?: string | null
                    hourly_wage?: number | null
                    commuter_pass_price?: number | null
                    created_at?: string
                }
            }
            attendance_records: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    clock_in: string | null
                    clock_out: string | null
                    transport_route: string | null
                    transport_cost: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    date?: string
                    clock_in?: string | null
                    clock_out?: string | null
                    transport_route?: string | null
                    transport_cost?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    clock_in?: string | null
                    clock_out?: string | null
                    transport_route?: string | null
                    transport_cost?: number | null
                    created_at?: string
                }
            }
            break_records: {
                Row: {
                    id: string
                    attendance_record_id: string
                    start_time: string
                    end_time: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    attendance_record_id: string
                    start_time: string
                    end_time?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    attendance_record_id?: string
                    start_time?: string
                    end_time?: string | null
                    created_at?: string
                }
            }
            departments: {
                Row: {
                    id: string
                    name: string
                    code: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    code: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    code?: string
                    created_at?: string
                }
            }
            transportation_records: {
                Row: {
                    id: string
                    attendance_record_id: string
                    origin: string
                    destination: string
                    transport_method: string
                    route_type: '片道' | '往復'
                    amount: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    attendance_record_id: string
                    origin: string
                    destination: string
                    transport_method: string
                    route_type: '片道' | '往復'
                    amount?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    attendance_record_id?: string
                    origin?: string
                    destination?: string
                    transport_method?: string
                    route_type?: '片道' | '往復'
                    amount?: number
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
