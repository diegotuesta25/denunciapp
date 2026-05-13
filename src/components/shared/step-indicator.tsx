interface StepIndicatorProps {
	currentStep: number;
	totalSteps: number;
	labels: string[];
}

export function StepIndicator({
	currentStep,
	totalSteps,
	labels,
}: StepIndicatorProps) {
	return (
		<div className="w-full mb-8">
			<div className="flex items-center justify-between mb-2">
				{labels.map((label, index) => {
					const stepNumber = index + 1;
					const isCompleted = stepNumber < currentStep;
					const isCurrent = stepNumber === currentStep;

					return (
						<div key={label} className="flex flex-col items-center flex-1">
							<div
								className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1
                ${isCompleted ? "bg-blue-600 text-white" : ""}
                ${isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100" : ""}
                ${!isCompleted && !isCurrent ? "bg-gray-100 text-gray-400" : ""}
              `}
							>
								{isCompleted ? "✓" : stepNumber}
							</div>
							<span
								className={`text-xs text-center ${isCurrent ? "text-blue-600 font-medium" : "text-gray-400"}`}
							>
								{label}
							</span>
						</div>
					);
				})}
			</div>
			<div className="w-full bg-gray-100 h-1 rounded-full">
				<div
					className="bg-blue-600 h-1 rounded-full transition-all duration-300"
					style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
				/>
			</div>
		</div>
	);
}
