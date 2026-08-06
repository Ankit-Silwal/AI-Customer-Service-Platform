import REDIS_CLIENT from "../../config/redis.js";
import { generateOtp } from "../../utils/createOtp.js";
import type { OTP_RESPONSE } from "./otp.types.js";

const OTP_TTL=300;

export async function generateAndStoreOtp(userId:string):Promise<string>{
  const otp=generateOtp();
  const key=`verify:otp:${userId}`
  await REDIS_CLIENT.set(key,otp,{EX:OTP_TTL})
  return otp;
}

export async function verifyAndConsumeOtp(userId:string,submittedOtp:string):Promise<OTP_RESPONSE>{
  const key=`verify:otp:${userId}`;
  const stored=await REDIS_CLIENT.get(key)
  if(!stored){
    return({
      success:false,
      message:"Please try new otp the old one is depricated"
    })
  }
  if(stored!=submittedOtp){
    return({
      success:false,
      message:"The OTP doesnt match sir"
    });
  }
  await REDIS_CLIENT.del(key)
  return({
    success:true,
    message:"OTP verified successfully",
    userId,
  })
}