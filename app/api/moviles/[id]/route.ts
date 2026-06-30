import { NextResponse } from "next/server";
import { getMobileById } from "@/lib/sheets";

export const revalidate = 60;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const mobile = await getMobileById(params.id);

    if (!mobile) {
      return NextResponse.json(
        { error: "Móvil no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mobile,
      updatedAt: new Date().toISOString(),
      source: "sheets" as const,
    });
  } catch (error) {
    console.error("[api/moviles/[id]] Error:", error);
    return NextResponse.json(
      { error: "No se pudo obtener el móvil" },
      { status: 500 }
    );
  }
}
