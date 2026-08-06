export type registerUserType={
  name:string,
  email:string,
  password:string,
  conformPassword:string
}

export type loginUserType={
  email:string,
  password:string,
}

export type verifyRegisterOtpType={
  userId:string,
  otp:string,
}