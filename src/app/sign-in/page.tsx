import { signIn } from "@/auth";
import { loginAsDemoOfficer } from "@/server/actions/demo-login";

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ callbackUrl?: string }>;
}) {
	const { callbackUrl } = await searchParams;

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border">
				<div className="mb-8">
					<h1 className="text-2xl font-semibold text-gray-900">Ingresar</h1>
					<p className="mt-2 text-sm text-gray-500">
						Ingresa tu correo electrónico. Te enviaremos un enlace de acceso.
					</p>
				</div>

				<form
					action={async (formData: FormData) => {
						"use server";
						const email = formData.get("email") as string;
						await signIn("resend", {
							email,
							redirectTo: callbackUrl ?? "/",
						});
					}}
					className="space-y-4"
				>
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Correo electrónico
						</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							autoComplete="email"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="nombre@correo.com"
						/>
					</div>

					<button
						type="submit"
						className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
					>
						Enviar enlace de acceso
					</button>
				</form>
				{process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
					<div className="mt-8 pt-8 border-t border-gray-100">
						<p className="text-xs text-gray-500 uppercase tracking-wide text-center mb-3">
							¿Eres reclutador o quieres explorar?
						</p>
						<form action={loginAsDemoOfficer}>
							<button
								type="submit"
								className="w-full text-left px-4 py-3 cursor-pointer rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
							>
								<p className="text-sm font-medium text-blue-900">
									Ingresar como Suboficial (DEMO)
								</p>
								<p className="text-xs text-blue-600 mt-0.5">
									Acceso instantáneo a la consola del oficial, sin registro ni
									correo.
								</p>
							</button>
						</form>
						<p className="text-xs text-gray-400 text-center mt-3">
							Los datos de demostración son ficticios.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
