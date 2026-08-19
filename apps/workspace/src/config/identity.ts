const IDENTITY_SERVICE_CALL=process.env.IDENTITY_SERVICE_URL
export async function verifyUserExists(userId:string) {
  const response=await fetch(`${IDENTITY_SERVICE_CALL}/internal/users/${userId}`)
  if(!response.ok){
    return false;
  }
  return true;
}