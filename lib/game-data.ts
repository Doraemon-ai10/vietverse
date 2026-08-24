export type Game={id:string;name:string;emoji:string;mode:string;players:number;description:string;status:'online'|'beta'|'coming'}
export const games:Game[]=[
{id:'nhatrang-life',name:'Nha Trang Life',emoji:'🌴',mode:'Roleplay',players:428,description:'Khám phá thành phố biển, phương tiện, nghề nghiệp và nhà riêng.',status:'online'},
{id:'viet-battle',name:'Viet Battle',emoji:'⚔️',mode:'PvP',players:312,description:'Đấu trường free-for-all với kỹ năng, XP và leaderboard.',status:'beta'},
{id:'nong-trai-viet',name:'Nông Trại Việt',emoji:'🌾',mode:'Simulation',players:189,description:'Trồng trọt, nâng cấp đất, thu hoạch và giao dịch.',status:'online'},
{id:'pho-viet-rp',name:'Phố Việt RP',emoji:'🏙️',mode:'Roleplay',players:355,description:'Tạo nhân vật, làm nghề, mua nhà và xây câu chuyện.',status:'online'},
]
