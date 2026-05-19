"use client";
import { DistrictCount } from "@/lib/definitions";
import { normalize } from "@/lib/utils";
import { useEffect, useRef } from "react";

type ChoroplethMapProps = {
	districtCounts: DistrictCount[];
	onDistrictClick?: (district: string | null) => void;
	selectedDistrict?: string | null;
};

export function ChoroplethMap({
	districtCounts,
	onDistrictClick,
	selectedDistrict,
}: ChoroplethMapProps) {
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapRef = useRef<any>(null);
	const initializingRef = useRef(false);

	const countByDistrict = Object.fromEntries(
		districtCounts.map(d => [normalize(d.districtName), d.count]),
	);

	const maxCount = Math.max(...districtCounts.map(d => d.count), 1);

	function getColor(count: number): string {
		if (count === 0) return "#f0f9ff";
		const ratio = count / maxCount;
		if (ratio < 0.25) return "#bfdbfe";
		if (ratio < 0.5) return "#60a5fa";
		if (ratio < 0.75) return "#2563eb";
		return "#1e3a8a";
	}

	useEffect(() => {
		if (mapRef.current || initializingRef.current) return;
		initializingRef.current = true;

		let cancelled = false;

		Promise.all([
			import("leaflet"),
			import("leaflet/dist/leaflet.css" as any),
		]).then(([L]) => {
			if (cancelled || !mapContainer.current) return;
			if ((mapContainer.current as any)._leaflet_id) return;

			const map = L.map(mapContainer.current, {
				center: [-12.0464, -77.0428],
				zoom: 10,
				zoomControl: true,
			});

			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution: "© OpenStreetMap contributors",
				maxZoom: 18,
			}).addTo(map);

			fetch("/geo/lima-districts.geojson")
				.then(r => r.json())
				.then(geojson => {
					if (cancelled) return;
					L.geoJSON(geojson, {
						style: feature => {
							const name = normalize(feature?.properties?.distrito ?? "");
							const count = countByDistrict[name] ?? 0;
							const isSelected =
								!!selectedDistrict && normalize(selectedDistrict) === name;

							return {
								fillColor: getColor(count),
								fillOpacity: 0.75,
								color: isSelected ? "#f59e0b" : "#1e40af",
								weight: isSelected ? 3 : 1,
							};
						},
						onEachFeature: (feature, layer) => {
							const rawName = feature?.properties?.distrito ?? "";
							const count = countByDistrict[normalize(rawName)] ?? 0;
							const label =
								count < 1
									? "Sin datos suficientes"
									: `${count} denuncia${count !== 1 ? "s" : ""}`;

							layer.bindTooltip(
								`<div class="text-xs font-medium">${rawName}</div>
                 <div class="text-xs text-gray-500">${label}</div>`,
								{ sticky: true },
							);
							layer.on("click", () => {
								const alreadySelected =
									!!selectedDistrict &&
									normalize(selectedDistrict) === normalize(rawName);
								onDistrictClick?.(alreadySelected ? null : rawName);
							});
						},
					}).addTo(map);
				});

			mapRef.current = map;
		});

		return () => {
			cancelled = true;
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
			initializingRef.current = false;
		};
	}, []);

	return (
		<div className="relative">
			<div
				ref={mapContainer}
				className="w-full h-96 rounded-xl overflow-hidden z-0"
			/>
			{selectedDistrict && (
				<button
					onClick={() => onDistrictClick?.(null)}
					className="absolute top-3 right-3 z-10 bg-white text-xs text-gray-600 px-3 py-1.5 rounded-lg shadow border border-gray-200 hover:bg-gray-50"
				>
					Limpiar filtro: {selectedDistrict}
				</button>
			)}
		</div>
	);
}
