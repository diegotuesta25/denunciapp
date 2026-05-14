"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
	href: string;
	children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
	const pathname = usePathname();
	const isActive = pathname === href || pathname.startsWith(href + "/");

	return (
		<Link
			href={href}
			className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
				isActive
					? "text-blue-600 bg-blue-50 font-medium"
					: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
			}`}
		>
			{children}
		</Link>
	);
}
