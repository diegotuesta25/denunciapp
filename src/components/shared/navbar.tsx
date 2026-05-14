import Link from "next/link";
import { auth } from "@/auth";
import { signOut } from "@/auth";
import { NavLink } from "./nav-link";

export async function Navbar() {
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
		<header className="bg-white border-b border-gray-100 sticky top-0 z-50">
			<div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
				<Link
					href="/"
					className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
				>
					<div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
						<span className="text-white text-xs font-bold">D</span>
					</div>
					DenunciApp
				</Link>

				<nav className="hidden md:flex items-center gap-1">
					<NavLink href="/dashboard">Estadísticas</NavLink>
					<NavLink href="/track">Seguimiento</NavLink>
					<NavLink href="/verify">Verificar</NavLink>
					{isOfficer && <NavLink href="/officer">Consola</NavLink>}
				</nav>

				<div className="flex items-center gap-2">
					{session ? (
						<div className="flex items-center gap-3">
							<span className="text-xs text-gray-400 hidden md:block">
								{session.user.name ?? session.user.email}
							</span>
							<form
								action={async () => {
									"use server";
									await signOut({ redirectTo: "/" });
								}}
							>
								<button
									type="submit"
									className="text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Salir
								</button>
							</form>
						</div>
					) : (
						<Link
							href="/sign-in"
							className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Ingresar
						</Link>
					)}

					<Link
						href="/denunciar"
						className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
					>
						Hacer denuncia
					</Link>
				</div>
			</div>
		</header>
	);
}
