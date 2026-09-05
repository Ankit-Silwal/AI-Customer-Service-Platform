import { createClient } from "@supabase/supabase-js";
const supabaseUrl=process.env.SUPABASE_URL
const supabaseServiceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY
if(!supabaseUrl){
  throw new Error("Plese pass on the supabase url")

}
if(!supabaseServiceRoleKey){
  throw new Error("Supabase servivce role key isnt provided")
}

export const supabase=createClient(
  supabaseUrl,
  supabaseServiceRoleKey
)
