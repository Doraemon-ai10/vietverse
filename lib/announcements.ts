export type Announcement={id:string;title:string;message:string;level:'info'|'success'|'warning'|'event';expiresAt:number;showOnLogin:boolean}
export const defaultAnnouncements:Announcement[]=[{id:'welcome-v2',title:'VietVerse V2',message:'Chào mừng! Bản cập nhật lớn đang được xây dựng.',level:'event',expiresAt:Date.now()+7*24*60*60*1000,showOnLogin:true}]
