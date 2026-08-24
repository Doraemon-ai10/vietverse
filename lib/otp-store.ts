import crypto from 'node:crypto'

type RecordValue={hash:string;expires:number;attempts:number}
const globalForOtp=globalThis as typeof globalThis & {__vietverseOtp?:Map<string,RecordValue>}
export const otpStore=globalForOtp.__vietverseOtp ?? new Map<string,RecordValue>()
if(!globalForOtp.__vietverseOtp) globalForOtp.__vietverseOtp=otpStore
export const hashOtp=(email:string,otp:string)=>crypto.createHash('sha256').update(`${email.toLowerCase()}:${otp}`).digest('hex')
