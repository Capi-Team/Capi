
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()");
    return NextResponse.json({
      success: true,
      time: result.rows[0],
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "DB connection failed",
    });
  }
}