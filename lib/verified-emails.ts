const globalForVerified=globalThis as typeof globalThis & {__vietverseVerified?:Map<string,number>}
export const verifiedEmails=globalForVerified.__vietverseVerified ?? new Map<string,number>()
if(!globalForVerified.__vietverseVerified) globalForVerified.__vietverseVerified=verifiedEmails
