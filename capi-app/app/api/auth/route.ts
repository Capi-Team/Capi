import { NextRequest, NextResponse } from "next/server";
import { handleLoginBody, handleRegisterBody } from "@/lib/auth/route-handlers";
import { parseAuthAction } from "@/lib/auth/validators";
import { readJsonRecordFromRequest } from "@/lib/http/json";

export async function POST(request: NextRequest) {
  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, message: "Solicitud inválida." },
      { status: 400 }
    );
  }

  const action = parseAuthAction(parsed.body.action);
  if (!action) {
    return NextResponse.json(
      { success: false, message: "Acción de autenticación no soportada." },
      { status: 400 }
    );
  }

  if (action === "register") {
    try {
      return await handleRegisterBody(parsed.body);
    } catch (error) {
      console.error("[auth][register] Unhandled server error", error);
      throw error;
    }
  }

  try {
    return await handleLoginBody(parsed.body);
  } catch (error) {
    console.error("[auth][login] Unhandled server error", error);
    throw error;
  }
}
