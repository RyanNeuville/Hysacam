import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function promoteUsers() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env variables')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Update all users to have 'admin' role to unblock development
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'admin', is_blocked: false })
    .neq('role', 'admin') // Only those who are NOT already admin
  
  if (error) {
    console.error('Erreur lors de la promotion des utilisateurs :', error.message)
    console.log('NOTE: Si RLS est activé, vous devez faire cette mise à jour depuis le dashboard Supabase SQL.')
  } else {
    console.log('Succès ! Tous les utilisateurs ont été promus "admin".')
    console.log('Vous devriez maintenant pouvoir accéder au dashboard.')
  }
}

promoteUsers()
