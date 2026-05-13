import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function OfficerPage() {
	const session = await auth();

	if (!session) redirect("/sign-in");

	return (
		<div className="p-8">
			<h1 className="text-2xl font-semibold mb-4">Consola del Oficial</h1>
			<pre className="bg-gray-100 p-4 rounded text-sm">
				{JSON.stringify(session.user, null, 2)}
			</pre>
		</div>
	);
}
