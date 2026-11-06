export const toId=(value)=>{
  const n=Number(value);
  return Number.isInteger(n) && n>0? n : null;
}
