import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkUsers() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env variables')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, name, is_blocked')
  
  if (error) {
    console.error('Error fetching users:', error.message)
    return
  }

  console.log('--- Liste des utilisateurs et leurs rôles ---')
  console.table(users)
}

checkUsers()
