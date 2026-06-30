import { NextResponse } from "next/server";
import { getMobilesFromSheets } from "@/lib/sheets";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getMobilesFromSheets();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/moviles] Error:", error);
    return NextResponse.json(
      { error: "No se pudo obtener los datos" },
      { status: 500 }
    );
  }
}
