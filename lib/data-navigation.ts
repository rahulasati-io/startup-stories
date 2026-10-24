export const DATA_CATEGORIES=['Economy Data','Monetary Policy Data','Market Data','Trade Data'] as const;
export function dataCategoryId(name:string){return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function dataCategoryHref(name:string){return `/data#${dataCategoryId(name)}`;}
