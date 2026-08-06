import REDIS_CLIENT from "../../config/redis.js";
import { generateOtp } from "../../utils/createOtp.js";

const OTP_TTL=300;

export async function generateAndStoreOtp(userId:string):Promise<string>{
  const otp=generateOtp();
  const key=`verify:otp:${userId}`
  await REDIS_CLIENT.set(key,otp,{EX:OTP_TTL})
  return otp;
}
