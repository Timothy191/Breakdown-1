import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({status:'ok',application:'breakdown-control',runtime:'lan-only',ai:false});}