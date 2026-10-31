const path=require('path');
const {JsonStore}=require('./json-store');
const {PostgresStore}=require('./postgres-store');
async function createStore(root){
  if((process.env.STORAGE_DRIVER||'json').toLowerCase()==='postgres'){
    if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for STORAGE_DRIVER=postgres');
    const s=new PostgresStore({root,databaseUrl:process.env.DATABASE_URL}); await s.init(); return s;
  }
  return new JsonStore({root,seedPath:path.join(root,'data/seed.json'),dbPath:path.join(root,'data/db.json')});
}
module.exports={createStore};
