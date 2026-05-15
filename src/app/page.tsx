import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
	const session = await auth();
	const isOfficer =
		session &&
		[
			"officer",
			"comisario",
			"regional_commander",
			"internal_affairs",
			"admin",
		].includes(session.user.role);

	return (
		<div className="min-h-screen">
			<section className="bg-white border-b border-gray-100">
				<div className="max-w-4xl mx-auto px-4 py-20 text-center">
					<div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
						<span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
						Proyecto de portafolio inspirado en SIDPOL, PNP
					</div>
					<h1 className="text-4xl font-semibold text-gray-900 mb-4 leading-tight">
						Denuncias policiales con
						<span className="text-blue-600"> integridad verificable</span>
					</h1>
					<p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
						Registra una denuncia desde tu teléfono, sigue su estado en tiempo
						real, y verifica criptográficamente que nadie ha alterado el
						historial.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Link
							href="/denunciar"
							className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
						>
							Registrar una denuncia
						</Link>
						<Link
							href="/track"
							className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
						>
							Consultar mi denuncia
						</Link>
					</div>
				</div>
			</section>

			<section className="max-w-5xl mx-auto px-4 py-16">
				<div className="grid md:grid-cols-3 gap-6">
					<div className="bg-white rounded-xl border p-6">
						<div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
							<svg
								className="w-5 h-5 text-blue-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<h3 className="font-semibold text-gray-900 mb-2">
							Registro íntegro
						</h3>
						<p className="text-sm text-gray-500 leading-relaxed">
							Cada evento en una denuncia está encadenado criptográficamente.
							Cualquier alteración posterior es detectable públicamente.
						</p>
						<Link
							href="/verify"
							className="text-xs text-blue-600 hover:underline mt-3 inline-block"
						>
							Verificar una denuncia →
						</Link>
					</div>

					<div className="bg-white rounded-xl border p-6">
						<div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
							<svg
								className="w-5 h-5 text-green-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						</div>
						<h3 className="font-semibold text-gray-900 mb-2">
							Seguimiento ciudadano
						</h3>
						<p className="text-sm text-gray-500 leading-relaxed">
							Con tu código único puedes ver en qué estado está tu denuncia y
							las notas públicas del oficial asignado.
						</p>
						<Link
							href="/track"
							className="text-xs text-blue-600 hover:underline mt-3 inline-block"
						>
							Consultar estado →
						</Link>
					</div>

					<div className="bg-white rounded-xl border p-6">
						<div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
							<svg
								className="w-5 h-5 text-purple-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						</div>
						<h3 className="font-semibold text-gray-900 mb-2">Datos abiertos</h3>
						<p className="text-sm text-gray-500 leading-relaxed">
							Estadísticas de criminalidad por distrito, tipo de delito y
							tendencia mensual — anonimizadas y accesibles para todos.
						</p>
						<Link
							href="/dashboard"
							className="text-xs text-blue-600 hover:underline mt-3 inline-block"
						>
							Ver estadísticas →
						</Link>
					</div>
				</div>
			</section>

			<section className="bg-white border-t border-b border-gray-100">
				<div className="max-w-4xl mx-auto px-4 py-14">
					<div className="grid md:grid-cols-2 gap-12 items-center">
						<div>
							<p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
								Contexto
							</p>
							<h2 className="text-2xl font-semibold text-gray-900 mb-4">
								Diseñado para mejorar lo que SIDPOL no resolvió
							</h2>
							<p className="text-gray-500 text-sm leading-relaxed mb-4">
								SIDPOL, el sistema digital de denuncias de la PNP desde 2006,
								clasificó todos sus datos como reservados en agosto de 2025 —
								quitando el acceso público a información que debería ser
								transparente.
							</p>
							<p className="text-gray-500 text-sm leading-relaxed">
								DenunciApp propone un modelo alternativo: datos de eventos
								verificables criptográficamente, estadísticas públicas
								anonimizadas, y seguimiento ciudadano sin necesidad de ir a una
								comisaría.
							</p>
						</div>
						<div className="space-y-3">
							{[
								{ label: "Datos clasificados por PNP en 2025", resolved: true },
								{
									label: "Sin seguimiento ciudadano en tiempo real",
									resolved: true,
								},
								{
									label: "Registros alterables sin trazabilidad",
									resolved: true,
								},
								{
									label: "Sin estadísticas públicas por distrito",
									resolved: true,
								},
							].map(item => (
								<div
									key={item.label}
									className="flex items-center gap-3 text-sm"
								>
									<div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center shrink-0">
										<svg
											className="w-3 h-3 text-green-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={3}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</div>
									<span className="text-gray-600">{item.label}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{isOfficer && (
				<section className="max-w-5xl mx-auto px-4 py-10">
					<div className="bg-blue-600 rounded-xl p-6 flex items-center justify-between">
						<div>
							<p className="text-white font-semibold mb-1">
								Bienvenido, {session?.user.name ?? "Oficial"}
							</p>
							<p className="text-blue-200 text-sm">
								Tienes acceso a la consola de gestión de denuncias.
							</p>
						</div>
						<Link
							href="/officer"
							className="bg-white text-blue-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shrink-0"
						>
							Ir a la consola →
						</Link>
					</div>
				</section>
			)}

			{/* Footer */}
			<footer className="max-w-6xl mx-auto px-4 py-8 mt-8 border-t border-gray-100">
				<div className="flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-xs text-gray-400">
						DenunciApp — Proyecto de cartera de Diego Tuesta. No es un sistema
						oficial de la PNP.
					</p>
					<div className="flex items-center gap-4 text-xs text-gray-400">
						<Link href="/dashboard" className="hover:text-gray-600">
							Estadísticas
						</Link>
						<Link href="/verify" className="hover:text-gray-600">
							Verificar
						</Link>
						<Link href="/track" className="hover:text-gray-600">
							Seguimiento
						</Link>
						<a
							href="https://github.com/diegotuesta25/denunciapp"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-gray-600"
						>
							GitHub
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
