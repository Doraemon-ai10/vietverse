const BLOCKED = ['đụ','địt','đm','dmm','đmm','đéo','đell','đĩ','đỉ','lồn','loz','cặc','cac','buồi','vcl','vl','cc','óc chó','ngu lồn','đồ chó','chó chết','fuck','shit','bitch','dick','pussy']

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[\s._-]+/g,'')

export function moderateVietnamese(text: string) {
  const normalized = normalize(text)
  const blocked = BLOCKED.some(word => normalized.includes(normalize(word)))
  return {blocked,text:blocked ? text.replace(/\S/g,'•') : text}
}
