export default function OfficerLoading() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-8">
				<div className="mb-8">
					<div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
					<div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
				</div>
				<div className="bg-white rounded-xl border overflow-hidden">
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="flex gap-4 px-4 py-3 border-b border-gray-50"
						>
							<div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
							<div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
							<div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
							<div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
