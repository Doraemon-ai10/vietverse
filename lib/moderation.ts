const BLOCKED = ['đụ','địt','đm','dmm','đmm','đéo','đell','đĩ','đỉ','lồn','loz','cặc','cac','buồi','vcl','vl','cc','óc chó','ngu lồn','đồ chó','chó chết','fuck','shit','bitch','dick','pussy']

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[\s._-]+/g,'')

export function moderateVietnamese(text: string) {
  let result = text
  let blocked = false
  for (const word of BLOCKED) {
    const plain = normalize(word)
    if (!plain) continue
    const pattern = plain.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[\\s._-]*')
    const re = new RegExp(pattern,'gi')
    if (re.test(normalize(result))) blocked = true
    result = result.replace(re,'•••')
  }
  return {blocked,text:result}
}
