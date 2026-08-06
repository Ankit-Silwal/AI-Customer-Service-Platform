import bcrypt from "bcrypt"
import { checkStrongPassword } from "../../checkPassword.js";
import type { registerUserType } from "./auth.types.js";
import type { loginUserType, verifyRegisterOtpType } from "./auth.types.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUserEmail,
} from "./auth.repository.js";
import { generateAndStoreOtp, verifyAndConsumeOtp } from "../otp/otp.manager.js";
import { sendRegisterMail } from "../../utils/sendingOtp.js";


export async function registerUser(data:registerUserType){
  const {name,email,password,conformPassword}=data;
  if(!name || !email|| !password ||!conformPassword){
    throw new Error("You need to pass all the required body ie name,email,password,conformPassword")
  }
  if(password!=conformPassword){
    throw new Error("The password doesn't match");
  }
  const passwordCheck=checkStrongPassword(password);
  if(!passwordCheck.isStrong){
    throw new Error(passwordCheck.errors.join(", "))
  } 
  const existingUser=await findUserByEmail(email);
  if(existingUser){
    throw new Error("User exists with this email id sir")
  }
  const hashedPass=await bcrypt.hash(password,10);
  const user=await createUser({
    name,
    email,
    password:hashedPass
  })
  const otp=await generateAndStoreOtp(user.id);
  await sendRegisterMail({
    to: user.email,
    otp,
  });
  return {
    user,
    message: "Registration successful. OTP sent to email.",
  };
}

export async function loginUser(data: loginUserType) {
  const { email, password } = data;
  if (!email || !password) {
    throw new Error("You need to pass email and password")
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("User not found")
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials")
  }

  if (!user.isEmailVerified) {
    throw new Error("Please verify your email before login")
  }

  return {
    user,
    message: "Login successful",
  };
}

export async function verifyRegisterOtp(data: verifyRegisterOtpType) {
  const { userId, otp } = data;

  if (!userId || !otp) {
    throw new Error("You need to pass userId and otp")
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found")
  }

  const otpResult = await verifyAndConsumeOtp(userId, otp);
  if (!otpResult.success) {
    throw new Error(otpResult.message)
  }

  const verifiedUser = await verifyUserEmail(userId);
  return {
    user: verifiedUser,
    message: otpResult.message,
  };
}