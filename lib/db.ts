import {Pool} from 'pg';
let pool:Pool|undefined;
export function db(){if(!pool){pool=new Pool({connectionString:process.env.DATABASE_URL,max:10});}return pool;}