import bcrypt from "bcrypt"
import { checkStrongPassword } from "../../checkPassword.js";
import type { registerUserType } from "./auth.types.js";
import { findUserByEmail, createUser } from "./auth.repository.js";

export async function registerUser(data:registerUserType){
  const {name,email,password,conformPassword}=data;
  if(!name || !email|| !password ||!conformPassword){
    throw new Error("You need to pass all the required body ie name,email,password,conformPassword")
  }
  if(password!=conformPassword){
    throw new Error("The password doesn't match");
  }
  if(!checkStrongPassword(password)){
    throw new Error("The password should be strong ")
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
  return user;
}