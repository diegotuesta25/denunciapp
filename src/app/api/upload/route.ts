import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ALLOWED_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/heic",
	"application/pdf",
	"audio/mpeg",
	"audio/mp4",
	"audio/wav",
	"video/mp4",
	"video/quicktime",
];

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request): Promise<NextResponse> {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			return NextResponse.json(
				{ error: "Tipo de archivo no permitido" },
				{ status: 400 },
			);
		}

		if (file.size > MAX_BYTES) {
			return NextResponse.json(
				{ error: "Archivo demasiado grande" },
				{ status: 400 },
			);
		}

		const session = await auth();

		const blob = await put(file.name, file, {
			access: "public",
			addRandomSuffix: true,
		});

		return NextResponse.json({
			url: blob.url,
			pathname: blob.pathname,
		});
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Error al subir el archivo" },
			{ status: 500 },
		);
	}
}
