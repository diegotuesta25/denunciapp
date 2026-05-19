"use client";
import { useState } from "react";
import Link from "next/link";

type Props = {
	isOfficer: boolean;
	isLoggedIn: boolean;
	signOutAction?: () => Promise<void>;
};

export function MobileMenu({ isOfficer, isLoggedIn, signOutAction }: Props) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="md:hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
				aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
				aria-expanded={isOpen}
			>
				{isOpen ? (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				) : (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				)}
			</button>

			{isOpen && (
				<div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50 px-4 py-3 space-y-1">
					<Link
						href="/estadisticas"
						onClick={() => setIsOpen(false)}
						className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
					>
						Estadísticas
					</Link>
					<Link
						href="/seguimiento"
						onClick={() => setIsOpen(false)}
						className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
					>
						Seguimiento
					</Link>
					<Link
						href="/verificar"
						onClick={() => setIsOpen(false)}
						className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
					>
						Verificar
					</Link>
					{isOfficer && (
						<Link
							href="/officer"
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
						>
							Consola
						</Link>
					)}

					<div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
						<Link
							href="/denunciar"
							onClick={() => setIsOpen(false)}
							className="block px-3 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium text-center"
						>
							Registrar denuncia
						</Link>

						{isLoggedIn ? (
							<form
								action={async () => {
									setIsOpen(false);
									await signOutAction?.();
								}}
							>
								<button
									type="submit"
									className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
								>
									Salir
								</button>
							</form>
						) : (
							<Link
								href="/sign-in"
								onClick={() => setIsOpen(false)}
								className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 text-center"
							>
								Ingresar
							</Link>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
