
/**
 * Generates a Supabase Auth compatible email address from a username and department code.
 * Since Supabase Auth (and emails in general) do not support non-ASCII characters in the local part,
 * and we want to allow Japanese User IDs, we Hex-encode the username.
 * 
 * Format: {hex_encoded_username}@{dept_code}.local
 */
export function generateAuthEmail(username: string, deptCode: string): string {
    const encodedUsername = Buffer.from(username, 'utf-8').toString('hex')
    return `${encodedUsername}@${deptCode}.local`
}
