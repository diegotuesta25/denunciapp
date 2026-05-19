export type DistrictCount = {
	jurisdictionId: string | null;
	districtName: string | null;
	ubigeo: string | null;
	count: number;
};

export type TypeCount = {
	type: string;
	count: number;
};

export type MonthlyTrend = {
	month: string;
	type: string;
	count: number;
};

export type DashboardData = {
	districtCounts: DistrictCount[];
	typeCounts: TypeCount[];
	monthlyTrend: MonthlyTrend[];
};
