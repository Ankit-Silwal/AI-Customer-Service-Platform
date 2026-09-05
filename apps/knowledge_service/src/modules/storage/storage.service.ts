import { randomUUID } from "node:crypto";
import { supabase } from "../../config/supabase.js";
const bucket=process.env.SUPABASE_BUCKET
if(!bucket){
  throw new Error("Supabase bucket isnt provided")
}

export async function uploadFile(file:Express.Multer.File) {
  const storageKey=`${randomUUID()}-${file.originalname}`
  const {error}=await supabase.storage.from(bucket!)
  .upload(storageKey,file.buffer,{
    contentType:file.mimetype,
    upsert:false
  })
  if(error){
    throw new Error(`Supabase upload failed:${error.message}`)
  }
  return storageKey;
}