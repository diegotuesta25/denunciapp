export default function DashboardLoading() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-10">
				<div className="mb-8">
					<div className="h-8 w-72 bg-gray-200 rounded animate-pulse mb-2" />
					<div className="h-4 w-96 bg-gray-100 rounded animate-pulse" />
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
					{[...Array(4)].map((_, i) => (
						<div key={i} className="bg-white rounded-xl border p-5">
							<div className="h-3 w-24 bg-gray-100 rounded animate-pulse mb-3" />
							<div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
						</div>
					))}
				</div>
				<div className="bg-white rounded-xl border p-6 mb-6">
					<div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-6" />
					<div className="h-64 bg-gray-50 rounded animate-pulse" />
				</div>
				<div className="bg-white rounded-xl border p-6">
					<div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-6" />
					<div className="h-64 bg-gray-50 rounded animate-pulse" />
				</div>
			</div>
		</div>
	);
}
