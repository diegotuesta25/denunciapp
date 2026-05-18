"use client";
import { useState } from "react";
import { ChoroplethMap } from "./choropleth-map";
import { normalize } from "@/lib/utils";

type DistrictCount = {
	jurisdictionId: string;
	districtName: string;
	ubigeo: string;
	count: number;
};

type TypeCount = {
	type: string;
	count: number;
};

type MonthlyTrend = {
	month: string;
	type: string;
	count: number;
};

type DashboardData = {
	districtCounts: DistrictCount[];
	typeCounts: TypeCount[];
	monthlyTrend: MonthlyTrend[];
};

export function DashboardMap({ data }: { data: DashboardData }) {
	const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

	const filtered = selectedDistrict
		? data.districtCounts.filter(d => {
				console.log(d);
				return normalize(d.districtName) === normalize(selectedDistrict);
			})
		: data.districtCounts;

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-xl shadow-sm border p-4">
				<ChoroplethMap
					districtCounts={data.districtCounts}
					onDistrictClick={setSelectedDistrict}
					selectedDistrict={selectedDistrict}
				/>
			</div>

			<div className="bg-white rounded-xl shadow-sm border p-6">
				<h2 className="text-sm font-semibold text-gray-900 mb-4">
					{selectedDistrict
						? `Denuncias en ${selectedDistrict}`
						: "Todas las denuncias por distrito"}
				</h2>
				<div className="space-y-2">
					{filtered
						.sort((a, b) => b.count - a.count)
						.map(d => (
							<div key={d.jurisdictionId} className="flex items-center gap-3">
								<div className="w-32 text-xs text-gray-600 truncate">
									{d.districtName}
								</div>
								<div className="flex-1 bg-gray-100 rounded-full h-2">
									<div
										className="bg-blue-600 h-2 rounded-full"
										style={{
											width: `${(d.count / data.districtCounts[0]?.count) * 100}%`,
										}}
									/>
								</div>
								<div className="text-xs font-medium text-gray-900 w-8 text-right">
									{d.count}
								</div>
							</div>
						))}
				</div>
			</div>
		</div>
	);
}
