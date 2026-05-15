import { Check } from "lucide-react";

export default function StepProgress({ 
  isBasicInfoComplete = false,
  isCategoryDetailsComplete = false,
  isSchedulingComplete = false,
  isReviewComplete = false,
  currentStep = 1
}) {
  const steps = [
    { label: "Basic Info", isComplete: isBasicInfoComplete },
    { label: "Category Details", isComplete: isCategoryDetailsComplete },
    { label: "Scheduling & Targeting", isComplete: isSchedulingComplete },
    { label: "Review & Pay", isComplete: isReviewComplete },
  ];

  return (
    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-md border border-gray-100">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3 flex-1">
          {/* Step Number or Checkmark */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step.isComplete
                ? "bg-green-500 text-white shadow-lg"
                : i + 1 === currentStep
                ? "bg-[#157A4F] text-white shadow-lg scale-110"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {step.isComplete ? (
              <Check size={20} strokeWidth={3} />
            ) : (
              i + 1
            )}
          </div>

          {/* Step Label */}
          <div className="flex flex-col">
            <p
              className={`text-sm font-semibold transition ${
                step.isComplete
                  ? "text-green-600"
                  : i + 1 === currentStep
                  ? "text-[#157A4F]"
                  : "text-gray-500"
              }`}
            >
              {step.label}
            </p>
            {step.isComplete && (
              <p className="text-xs text-green-500 font-medium">Completed</p>
            )}
          </div>

          {/* Connector Line */}
          {i !== steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-4 rounded-full transition ${
                step.isComplete ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
