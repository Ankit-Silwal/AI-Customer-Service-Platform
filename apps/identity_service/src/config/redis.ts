import {createClient} from "redis"

if(!process.env.REDIS_CLIENT_URL){
  throw new Error("Please provide the redis url ")
}
const REDIS_CLIENT=createClient({
  url:process.env.REDIS_CLIENT_URL
})

REDIS_CLIENT.on("connect",()=>{
  console.log("Connected to the redis")
})

REDIS_CLIENT.on("error",(err)=>{
  console.error("REDIS_CLIENT error",err);
})

export async function connect_redis(){
  if(!REDIS_CLIENT.isOpen){
    await REDIS_CLIENT.connect();
  }
}

export function isRedisConnected() {
  return REDIS_CLIENT.isOpen;
}

export default REDIS_CLIENT;