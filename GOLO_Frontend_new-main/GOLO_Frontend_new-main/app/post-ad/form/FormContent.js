"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import StepProgress from "@/app/components/StepProgress";
import PostAdForm from "@/app/components/PostAdForm";
import FormSidebar from "@/app/components/FormSidebar";
import Footer from "@/app/components/Footer";

export default function FormContent() {
  // Shared form state
  const [adTitleState, setAdTitleState] = useState("");
  const [adDescriptionState, setAdDescriptionState] = useState("");
  const [cities, setCities] = useState(["Mumbai", "Pune"]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [primaryContact, setPrimaryContact] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [mobilePrice, setMobilePrice] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [propertyTypeRent, setPropertyTypeRent] = useState("");
  const [isReviewStarted, setIsReviewStarted] = useState(false);
  const [isCategoryDetailsComplete, setIsCategoryDetailsComplete] = useState(false);
  const [categoryDetailsData, setCategoryDetailsData] = useState(null);

  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");
  const [templateId, setTemplateId] = useState(null);

  useEffect(() => {
    if (templateParam) setTemplateId(Number(templateParam));
  }, [templateParam]);

  // Step completion logic
  const isBasicInfoComplete =
    adTitleState.trim() &&
    adDescriptionState.trim() &&
    cities.length > 0 &&
    primaryContact.trim();

  const isSchedulingComplete = selectedDates.length > 0;
  const isReviewComplete = isReviewStarted;

  const handleCategoryDetailsChange = (data) => {
    if (data === false) {
      setIsCategoryDetailsComplete(false);
      setCategoryDetailsData(null);
    } else {
      setIsCategoryDetailsComplete(true);
      setCategoryDetailsData(typeof data === "object" ? data : null);
    }
  };

  const currentStep = !isBasicInfoComplete
    ? 1
    : !isCategoryDetailsComplete
      ? 2
      : !isSchedulingComplete
        ? 3
        : 4;

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-white min-h-screen flex flex-col">

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">

        {/* Step Progress */}
        <StepProgress
          isBasicInfoComplete={isBasicInfoComplete}
          isCategoryDetailsComplete={isCategoryDetailsComplete}
          isSchedulingComplete={isSchedulingComplete}
          isReviewComplete={isReviewComplete}
          currentStep={currentStep}
        />

        {/* Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12">

          {/* LEFT FORM */}
          <div className="lg:col-span-2">
            <PostAdForm
              adTitleState={adTitleState}
              setAdTitleState={setAdTitleState}
              adDescriptionState={adDescriptionState}
              setAdDescriptionState={setAdDescriptionState}
              cities={cities}
              setCities={setCities}
              uploadedImages={uploadedImages}
              setUploadedImages={setUploadedImages}
              primaryContact={primaryContact}
              setPrimaryContact={setPrimaryContact}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedDates={selectedDates}
              setSelectedDates={setSelectedDates}
              mobilePrice={mobilePrice}
              setMobilePrice={setMobilePrice}
              monthlyRent={monthlyRent}
              setMonthlyRent={setMonthlyRent}
              propertyTypeRent={propertyTypeRent}
              setPropertyTypeRent={setPropertyTypeRent}
              onCategoryDetailsChange={handleCategoryDetailsChange}
              templateId={templateId}
            />
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1">
            <FormSidebar
              adTitleState={adTitleState}
              adDescriptionState={adDescriptionState}
              cities={cities}
              uploadedImages={uploadedImages}
              primaryContact={primaryContact}
              selectedCategory={selectedCategory}
              mobilePrice={mobilePrice}
              monthlyRent={monthlyRent}
              propertyTypeRent={propertyTypeRent}
              categoryDetails={categoryDetailsData}
              isReviewStarted={isReviewStarted}
              setIsReviewStarted={setIsReviewStarted}
              templateId={templateId}
              selectedDates={selectedDates}
            />
          </div>

        </div>

      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}