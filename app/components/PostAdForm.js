"use client";
import { useState, useRef, useEffect } from "react";
import {
  GraduationCap,
  Heart,
  Car,
  Briefcase,
  Plane,
  Sparkles,
  Home,
  Megaphone,
  Search,
  Wrench,
  User,
  PawPrint,
  Smartphone,
  Tv,
  Sofa,
  Package,
  Gift,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export default function PostAdForm({
  adTitleState,
  setAdTitleState,
  adDescriptionState,
  setAdDescriptionState,
  cities,
  setCities,
  uploadedImages,
  setUploadedImages,
  primaryContact,
  setPrimaryContact,
  selectedCategory,
  setSelectedCategory,
  selectedDates,
  setSelectedDates,
  mobilePrice,
  setMobilePrice,
  monthlyRent,
  setMonthlyRent,
  propertyTypeRent,
  setPropertyTypeRent,
  onCategoryDetailsChange,
  templateId,
}) {
  // All hooks at top level
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  // error states
  const [titleError, setTitleError] = useState(false);
  const [descError, setDescError] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [mediaError, setMediaError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Education states
  const [educationInstitutionType, setEducationInstitutionType] = useState("");
  const [educationInstitutionName, setEducationInstitutionName] = useState("");
  const [educationCourseName, setEducationCourseName] = useState("");
  const [educationMode, setEducationMode] = useState("");
  const [educationDemo, setEducationDemo] = useState("");
  const [educationDuration, setEducationDuration] = useState("");
  const [educationFees, setEducationFees] = useState("");
  const [educationExperience, setEducationExperience] = useState("");
  const [educationQualification, setEducationQualification] = useState("");

  const [matrimonialGender, setMatrimonialGender] = useState("");
  const [matrimonialMarital, setMatrimonialMarital] = useState("");
  const [matrimonialProfileFor, setMatrimonialProfileFor] = useState("");
  const [matrimonialName, setMatrimonialName] = useState("");
  const [matrimonialAge, setMatrimonialAge] = useState("");
  const [matrimonialReligion, setMatrimonialReligion] = useState("");
  const [matrimonialCaste, setMatrimonialCaste] = useState("");
  const [matrimonialEducation, setMatrimonialEducation] = useState("");
  const [matrimonialOccupation, setMatrimonialOccupation] = useState("");
  const [matrimonialIncome, setMatrimonialIncome] = useState("");
  const [matrimonialHeight, setMatrimonialHeight] = useState("");
  const [matrimonialLocation, setMatrimonialLocation] = useState("");
  const [matrimonialAboutMe, setMatrimonialAboutMe] = useState("");
  const [matrimonialPartnerPref, setMatrimonialPartnerPref] = useState("");
  const [vehicleSellTransmission, setVehicleSellTransmission] = useState("");
  const [vehicleSellRC, setVehicleSellRC] = useState("");
  const [vehicleSellType, setVehicleSellType] = useState("");
  const [vehicleSellBrand, setVehicleSellBrand] = useState("");
  const [vehicleSellModel, setVehicleSellModel] = useState("");
  const [vehicleSellVariant, setVehicleSellVariant] = useState("");
  const [vehicleSellYear, setVehicleSellYear] = useState("");
  const [vehicleSellKMDriven, setVehicleSellKMDriven] = useState("");
  const [vehicleSellFuelType, setVehicleSellFuelType] = useState("");
  const [vehicleSellOwnership, setVehicleSellOwnership] = useState("");
  const [vehicleSellInsurance, setVehicleSellInsurance] = useState("");
  const [vehicleSellCondition, setVehicleSellCondition] = useState("");
  const [vehicleSellPrice, setVehicleSellPrice] = useState("");
  const [vehicleRentType, setVehicleRentType] = useState("");
  const [vehicleRentBrandModel, setVehicleRentBrandModel] = useState("");
  const [vehicleRentAmount, setVehicleRentAmount] = useState("");
  const [vehicleRentDeposit, setVehicleRentDeposit] = useState("");
  const [vehicleRentDriver, setVehicleRentDriver] = useState("");
  const [vehicleRentMinDuration, setVehicleRentMinDuration] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessServicesOffered, setBusinessServicesOffered] = useState("");
  const [businessGstNumber, setBusinessGstNumber] = useState("");
  const [businessWebsiteUrl, setBusinessWebsiteUrl] = useState("");
  const [businessCampaignName, setBusinessCampaignName] = useState("");
  const [businessCampaignDescription, setBusinessCampaignDescription] = useState("");
  const [businessShopAddress, setBusinessShopAddress] = useState("");
  const [validTillDate, setValidTillDate] = useState(null);
  const [travelPackageType, setTravelPackageType] = useState("");
  const [travelDestination, setTravelDestination] = useState("");
  const [travelDate, setTravelDate] = useState(null);
  const [travelDuration, setTravelDuration] = useState("");
  const [travelInclusions, setTravelInclusions] = useState("");
  const [travelExclusions, setTravelExclusions] = useState("");
  const [travelPricePerPerson, setTravelPricePerPerson] = useState("");
  const [travelAvailableSeats, setTravelAvailableSeats] = useState("");
  const [travelPickupLocation, setTravelPickupLocation] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [socialMedia, setSocialMedia] = useState([]);
  const [socialInput, setSocialInput] = useState({ platform: "", url: "" });
  const [astrologyServiceType, setAstrologyServiceType] = useState("");
  const [astrologyExperience, setAstrologyExperience] = useState("");
  const [astrologyConsultationFee, setAstrologyConsultationFee] = useState("");
  const [consultationMode, setConsultationMode] = useState("");
  const [astrologyLanguagesSpoken, setAstrologyLanguagesSpoken] = useState("");
  const [astrologyAvailabilityTime, setAstrologyAvailabilityTime] = useState("");
  const [propertyTypeSell, setPropertyTypeSell] = useState("");
  const [bhk, setBhk] = useState("");
  const [builtUpArea, setBuiltUpArea] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [parkingAvailable, setParkingAvailable] = useState("");
  const [floor, setFloor] = useState("");
  const [age, setAge] = useState("");
  const [facingSide, setFacingSide] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [noticeType, setNoticeType] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [detailedNotice, setDetailedNotice] = useState("");
  const [supportingDocuments, setSupportingDocuments] = useState([]);
  const [lfStatus, setLfStatus] = useState("");
  const [itemType, setItemType] = useState("");
  const [itemName, setItemName] = useState("");
  const [lfDate, setLfDate] = useState(null);
  const [lfLocation, setLfLocation] = useState("");
  const [lfDescription, setLfDescription] = useState("");
  const [reward, setReward] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [serviceExperience, setServiceExperience] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [charges, setCharges] = useState("");
  const [serviceBio, setServiceBio] = useState("");
  const [available24x7, setAvailable24x7] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(null);
  const [calendarDateMonth, setCalendarDateMonth] = useState(new Date());

  // Property rental states (not passed as props)
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [maintenanceCost, setMaintenanceCost] = useState("");
  const [availableFromDate, setAvailableFromDate] = useState(null);
  const [preferredTenant, setPreferredTenant] = useState("");
  const [leaseDuration, setLeaseDuration] = useState("");

  // New category states
  const [personalName, setPersonalName] = useState("");
  const [personalAchievementTitle, setPersonalAchievementTitle] = useState("");
  const [personalAge, setPersonalAge] = useState("");
  const [personalGender, setPersonalGender] = useState("");
  const [personalDescription, setPersonalDescription] = useState("");
  const [personalContact, setPersonalContact] = useState("");

  const [employmentType, setEmploymentType] = useState("");
  const [employmentExperience, setEmploymentExperience] = useState("");
  const [employmentSalaryRange, setEmploymentSalaryRange] = useState("");
  const [employmentIndustry, setEmploymentIndustry] = useState("");
  const [employmentJobDescription, setEmploymentJobDescription] = useState("");
  const [employmentRequirements, setEmploymentRequirements] = useState("");
  const [employmentBenefits, setEmploymentBenefits] = useState("");
  const [employmentVacancies, setEmploymentVacancies] = useState("");
  const [employmentJobTitle, setEmploymentJobTitle] = useState("");
  const [employmentCompanyName, setEmploymentCompanyName] = useState("");

  const [petSpecies, setPetSpecies] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petGender, setPetGender] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [petTemperament, setPetTemperament] = useState([]);
  const [petSpecialDiet, setPetSpecialDiet] = useState("");

  const [mobileBrand, setMobileBrand] = useState("");
  const [mobileModel, setMobileModel] = useState("");
  const [mobileCondition, setMobileCondition] = useState("");
  const [mobileWarranty, setMobileWarranty] = useState("");
  const [mobileNegotiable, setMobileNegotiable] = useState(false);

  const [electronicAppliance, setElectronicAppliance] = useState("");
  const [electronicBrand, setElectronicBrand] = useState("");
  const [electronicModel, setElectronicModel] = useState("");
  const [electronicCondition, setElectronicCondition] = useState("");
  const [electronicWarranty, setElectronicWarranty] = useState("");
  const [electronicPrice, setElectronicPrice] = useState("");
  const [electronicNegotiable, setElectronicNegotiable] = useState(false);
  const [electronicCapacity, setElectronicCapacity] = useState("");

  const [furnitureTypeInput, setFurnitureTypeInput] = useState("");
  const [furnitureMaterial, setFurnitureMaterial] = useState("");
  const [furnitureCondition, setFurnitureCondition] = useState("");
  const [furnitureSize, setFurnitureSize] = useState("");
  const [furniturePrice, setFurniturePrice] = useState("");
  const [furnitureNegotiable, setFurnitureNegotiable] = useState(false);

  const [otherTitle, setOtherTitle] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [otherPrice, setOtherPrice] = useState("");

  // Greetings & Tributes states
  const [greetingPersonName, setGreetingPersonName] = useState("");
  const [greetingAgeTurning, setGreetingAgeTurning] = useState("");
  const [greetingBirthday, setGreetingBirthday] = useState(null);
  const [greetingMessage, setGreetingMessage] = useState("");
  const [greetingFromName, setGreetingFromName] = useState("");
  const [greetingRelationship, setGreetingRelationship] = useState("");

  const [tributeFullName, setTributeFullName] = useState("");
  const [tributeDateOfBirth, setTributeDateOfBirth] = useState(null);
  const [tributeAge, setTributeAge] = useState("");
  const [tributeBiography, setTributeBiography] = useState("");
  const [tributeFuneralDetails, setTributeFuneralDetails] = useState("");

  const inputStyle = "w-full border border-gray-200 bg-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#157A4F] focus:border-[#157A4F] transition shadow-sm";

  const categories = [
    { name: "Education", icon: GraduationCap },
    { name: "Matrimonial", icon: Heart },
    { name: "Vehicle", icon: Car, sub: ["Rent", "Sell"] },
    { name: "Business", icon: Briefcase, sub: ["Promotion"] },
    { name: "Travel", icon: Plane },
    { name: "Astrology", icon: Sparkles },
    { name: "Property", icon: Home, sub: ["Rent", "Sell"] },
    { name: "Public Notice", icon: Megaphone },
    { name: "Lost & Found", icon: Search },
    { name: "Service", icon: Wrench },
    { name: "Personal", icon: User },
    { name: "Employment", icon: Briefcase },
    { name: "Pets", icon: PawPrint },
    { name: "Mobiles", icon: Smartphone },
    { name: "Electronics & Home appliances", icon: Tv },
    { name: "Furniture", icon: Sofa },
    { name: "Greetings & Tributes", icon: Gift, sub: ["Greetings", "Tributes"] },
    { name: "Other", icon: Package },
  ];

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  // Helper: Check if all required category fields are filled
  const isFilled = (v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (v instanceof Date) return !isNaN(v.getTime());
    if (typeof v === "boolean") return v === true;
    return Boolean(v);
  };

  const toNumberOrUndefined = (value) => {
    if (value === null || value === undefined || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const checkCategoryCompletion = () => {
    if (!selectedCategory) {
      onCategoryDetailsChange && onCategoryDetailsChange(false);
      return;
    }

    let isComplete = false;
    let categoryData = null;

    switch (selectedCategory.name) {
      case "Education":
        isComplete = isFilled(educationInstitutionType) && isFilled(educationInstitutionName);
        if (isComplete) {
          categoryData = {
            institutionType: educationInstitutionType,
            institutionName: educationInstitutionName,
            courseName: educationCourseName || undefined,
            modeOfEducation: educationMode || undefined,
            demoClassAvailable: educationDemo || undefined,
            duration: educationDuration || undefined,
            fees: toNumberOrUndefined(educationFees),
            teachingExperience: educationExperience || undefined,
            qualification: educationQualification || undefined,
            facilities: [], // Can be expanded in UI later
            contactPerson: undefined,
            contactNumber: undefined,
            email: undefined,
            website: undefined
          };
          // Adding extras to metadata if needed, but keeping DTO clean
        }
        break;
      case "Matrimonial":
        isComplete = isFilled(matrimonialProfileFor) && isFilled(matrimonialName) && isFilled(matrimonialAge) && isFilled(matrimonialGender) && isFilled(matrimonialMarital);
        if (isComplete) {
          categoryData = {
            profileFor: matrimonialProfileFor,
            name: matrimonialName,
            age: parseInt(matrimonialAge),
            gender: matrimonialGender,
            maritalStatus: matrimonialMarital,
            religion: matrimonialReligion || undefined,
            caste: matrimonialCaste || undefined,
            education: matrimonialEducation || undefined,
            occupation: matrimonialOccupation || undefined,
            annualIncome: matrimonialIncome || undefined,
            height: matrimonialHeight || undefined,
            city: matrimonialLocation || undefined,
            aboutMe: matrimonialAboutMe || undefined,
            partnerPreference: matrimonialPartnerPref || undefined,
          };
        }
        break;
      case "Vehicle":
        if (selectedSub === "Sell") {
          isComplete = isFilled(vehicleSellTransmission) && isFilled(vehicleSellRC) && isFilled(vehicleSellType) && isFilled(vehicleSellBrand) && isFilled(vehicleSellModel) && isFilled(vehicleSellYear) && isFilled(vehicleSellKMDriven) && isFilled(vehicleSellFuelType) && isFilled(vehicleSellPrice);
          if (isComplete) {
            categoryData = {
              type: "Sell",
              vehicleType: vehicleSellType,
              brand: vehicleSellBrand,
              model: vehicleSellModel,
              variant: vehicleSellVariant || undefined,
              year: parseInt(vehicleSellYear, 10),
              kilometersDriven: parseInt(vehicleSellKMDriven, 10),
              fuelType: vehicleSellFuelType,
              transmission: vehicleSellTransmission,
              rcAvailable: vehicleSellRC,
              ownership: vehicleSellOwnership || undefined,
              ownerNumber: vehicleSellOwnership === "Single Owner" ? 1 : (vehicleSellOwnership === "Second Owner" ? 2 : (vehicleSellOwnership === "Third Owner" ? 3 : undefined)),
              insuranceValidTill: vehicleSellInsurance || undefined,
              condition: vehicleSellCondition || undefined,
              price: Number(vehicleSellPrice),
            };
          }
        } else if (selectedSub === "Rent") {
          isComplete = isFilled(vehicleRentType) && isFilled(vehicleRentBrandModel) && isFilled(vehicleRentAmount) && isFilled(vehicleRentDeposit) && isFilled(vehicleRentDriver) && isFilled(vehicleRentMinDuration);
          if (isComplete) {
            categoryData = {
              type: "Rent",
              vehicleType: vehicleRentType,
              brandModel: vehicleRentBrandModel,
              rentAmount: Number(vehicleRentAmount),
              securityDeposit: Number(vehicleRentDeposit),
              includesDriver: vehicleRentDriver,
              minRentalDuration: vehicleRentMinDuration
            };
          }
        }
        break;
      case "Business":
        isComplete = isFilled(businessType);
        if (isComplete) {
          categoryData = {
            subCategory: selectedSub || undefined,
            businessName: businessName || undefined,
            businessType,
            servicesOffered: businessServicesOffered || undefined,
            gstNumber: businessGstNumber || undefined,
            websiteUrl: businessWebsiteUrl || undefined,
            socialMedia: socialMedia.length > 0 ? socialMedia.map(({ platform, url }) => ({ platform, url })) : undefined,
            campaignName: businessCampaignName || undefined,
            validTillDate: validTillDate || undefined,
            campaignDescription: businessCampaignDescription || undefined,
            shopAddress: businessShopAddress || undefined,
          };
        }
        break;
      case "Travel":
        isComplete = isFilled(travelDate);
        if (isComplete) {
          categoryData = {
            packageType: travelPackageType || undefined,
            destination: travelDestination || undefined,
            duration: travelDuration || undefined,
            travelDate,
            inclusions: travelInclusions || undefined,
            exclusions: travelExclusions || undefined,
            pricePerPerson: toNumberOrUndefined(travelPricePerPerson),
            availableSeats: toNumberOrUndefined(travelAvailableSeats),
            pickupLocation: travelPickupLocation || undefined,
          };
        }
        break;
      case "Astrology":
        isComplete = isFilled(consultationMode);
        if (isComplete) {
          categoryData = {
            serviceType: astrologyServiceType || undefined,
            experience: astrologyExperience || undefined,
            consultationFee: toNumberOrUndefined(astrologyConsultationFee),
            consultationMode,
            languagesSpoken: astrologyLanguagesSpoken || undefined,
            availabilityTime: astrologyAvailabilityTime || undefined,
          };
        }
        break;
      case "Property":
        if (selectedSub === "Rent") isComplete = isFilled(propertyTypeRent) && isFilled(monthlyRent);
        else if (selectedSub === "Sell") isComplete = isFilled(propertyTypeSell) && isFilled(bhk);
        if (isComplete) {
          categoryData = selectedSub === "Rent"
            ? {
                listingType: "Rent",
                propertyType: propertyTypeRent,
                rent: Number(monthlyRent),
                securityDeposit: toNumberOrUndefined(securityDeposit),
                maintenanceCost: toNumberOrUndefined(maintenanceCost),
                availableFromDate: availableFromDate || undefined,
                preferredTenant: preferredTenant || undefined,
                leaseDuration: leaseDuration || undefined,
              }
            : {
                listingType: "Sell",
                propertyType: propertyTypeSell,
                bhk,
                builtUpArea: builtUpArea || undefined,
                furnishing: furnishing || undefined,
                bathrooms: toNumberOrUndefined(bathrooms),
                parkingAvailable: parkingAvailable || undefined,
                floor: floor || undefined,
                propertyAge: age || undefined,
                facingSide: facingSide || undefined,
                askingPrice: toNumberOrUndefined(askingPrice),
              };
        }
        break;
      case "Public Notice":
        isComplete = isFilled(noticeType) && isFilled(issuingAuthority) && isFilled(detailedNotice);
        if (isComplete) {
          categoryData = {
            noticeType,
            issuingAuthority,
            detailedNotice,
            supportingDocuments: supportingDocuments.length > 0
              ? supportingDocuments.map((doc) => doc.name)
              : undefined,
          };
        }
        break;
      case "Lost & Found":
        isComplete = isFilled(lfStatus) && isFilled(itemType) && isFilled(itemName) && isFilled(lfLocation) && isFilled(lfDescription);
        if (isComplete) {
          categoryData = {
            status: lfStatus,
            itemType,
            itemName,
            date: lfDate || undefined,
            location: lfLocation,
            description: lfDescription,
            reward: reward || undefined,
          };
        }
        break;
      case "Service":
        isComplete = isFilled(serviceCategory) && isFilled(serviceExperience) && isFilled(charges) && isFilled(serviceArea) && isFilled(availableTime) && isFilled(serviceBio);
        if (isComplete) {
          categoryData = {
            serviceCategory,
            experience: serviceExperience,
            charges,
            serviceArea,
            availableTime,
            bio: serviceBio,
            available24x7,
          };
        }
        break;
      case "Personal":
        isComplete = isFilled(personalName) && isFilled(personalAchievementTitle) && isFilled(personalAge) && isFilled(personalGender) && isFilled(personalDescription) && isFilled(personalContact);
        if (isComplete) {
          categoryData = {
            name: personalName,
            achievementTitle: personalAchievementTitle,
            age: personalAge,
            gender: personalGender,
            description: personalDescription,
            contact: personalContact,
          };
        }
        break;
      case "Employment":
        isComplete = isFilled(employmentType) && isFilled(employmentJobTitle) && isFilled(employmentCompanyName) && isFilled(employmentExperience) && isFilled(employmentSalaryRange) && isFilled(employmentIndustry) && isFilled(employmentJobDescription) && isFilled(employmentRequirements) && isFilled(employmentBenefits) && isFilled(employmentVacancies);
        if (isComplete) {
          categoryData = {
            jobType: employmentType, // Enum checked
            jobTitle: employmentJobTitle,
            companyName: employmentCompanyName,
            experienceRequired: employmentExperience,
            salary: employmentSalaryRange,
            industry: employmentIndustry,
            qualifications: employmentRequirements,
            description: employmentJobDescription,
            benefits: employmentBenefits || undefined,
            vacancies: parseInt(employmentVacancies) || 1
          };
        }
        break;
      case "Pets":
        isComplete = isFilled(petSpecies) && isFilled(petBreed) && isFilled(petAge) && isFilled(petGender) && isFilled(petWeight);
        if (isComplete) {
          categoryData = {
            species: petSpecies,
            breed: petBreed,
            age: petAge,
            gender: petGender,
            weight: petWeight,
            temperament: petTemperament.length > 0 ? petTemperament : undefined,
            specialDietOrNeeds: petSpecialDiet || undefined,
          };
        }
        break;
      case "Mobiles":
        isComplete = isFilled(mobileBrand) && isFilled(mobileModel) && isFilled(mobileCondition) && isFilled(mobileWarranty) && isFilled(mobilePrice);
        if (isComplete) categoryData = { brand: mobileBrand, model: mobileModel, condition: mobileCondition, warranty: mobileWarranty, price: Number(mobilePrice), negotiable: mobileNegotiable };
        break;
      case "Electronics":
      case "Electronics & Home appliances":
        isComplete = isFilled(electronicAppliance) && isFilled(electronicBrand) && isFilled(electronicModel) && isFilled(electronicCondition) && isFilled(electronicWarranty) && isFilled(electronicPrice);
        if (isComplete) {
          categoryData = {
            applianceType: electronicAppliance,
            brand: electronicBrand,
            model: electronicModel,
            condition: electronicCondition,
            warranty: electronicWarranty,
            price: Number(electronicPrice),
            negotiable: electronicNegotiable,
            capacity: electronicCapacity || undefined,
          };
        }
        break;
      case "Furniture":
        isComplete = isFilled(furnitureTypeInput) && isFilled(furnitureMaterial) && isFilled(furnitureCondition) && isFilled(furnitureSize) && isFilled(furniturePrice);
        if (isComplete) {
          const allowedFurnitureTypes = [
            'Sofa', 'Bed', 'Dining Table', 'Chair', 'Table', 'Wardrobe',
            'Dressing Table', 'Bookshelf', 'Cabinet', 'Mattress', 'Other'
          ];

          const normalizedFurnitureType =
            allowedFurnitureTypes.find(
              (item) => item.toLowerCase() === String(furnitureTypeInput || '').trim().toLowerCase()
            ) || 'Other';

          categoryData = {
            furnitureType: normalizedFurnitureType,
            material: furnitureMaterial,
            condition: furnitureCondition,
            dimensions: furnitureSize,
            price: Number(furniturePrice),
            negotiable: furnitureNegotiable,
          };
        }
        break;
      case "Greetings & Tributes":
        if (selectedSub === "Greetings") {
          isComplete = isFilled(greetingPersonName) && isFilled(greetingAgeTurning) && isFilled(greetingBirthday) && isFilled(greetingMessage) && isFilled(greetingFromName) && isFilled(greetingRelationship);
          if (isComplete) {
            categoryData = {
              tributeType: "Greetings",
              personName: greetingPersonName,
              ageTurning: greetingAgeTurning,
              birthday: greetingBirthday,
              message: greetingMessage,
              fromName: greetingFromName,
              relationship: greetingRelationship,
            };
          }
        } else if (selectedSub === "Tributes") {
          isComplete = isFilled(tributeFullName) && isFilled(tributeDateOfBirth) && isFilled(tributeAge) && isFilled(tributeBiography);
          if (isComplete) {
            categoryData = {
              tributeType: "Tributes",
              fullName: tributeFullName,
              dateOfBirth: tributeDateOfBirth,
              age: tributeAge,
              biography: tributeBiography,
              funeralDetails: tributeFuneralDetails || undefined,
            };
          }
        }
        break;
      case "Other":
        isComplete = isFilled(otherTitle) && isFilled(otherDescription);
        if (isComplete) {
          categoryData = {
            title: otherTitle,
            description: otherDescription,
            price: otherPrice ? Number(otherPrice) : undefined,
          };
        }
        break;
    }

    // Only set categoryDetails to an object if it's complete, else false
    onCategoryDetailsChange && onCategoryDetailsChange(isComplete ? (categoryData || {}) : false);
  };

  // Helper functions
  const scroll = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -260 : 260,
      behavior: "smooth",
    });
  };

  const addCity = () => {
    if (input.trim() && !cities.includes(input.trim())) {
      setCities([...cities, input.trim()]);
      setInput("");
      setLocationError(false);
    }
  };

  const removeCity = (cityToRemove) => {
    setCities(cities.filter((city) => city !== cityToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCity();
    }
  };

  const handleFileUpload = (e) => {
    setMediaError("");
    const files = Array.from(e.target.files || []);

    // Template 3: text-only, ignore uploads
    if (templateId === 3) return;

    // Template 2: single photo - validate
    if (templateId === 2) {
      if (uploadedImages.length >= 1) {
        setMediaError("You can only upload one media for this template.");
        return;
      }
      const file = files[0];
      if (!file) return;
      const img = { file, url: URL.createObjectURL(file) };
      setUploadedImages([img]);
      return;
    }

    // Template 1 or default: allow multiple
    const images = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setUploadedImages((prev) => [...prev, ...images]);
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDate = (date) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);

  const addSocialMedia = () => {
    if (socialInput.platform && socialInput.url) {
      setSocialMedia([...socialMedia, { ...socialInput, id: Date.now() }]);
      setSocialInput({ platform: "", url: "" });
    }
  };

  const removeSocialMedia = (id) => {
    setSocialMedia(socialMedia.filter((item) => item.id !== id));
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const docs = files.map((file) => ({
      file,
      name: file.name,
      id: Date.now() + Math.random(),
    }));
    setSupportingDocuments((prev) => [...prev, ...docs]);
  };

  const removeDocument = (id) => {
    setSupportingDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  // Initialize selectedCategory on mount
  useEffect(() => {
    if (selectedCategory === null && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, []);

  // Check category completion whenever category-specific fields change
  useEffect(() => {
    checkCategoryCompletion();
  }, [
    selectedCategory,
    selectedSub,
    educationInstitutionType,
    educationInstitutionName,
    educationCourseName,
    educationMode,
    educationDemo,
    educationDuration,
    educationFees,
    educationExperience,
    educationQualification,
    matrimonialGender,
    matrimonialMarital,
    matrimonialProfileFor,
    matrimonialName,
    matrimonialAge,
    matrimonialReligion,
    matrimonialCaste,
    matrimonialEducation,
    matrimonialOccupation,
    matrimonialIncome,
    matrimonialHeight,
    matrimonialLocation,
    matrimonialAboutMe,
    matrimonialPartnerPref,
    vehicleSellTransmission,
    vehicleSellRC,
    vehicleSellType,
    vehicleSellBrand,
    vehicleSellModel,
    vehicleSellVariant,
    vehicleSellYear,
    vehicleSellKMDriven,
    vehicleSellFuelType,
    vehicleSellOwnership,
    vehicleSellInsurance,
    vehicleSellCondition,
    vehicleSellPrice,
    vehicleRentDriver,
    vehicleRentType,
    vehicleRentBrandModel,
    vehicleRentAmount,
    vehicleRentDeposit,
    vehicleRentMinDuration,
    businessType,
    businessName,
    businessServicesOffered,
    businessGstNumber,
    businessWebsiteUrl,
    businessCampaignName,
    businessCampaignDescription,
    businessShopAddress,
    validTillDate,
    socialMedia,
    travelPackageType,
    travelDestination,
    travelDate,
    travelDuration,
    travelInclusions,
    travelExclusions,
    travelPricePerPerson,
    travelAvailableSeats,
    travelPickupLocation,
    astrologyServiceType,
    astrologyExperience,
    astrologyConsultationFee,
    consultationMode,
    astrologyLanguagesSpoken,
    astrologyAvailabilityTime,
    propertyTypeSell,
    bhk,
    builtUpArea,
    furnishing,
    bathrooms,
    parkingAvailable,
    floor,
    age,
    facingSide,
    askingPrice,
    propertyTypeRent,
    monthlyRent,
    securityDeposit,
    maintenanceCost,
    availableFromDate,
    preferredTenant,
    leaseDuration,
    noticeType,
    issuingAuthority,
    detailedNotice,
    supportingDocuments,
    lfStatus,
    itemType,
    itemName,
    lfDate,
    lfLocation,
    lfDescription,
    reward,
    serviceCategory,
    serviceExperience,
    charges,
    serviceArea,
    availableTime,
    serviceBio,
    available24x7,
    personalName,
    personalAchievementTitle,
    personalAge,
    personalGender,
    personalDescription,
    personalContact,
    employmentType,
    employmentJobTitle,
    employmentCompanyName,
    employmentExperience,
    employmentSalaryRange,
    employmentIndustry,
    employmentJobDescription,
    employmentRequirements,
    employmentBenefits,
    employmentVacancies,
    petSpecies,
    petBreed,
    petAge,
    petGender,
    petWeight,
    petTemperament,
    petSpecialDiet,
    mobileBrand,
    mobileModel,
    mobileCondition,
    mobileWarranty,
    mobilePrice,
    mobileNegotiable,
    electronicAppliance,
    electronicBrand,
    electronicModel,
    electronicCondition,
    electronicWarranty,
    electronicPrice,
    electronicNegotiable,
    electronicCapacity,
    furnitureTypeInput,
    furnitureMaterial,
    furnitureCondition,
    furnitureSize,
    furniturePrice,
    furnitureNegotiable,
    greetingPersonName,
    greetingAgeTurning,
    greetingBirthday,
    greetingMessage,
    greetingFromName,
    greetingRelationship,
    tributeFullName,
    tributeDateOfBirth,
    tributeAge,
    tributeBiography,
    tributeFuneralDetails,
    otherTitle,
    otherDescription,
    otherPrice,
  ]);

  // Enforce template-based media rules when template changes
  useEffect(() => {
    if (templateId === 3) {
      // text-only: remove all images
      setUploadedImages([]);
    } else if (templateId === 2) {
      // single photo: keep only first image
      setUploadedImages((prev) => (prev && prev.length > 0 ? [prev[0]] : prev));
    }
  }, [templateId]);

  return (
    <div className="space-y-12 bg-[#F8F6F2] p-6 rounded-3xl">

      {/* Choose Category */}
      <div className="bg-white p-10 rounded-3xl shadow-md border border-gray-100 relative min-h-[320px]">

        <h3 className="font-semibold text-2xl mb-8 text-gray-800 text-center">
          Choose Category
        </h3>

        {/* Left Scroll Button */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-md rounded-full p-2 hover:bg-[#FFF3D6] transition z-10"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-md rounded-full p-2 hover:bg-[#FFF3D6] transition z-10"
        >
          <ChevronRight size={18} />
        </button>

        {/* Categories Scroll Row */}
        <div
          ref={scrollRef}
          className="flex items-center gap-8 overflow-x-auto scroll-smooth px-14 snap-x snap-mandatory py-6"
        >
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            const isActive = selectedCategory?.name === cat.name;

            return (
              <div
                key={index}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedSub(null);
                }}
                className={`snap-start flex-shrink-0 w-[130px] h-[160px] flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-300 border
                ${isActive
                    ? "bg-[#157A4F] text-white border-[#157A4F] shadow-xl scale-105"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#157A4F] hover:-translate-y-2 hover:shadow-lg"
                  }`}
              >
                <Icon size={34} className="mb-3" />
                <span className="text-sm font-medium text-center px-2">
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Subcategories */}
        {selectedCategory?.sub && (
          <div className="flex gap-4 mt-10 justify-center flex-wrap">
            {selectedCategory.sub.map((option, i) => (
              <button
                key={i}
                onClick={() => setSelectedSub(option)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition
                ${selectedSub === option
                    ? "bg-[#157A4F] text-white shadow-md"
                    : "bg-[#FFF3D6] text-gray-700 hover:bg-[#F5B849] hover:text-white"
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

      </div> {/* Close Choose Category */}

      {/* Basic Information */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 space-y-8">

        {/* Heading */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Basic Information
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Core details required for all listing types
          </p>
        </div>

        {/* Language + Primary Contact (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Language
            </label>
            <select className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300">
              <option>English (India)</option>
              <option>Marathi</option>
              <option>Hindi</option>
            </select>
          </div>

          {/* Primary Contact */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Primary Contact
            </label>
            <input
              type="text"
              value={primaryContact}
              onChange={(e) => {
                setPrimaryContact(e.target.value);
                setContactError(!e.target.value.trim());
              }}
              placeholder="Enter primary contact"
              className={`w-full h-11 px-4 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 ${contactError ? "border-red-500" : "border-gray-300"
                }`}
            />
          </div>
        </div>

        {/* Ad Title */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">
              Ad Title
            </label>
            <span className="text-xs text-gray-500">
              {adTitleState.length} / 100
            </span>
          </div>

          <input
            type="text"
            value={adTitleState}
            onChange={(e) => {
              setAdTitleState(e.target.value);
              setTitleError(!e.target.value.trim());
            }}
            placeholder="Enter a catchy ad title"
            className={`w-full h-11 px-4 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 ${titleError ? "border-red-500" : "border-gray-300"
              }`}
          />

          <p className="text-xs text-gray-500">
            Catchy titles sell faster!
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <span className="text-xs text-gray-500">
              {adDescriptionState.length} / 2000
            </span>
          </div>

          <textarea
            rows={6}
            value={adDescriptionState}
            onChange={(e) => {
              setAdDescriptionState(e.target.value);
              setDescError(!e.target.value.trim());
            }}
            placeholder="Write a detailed description of your listing..."
            className={`w-full px-4 py-3 rounded-lg border bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 ${descError ? "border-red-500" : "border-gray-300"
              }`}
          />
        </div>

        {/* Locations */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Locations
          </label>

          <div className={`w-full min-h-[56px] px-3 py-2 rounded-lg border bg-white flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-gray-300 ${locationError ? "border-red-500" : "border-gray-300"
            }`}>
            {/* City Chips */}
            {cities.map((city, index) => (
              <span
                key={index}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 rounded-full border border-gray-200"
              >
                {city}
                <button
                  type="button"
                  onClick={() => removeCity(city)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}

            {/* Inline Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add city"
              className="flex-1 min-w-[120px] outline-none text-sm"
            />
          </div>
        </div>

        {/* Dynamic Details */}
        {selectedCategory && (
          <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 space-y-6">
            <h3 className="font-semibold text-2xl text-gray-800">
              {selectedCategory.sub && selectedSub ? `${selectedCategory.name} ${selectedSub} Details` : `${selectedCategory.name} Details`}
            </h3>

            {selectedCategory.name === "Education" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Institution Type</label>
                  <select
                    className={inputStyle}
                    value={educationInstitutionType}
                    onChange={(e) => setEducationInstitutionType(e.target.value)}
                  >
                    <option value="">Select Institution Type</option>
                    <option value="School">School</option>
                    <option value="College">College</option>
                    <option value="Coaching">Coaching</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Online Course">Online Course</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Institution Name</label>
                  <input
                    placeholder="ABC Academy"
                    className={inputStyle}
                    value={educationInstitutionName}
                    onChange={(e) => setEducationInstitutionName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Course Name</label>
                  <input
                    placeholder="Mathematics"
                    className={inputStyle}
                    value={educationCourseName}
                    onChange={(e) => setEducationCourseName(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Mode of Education</label>
                  <div className="flex gap-4">
                    <button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${educationMode === "Online" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700 hover:bg-[#F5B849] hover:text-white"}`} onClick={() => setEducationMode("Online")}>Online</button>
                    <button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${educationMode === "Offline" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700 hover:bg-[#F5B849] hover:text-white"}`} onClick={() => setEducationMode("Offline")}>Offline</button>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Demo Class Available?</label>
                  <div className="flex gap-4">
                    <button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${educationDemo === "Yes" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700 hover:bg-[#F5B849] hover:text-white"}`} onClick={() => setEducationDemo("Yes")}>Yes</button>
                    <button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${educationDemo === "No" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700 hover:bg-[#F5B849] hover:text-white"}`} onClick={() => setEducationDemo("No")}>No</button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Duration</label>
                  <input
                    placeholder="6 months"
                    className={inputStyle}
                    value={educationDuration}
                    onChange={(e) => setEducationDuration(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fees (₹)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    className={inputStyle}
                    value={educationFees}
                    onChange={(e) => setEducationFees(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Teaching Experience</label>
                  <input
                    placeholder="5 years"
                    className={inputStyle}
                    value={educationExperience}
                    onChange={(e) => setEducationExperience(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Qualification</label>
                  <input
                    placeholder="MSc Mathematics"
                    className={inputStyle}
                    value={educationQualification}
                    onChange={(e) => setEducationQualification(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedCategory.name === "Matrimonial" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Profile For</label><select className={inputStyle} value={matrimonialProfileFor} onChange={e => setMatrimonialProfileFor(e.target.value)}><option value="">Profile For (e.g. Self)</option><option value="Self">Self</option><option value="Relative">Relative</option><option value="Friend">Friend</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Name</label><input placeholder="Rahul Sharma" className={inputStyle} value={matrimonialName} onChange={e => setMatrimonialName(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Age</label><input type="number" placeholder="28" className={inputStyle} value={matrimonialAge} onChange={e => setMatrimonialAge(e.target.value)} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Gender</label><select className={inputStyle} value={matrimonialGender} onChange={e => setMatrimonialGender(e.target.value)}><option value="">Gender (e.g. Male)</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Marital Status</label><select className={inputStyle} value={matrimonialMarital} onChange={e => setMatrimonialMarital(e.target.value)}><option value="">Marital Status (e.g. Single)</option><option value="Single">Single</option><option value="Divorced">Divorced</option><option value="Widow">Widow</option><option value="Widower">Widower</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Religion</label><input placeholder="Hindu" className={inputStyle} value={matrimonialReligion} onChange={e => setMatrimonialReligion(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Caste</label><input placeholder="Brahmin" className={inputStyle} value={matrimonialCaste} onChange={e => setMatrimonialCaste(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Education</label><input placeholder="MBA" className={inputStyle} value={matrimonialEducation} onChange={e => setMatrimonialEducation(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Occupation</label><input placeholder="Engineer" className={inputStyle} value={matrimonialOccupation} onChange={e => setMatrimonialOccupation(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Annual Income</label><input placeholder="₹10,00,000" className={inputStyle} value={matrimonialIncome} onChange={e => setMatrimonialIncome(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Height</label><input placeholder={'5\'8"'} className={inputStyle} value={matrimonialHeight} onChange={e => setMatrimonialHeight(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Location</label><input placeholder="Pune" className={inputStyle} value={matrimonialLocation} onChange={e => setMatrimonialLocation(e.target.value)} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">About Me</label><textarea placeholder="I am a fun-loving person..." className={inputStyle + " resize-none h-24"} value={matrimonialAboutMe} onChange={e => setMatrimonialAboutMe(e.target.value)} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Partner Preference</label><textarea placeholder="Looking for..." className={inputStyle + " resize-none h-24"} value={matrimonialPartnerPref} onChange={e => setMatrimonialPartnerPref(e.target.value)} /></div>
              </div>
            )}

            {selectedCategory.name === "Vehicle" && selectedSub === "Sell" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Vehicle Type</label><select className={inputStyle} value={vehicleSellType} onChange={(e) => setVehicleSellType(e.target.value)}><option value="">Vehicle Type (e.g. Four Wheeler)</option><option value="Four Wheeler">Four Wheeler</option><option value="Two Wheeler">Two Wheeler</option><option value="Three Wheeler">Three Wheeler</option><option value="Truck">Truck</option><option value="Other">Other</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Brand</label><input placeholder="Maruti" className={inputStyle} value={vehicleSellBrand} onChange={(e) => setVehicleSellBrand(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Model</label><input placeholder="Swift" className={inputStyle} value={vehicleSellModel} onChange={(e) => setVehicleSellModel(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Variant</label><input placeholder="VXi" className={inputStyle} value={vehicleSellVariant} onChange={(e) => setVehicleSellVariant(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Year</label><input type="number" placeholder="2020" className={inputStyle} value={vehicleSellYear} onChange={(e) => setVehicleSellYear(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">KM Driven</label><input type="number" placeholder="15000" className={inputStyle} value={vehicleSellKMDriven} onChange={(e) => setVehicleSellKMDriven(e.target.value)} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Fuel Type</label><select className={inputStyle} value={vehicleSellFuelType} onChange={(e) => setVehicleSellFuelType(e.target.value)}><option value="">Fuel Type (e.g. Petrol)</option><option value="Petrol">Petrol</option><option value="Diesel">Diesel</option><option value="Electric">Electric</option><option value="Hybrid">Hybrid</option><option value="CNG">CNG</option></select></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Transmission</label><div className="flex gap-4"><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${vehicleSellTransmission === "Manual" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setVehicleSellTransmission("Manual")}>Manual</button><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${vehicleSellTransmission === "Automatic" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setVehicleSellTransmission("Automatic")}>Automatic</button></div></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Ownership</label><select className={inputStyle} value={vehicleSellOwnership} onChange={(e) => setVehicleSellOwnership(e.target.value)}><option value="">Ownership (e.g. Single Owner)</option><option value="Single Owner">Single Owner</option><option value="Second Owner">Second Owner</option><option value="Third Owner">Third Owner</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Insurance Valid Till</label><input placeholder="Dec 2026" className={inputStyle} value={vehicleSellInsurance} onChange={(e) => setVehicleSellInsurance(e.target.value)} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">RC Available</label><div className="flex gap-4"><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${vehicleSellRC === "Yes" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setVehicleSellRC("Yes")}>Yes</button><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${vehicleSellRC === "No" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setVehicleSellRC("No")}>No</button></div></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Condition</label><select className={inputStyle} value={vehicleSellCondition} onChange={(e) => setVehicleSellCondition(e.target.value)}><option value="">Condition (e.g. Excellent)</option><option value="Excellent">Excellent</option><option value="Very Good">Very Good</option><option value="Good">Good</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Price</label><input type="number" placeholder="500000" className={inputStyle} value={vehicleSellPrice} onChange={(e) => setVehicleSellPrice(e.target.value)} /></div>
              </div>
            )}

            {selectedCategory.name === "Vehicle" && selectedSub === "Rent" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Vehicle Type</label><select className={inputStyle} value={vehicleRentType} onChange={(e) => setVehicleRentType(e.target.value)}><option value="">Vehicle Type (e.g. Four Wheeler)</option><option value="Four Wheeler">Four Wheeler</option><option value="Two Wheeler">Two Wheeler</option><option value="Three Wheeler">Three Wheeler</option><option value="Truck">Truck</option><option value="Other">Other</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Brand / Model</label><input placeholder="Maruti Swift" className={inputStyle} value={vehicleRentBrandModel} onChange={(e) => setVehicleRentBrandModel(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Per Day Rent Amount</label><input type="number" placeholder="1000" className={inputStyle} value={vehicleRentAmount} onChange={(e) => setVehicleRentAmount(e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Security Deposit</label><input type="number" placeholder="5000" className={inputStyle} value={vehicleRentDeposit} onChange={(e) => setVehicleRentDeposit(e.target.value)} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Includes Driver</label><div className="flex gap-4"><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${vehicleRentDriver === "Yes" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setVehicleRentDriver("Yes")}>Yes</button><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${vehicleRentDriver === "No" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setVehicleRentDriver("No")}>No</button><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${vehicleRentDriver === "Both" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setVehicleRentDriver("Both")}>Both</button></div></div>
                <div><label className="text-sm font-medium text-gray-700">Min Rental Duration</label><input placeholder="2 days" className={inputStyle} value={vehicleRentMinDuration} onChange={(e) => setVehicleRentMinDuration(e.target.value)} /></div>
              </div>
            )}

            {selectedCategory.name === "Business" && selectedSub === "Promotion" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Business Name</label><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your Business Name" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Business Type</label><select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={inputStyle}><option value="">Select Business Type</option><option value="Retail">Retail</option><option value="SaaS">SaaS</option><option value="Hospitality">Hospitality</option><option value="Other">Other</option></select></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Services Offered</label><input value={businessServicesOffered} onChange={(e) => setBusinessServicesOffered(e.target.value)} placeholder="e.g. Web Development, Consulting" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">GST Number</label><input value={businessGstNumber} onChange={(e) => setBusinessGstNumber(e.target.value)} placeholder="18AABCU9603R1Z0 (optional)" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Website URL</label><input value={businessWebsiteUrl} onChange={(e) => setBusinessWebsiteUrl(e.target.value)} placeholder="https://www.example.com (optional)" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Social Media Presence</label><div className="space-y-3"><div className="flex gap-2"><select value={socialInput.platform} onChange={(e) => setSocialInput({ ...socialInput, platform: e.target.value })} className={inputStyle}><option value="">Select Platform</option><option value="Facebook">Facebook</option><option value="Instagram">Instagram</option><option value="LinkedIn">LinkedIn</option><option value="Twitter">Twitter</option><option value="YouTube">YouTube</option></select><button type="button" onClick={addSocialMedia} className="px-4 py-2 bg-[#157A4F] text-white rounded-lg font-medium hover:bg-[#0f5c3d] transition">Add</button></div><div className="flex gap-2"><input value={socialInput.url} onChange={(e) => setSocialInput({ ...socialInput, url: e.target.value })} placeholder="https://facebook.com/yourpage" className={inputStyle} /></div><div className="flex flex-wrap gap-2 mt-3">{socialMedia.map((item) => (<span key={item.id} className="flex items-center gap-2 px-3 py-2 bg-[#157A4F] text-white rounded-full text-sm"><span>{item.platform}: {item.url}</span><button type="button" onClick={() => removeSocialMedia(item.id)} className="text-white hover:text-red-200">×</button></span>))}</div></div></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Campaign Name</label><input value={businessCampaignName} onChange={(e) => setBusinessCampaignName(e.target.value)} placeholder="Summer Sale 2026" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Valid Till</label><div className="relative"><input type="text" placeholder="Click to select date" readOnly className={inputStyle + " cursor-pointer"} value={validTillDate ? formatDate(validTillDate) : ""} onClick={() => setOpenCalendar(openCalendar === "validTill" ? null : "validTill")} />{openCalendar === "validTill" && (<div className="absolute top-14 left-0 bg-[#FFF3D6] p-4 rounded-2xl border border-gray-200 shadow-xl z-20"><DayPicker mode="single" selected={validTillDate} onSelect={(date) => { setValidTillDate(date); setOpenCalendar(null); }} month={calendarDateMonth} onMonthChange={setCalendarDateMonth} fromDate={new Date()} /></div>)}</div></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Campaign Description</label><textarea value={businessCampaignDescription} onChange={(e) => setBusinessCampaignDescription(e.target.value)} placeholder="Describe your campaign details..." className={inputStyle + " resize-none h-24"} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Shop Address</label><input value={businessShopAddress} onChange={(e) => setBusinessShopAddress(e.target.value)} placeholder="123 Business Street, City, State" className={inputStyle} /></div>
              </div>
            )}

            {selectedCategory.name === "Travel" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Package Type</label><select value={travelPackageType} onChange={(e) => setTravelPackageType(e.target.value)} className={inputStyle}><option value="">Select Package Type</option><option value="Tour Package">Tour Package</option><option value="Bus Rental">Bus Rental</option><option value="Hotel Only">Hotel Only</option><option value="Other">Other</option></select></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Destination</label><input value={travelDestination} onChange={(e) => setTravelDestination(e.target.value)} placeholder="e.g. Paris, Rome, Venice" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Duration</label><input value={travelDuration} onChange={(e) => setTravelDuration(e.target.value)} placeholder="7 days" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Travel Date</label><div className="relative"><input type="text" placeholder="Click to select date" readOnly className={inputStyle + " cursor-pointer"} value={travelDate ? formatDate(travelDate) : ""} onClick={() => setOpenCalendar(openCalendar === "travelDate" ? null : "travelDate")} />{openCalendar === "travelDate" && (<div className="absolute top-14 left-0 bg-[#FFF3D6] p-4 rounded-2xl border border-gray-200 shadow-xl z-20"><DayPicker mode="single" selected={travelDate} onSelect={(date) => { setTravelDate(date); setOpenCalendar(null); }} month={calendarDateMonth} onMonthChange={setCalendarDateMonth} fromDate={new Date()} /></div>)}</div></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Inclusions</label><textarea value={travelInclusions} onChange={(e) => setTravelInclusions(e.target.value)} placeholder="Flights, Hotels, Meals, Tours..." className={inputStyle + " resize-none h-20"} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Exclusions</label><textarea value={travelExclusions} onChange={(e) => setTravelExclusions(e.target.value)} placeholder="Personal expenses, Travel insurance..." className={inputStyle + " resize-none h-20"} /></div>
                <div><label className="text-sm font-medium text-gray-700">Price Per Person</label><input value={travelPricePerPerson} onChange={(e) => setTravelPricePerPerson(e.target.value)} placeholder="₹25,000" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Available Seats</label><input value={travelAvailableSeats} onChange={(e) => setTravelAvailableSeats(e.target.value)} placeholder="20" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Pickup Location</label><input value={travelPickupLocation} onChange={(e) => setTravelPickupLocation(e.target.value)} placeholder="Airport, Hotel, City Center" className={inputStyle} /></div>
              </div>
            )}

            {selectedCategory.name === "Astrology" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Service Type</label><select value={astrologyServiceType} onChange={(e) => setAstrologyServiceType(e.target.value)} className={inputStyle}><option value="">Select Service Type</option><option value="Horoscope">Horoscope</option><option value="Kundali">Kundali</option><option value="Palm Reading">Palm Reading</option><option value="Vastu">Vastu</option><option value="Other">Other</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Experience</label><input value={astrologyExperience} onChange={(e) => setAstrologyExperience(e.target.value)} placeholder="15 years" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Consultation Fee</label><input value={astrologyConsultationFee} onChange={(e) => setAstrologyConsultationFee(e.target.value)} placeholder="₹500" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Consultation Mode</label><div className="flex gap-4"><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${consultationMode === "Online" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700 hover:bg-[#F5B849] hover:text-white"}`} onClick={() => setConsultationMode("Online")}>Online</button><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${consultationMode === "Offline" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700 hover:bg-[#F5B849] hover:text-white"}`} onClick={() => setConsultationMode("Offline")}>Offline</button><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${consultationMode === "Both" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700 hover:bg-[#F5B849] hover:text-white"}`} onClick={() => setConsultationMode("Both")}>Both</button></div></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Languages Spoken</label><input value={astrologyLanguagesSpoken} onChange={(e) => setAstrologyLanguagesSpoken(e.target.value)} placeholder="Hindi, English, Marathi" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Availability Time</label><input value={astrologyAvailabilityTime} onChange={(e) => setAstrologyAvailabilityTime(e.target.value)} placeholder="Monday-Friday: 10 AM - 6 PM" className={inputStyle} /></div>
              </div>
            )}

            {selectedCategory.name === "Property" && selectedSub === "Rent" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Property Type</label><select value={propertyTypeRent} onChange={(e) => setPropertyTypeRent(e.target.value)} className={inputStyle}><option value="">Select Property Type</option><option value="Commercial">Commercial</option><option value="Plot">Plot</option><option value="Residential">Residential</option><option value="Office">Office</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Monthly Rent</label><input value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} placeholder="₹25,000" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Security Deposit</label><input value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} placeholder="₹75,000" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Maintenance Cost Per Month</label><input value={maintenanceCost} onChange={(e) => setMaintenanceCost(e.target.value)} placeholder="₹2,000" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Available From</label><div className="relative"><input type="text" placeholder="Click to select date" readOnly className={inputStyle + " cursor-pointer"} value={availableFromDate ? formatDate(availableFromDate) : ""} onClick={() => setOpenCalendar(openCalendar === "availableFrom" ? null : "availableFrom")} />{openCalendar === "availableFrom" && (<div className="absolute top-14 left-0 bg-[#FFF3D6] p-4 rounded-2xl border border-gray-200 shadow-xl z-20"><DayPicker mode="single" selected={availableFromDate} onSelect={(date) => { setAvailableFromDate(date); setOpenCalendar(null); }} month={calendarDateMonth} onMonthChange={setCalendarDateMonth} fromDate={new Date()} /></div>)}</div></div>
                <div><label className="text-sm font-medium text-gray-700">Preferred Tenant</label><select value={preferredTenant} onChange={(e) => setPreferredTenant(e.target.value)} className={inputStyle}><option value="">Select Tenant Type</option><option value="Family">Family</option><option value="Bachelor">Bachelor</option><option value="Company">Company</option></select></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Lease Duration</label><input value={leaseDuration} onChange={(e) => setLeaseDuration(e.target.value)} placeholder="6 months or 1 year" className={inputStyle} /></div>
              </div>
            )}

            {selectedCategory.name === "Property" && selectedSub === "Sell" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Property Type</label><select value={propertyTypeSell} onChange={(e) => setPropertyTypeSell(e.target.value)} className={inputStyle}><option value="">Select Property Type</option><option value="Apartment">Apartment</option><option value="House">House</option><option value="Plot">Plot</option><option value="Commercial">Commercial</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">BHK</label><input placeholder="2 BHK" value={bhk} onChange={(e) => setBhk(e.target.value)} className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Built-up Area</label><input value={builtUpArea} onChange={(e) => setBuiltUpArea(e.target.value)} placeholder="1200 sq.ft" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Furnishing</label><select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className={inputStyle}><option value="">Select Furnishing</option><option value="Furnished">Furnished</option><option value="Semi-Furnished">Semi-Furnished</option><option value="Unfurnished">Unfurnished</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Bathrooms</label><input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="2" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Parking Available</label><div className="flex gap-4"><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${parkingAvailable === "Yes" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setParkingAvailable("Yes")}>Yes</button><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${parkingAvailable === "No" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setParkingAvailable("No")}>No</button></div></div>
                <div><label className="text-sm font-medium text-gray-700">Floor</label><input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="3rd Floor" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Property Age</label><input value={age} onChange={(e) => setAge(e.target.value)} placeholder="5 years" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Facing Side</label><input value={facingSide} onChange={(e) => setFacingSide(e.target.value)} placeholder="North, East, South, West" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Asking Price</label><input value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} placeholder="₹40,00,000" className={inputStyle} /></div>
              </div>
            )}

            {selectedCategory.name === "Public Notice" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Notice Type</label><select value={noticeType} onChange={(e) => setNoticeType(e.target.value)} className={inputStyle}><option value="">Select Notice Type</option><option value="Tender">Tender</option><option value="Government">Government</option><option value="Legal">Legal</option><option value="Announcement">Announcement</option></select></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Issuing Authority</label><input placeholder="Department Name/Organization Name" value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Detailed Notice</label><textarea placeholder="Enter complete notice details..." value={detailedNotice} onChange={(e) => setDetailedNotice(e.target.value)} className={inputStyle + " resize-none h-32"} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Supporting Documents</label><div className="space-y-3"><label className="flex items-center justify-center h-20 px-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#157A4F] hover:bg-[#FFF3D6] transition"><input type="file" multiple className="hidden" onChange={handleDocumentUpload} /><span className="text-gray-600 font-medium">Click to upload documents</span></label><div className="flex flex-wrap gap-2">{supportingDocuments.map((doc) => (<span key={doc.id} className="flex items-center gap-2 px-3 py-2 bg-[#157A4F] text-white rounded-full text-sm"><span>📄 {doc.name}</span><button type="button" onClick={() => removeDocument(doc.id)} className="text-white hover:text-red-200">×</button></span>))}</div></div></div>
              </div>
            )}

            {selectedCategory.name === "Lost & Found" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Status</label><div className="flex gap-4"><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${lfStatus === "Lost" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setLfStatus("Lost")}>Lost</button><button type="button" className={`px-6 py-2 rounded-full text-sm font-medium ${lfStatus === "Found" ? "bg-[#157A4F] text-white shadow-md" : "bg-[#FFF3D6] text-gray-700"}`} onClick={() => setLfStatus("Found")}>Found</button></div></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Item Type</label><input placeholder="e.g. Phone, Wallet, Keys, Jewelry" value={itemType} onChange={(e) => setItemType(e.target.value)} className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Item Name</label><input placeholder="iPhone 15 Pro Max, Brown Leather Wallet" value={itemName} onChange={(e) => setItemName(e.target.value)} className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Date</label><div className="relative"><input type="text" placeholder="Click to select date" readOnly className={inputStyle + " cursor-pointer"} value={lfDate ? formatDate(lfDate) : ""} onClick={() => setOpenCalendar(openCalendar === "lfDate" ? null : "lfDate")} />{openCalendar === "lfDate" && (<div className="absolute top-14 left-0 bg-[#FFF3D6] p-4 rounded-2xl border border-gray-200 shadow-xl z-20"><DayPicker mode="single" selected={lfDate} onSelect={(date) => { setLfDate(date); setOpenCalendar(null); }} month={calendarDateMonth} onMonthChange={setCalendarDateMonth} fromDate={new Date()} /></div>)}</div></div>
                <div><label className="text-sm font-medium text-gray-700">Location</label><input placeholder="Bandra, Mumbai" value={lfLocation} onChange={(e) => setLfLocation(e.target.value)} className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Description</label><textarea placeholder="Describe the item, markings, condition..." value={lfDescription} onChange={(e) => setLfDescription(e.target.value)} className={inputStyle + " resize-none h-24"} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Reward Amount (Optional)</label><input placeholder="₹5,000 or No Reward" value={reward} onChange={(e) => setReward(e.target.value)} className={inputStyle} /></div>
              </div>
            )}

            {selectedCategory.name === "Service" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Service Category</label><select value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} className={inputStyle}><option value="">Select Service Category</option><option value="Plumbing">Plumbing</option><option value="Electrical">Electrical</option><option value="Carpentry">Carpentry</option><option value="Cleaning">Cleaning</option><option value="Beauty">Beauty</option><option value="IT Support">IT Support</option><option value="Tutoring">Tutoring</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Years of Experience</label><input placeholder="8 years" value={serviceExperience} onChange={(e) => setServiceExperience(e.target.value)} className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Service Charges</label><input placeholder="₹500 per hour" value={charges} onChange={(e) => setCharges(e.target.value)} className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Service Area</label><input placeholder="Mumbai Central, Bandra, Andheri" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Available Time</label><input placeholder="9 AM - 6 PM, Monday to Saturday" value={availableTime} onChange={(e) => setAvailableTime(e.target.value)} className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Service Bio & Skills</label><textarea placeholder="Describe your expertise, certifications, special skills..." value={serviceBio} onChange={(e) => setServiceBio(e.target.value)} className={inputStyle + " resize-none h-24"} /></div>
                <div className="col-span-2"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={available24x7} onChange={(e) => setAvailable24x7(e.target.checked)} className="w-4 h-4 border border-gray-300 rounded accent-[#157A4F]" /><span className="text-sm font-medium text-gray-700">Available 24/7</span></label></div>
              </div>
            )}

            {selectedCategory.name === "Personal" && (
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-700">Name</label><input value={personalName} onChange={(e) => setPersonalName(e.target.value)} placeholder="Full name" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Achievement Title</label><input value={personalAchievementTitle} onChange={(e) => setPersonalAchievementTitle(e.target.value)} placeholder="e.g. Award-winning Poet" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Age</label><input value={personalAge} onChange={(e) => setPersonalAge(e.target.value)} placeholder="Age" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Gender</label><select value={personalGender} onChange={(e) => setPersonalGender(e.target.value)} className={inputStyle}><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Description</label><textarea value={personalDescription} onChange={(e) => setPersonalDescription(e.target.value)} placeholder="Brief description about yourself" className={inputStyle + " resize-none h-24"} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Contact</label><input value={personalContact} onChange={(e) => setPersonalContact(e.target.value)} placeholder="Phone or email" className={inputStyle} /></div>
              </div>
            )}

            {selectedCategory.name === "Employment" && (
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-700">Job Title</label><input value={employmentJobTitle} onChange={(e) => setEmploymentJobTitle(e.target.value)} placeholder="e.g. Software Engineer" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Company Name</label><input value={employmentCompanyName} onChange={(e) => setEmploymentCompanyName(e.target.value)} placeholder="Company Name" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Employment Type</label><select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputStyle}><option value="">Select Type</option><option value="Full Time">Full Time</option><option value="Part Time">Part Time</option><option value="Contract">Contract</option><option value="Internship">Internship</option><option value="Freelance">Freelance</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Experience</label><input value={employmentExperience} onChange={(e) => setEmploymentExperience(e.target.value)} placeholder="e.g. 3 years" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Salary Range (monthly)</label><input value={employmentSalaryRange} onChange={(e) => setEmploymentSalaryRange(e.target.value)} placeholder="e.g. ₹20,000 - ₹35,000" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Industry</label><input value={employmentIndustry} onChange={(e) => setEmploymentIndustry(e.target.value)} placeholder="Industry (e.g. IT)" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Job Description</label><textarea value={employmentJobDescription} onChange={(e) => setEmploymentJobDescription(e.target.value)} placeholder="Describe role and responsibilities" className={inputStyle + " resize-none h-24"} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Requirements</label><textarea value={employmentRequirements} onChange={(e) => setEmploymentRequirements(e.target.value)} placeholder="List required skills/qualifications" className={inputStyle + " resize-none h-20"} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Benefits & Perks</label><input value={employmentBenefits} onChange={(e) => setEmploymentBenefits(e.target.value)} placeholder="e.g. Health insurance, Paid leave" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Total Vacancies</label><input value={employmentVacancies} onChange={(e) => setEmploymentVacancies(e.target.value)} placeholder="Number of openings" className={inputStyle} /></div>
              </div>
            )}


            {selectedCategory.name === "Pets" && (
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-700">Animal Species</label><input value={petSpecies} onChange={(e) => setPetSpecies(e.target.value)} placeholder="e.g. Dog, Cat" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Pet Breed</label><input value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="Breed (if known)" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Age</label><input value={petAge} onChange={(e) => setPetAge(e.target.value)} placeholder="Pet age" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Gender</label><select value={petGender} onChange={(e) => setPetGender(e.target.value)} className={inputStyle}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Weight</label><input value={petWeight} onChange={(e) => setPetWeight(e.target.value)} placeholder="Weight (kg)" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Temperament (multiple)</label><div className="flex flex-wrap gap-2 mt-2">
                  {['friendly', 'active', 'quiet', 'protective', 'kid friendly'].map((temp) => (
                    <label key={temp} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full cursor-pointer"><input type="checkbox" checked={petTemperament.includes(temp)} onChange={(e) => {
                      if (e.target.checked) setPetTemperament([...petTemperament, temp]); else setPetTemperament(petTemperament.filter(t => t !== temp));
                    }} className="w-4 h-4" /> <span className="text-sm capitalize">{temp}</span></label>
                  ))}
                </div></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Special Diet / Needs</label><input value={petSpecialDiet} onChange={(e) => setPetSpecialDiet(e.target.value)} placeholder="Any special diet or medical needs" className={inputStyle} /></div>
              </div>
            )}

            {selectedCategory.name === "Mobiles" && (
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-700">Brand</label><input value={mobileBrand} onChange={(e) => setMobileBrand(e.target.value)} placeholder="e.g. Apple, Samsung" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Model</label><input value={mobileModel} onChange={(e) => setMobileModel(e.target.value)} placeholder="Model name/number" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Condition</label><select value={mobileCondition} onChange={(e) => setMobileCondition(e.target.value)} className={inputStyle}><option value="">Select Condition</option><option value="New">New</option><option value="Like New">Like New</option><option value="Fair">Fair</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Warranty Remaining</label><input value={mobileWarranty} onChange={(e) => setMobileWarranty(e.target.value)} placeholder="e.g. 6 months" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Price</label><input value={mobilePrice} onChange={(e) => setMobilePrice(e.target.value)} placeholder="₹" className={inputStyle} /></div>
                <div className="flex items-center gap-3"><input type="checkbox" checked={mobileNegotiable} onChange={(e) => setMobileNegotiable(e.target.checked)} className="w-4 h-4" /><span className="text-sm font-medium text-gray-700">Price Negotiable</span></div>
              </div>
            )}

            {(selectedCategory.name === "Electronics" || selectedCategory.name === "Electronics & Home appliances") && (
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-700">Appliance Name</label><input value={electronicAppliance} onChange={(e) => setElectronicAppliance(e.target.value)} placeholder="e.g. Washing Machine" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Brand</label><input value={electronicBrand} onChange={(e) => setElectronicBrand(e.target.value)} placeholder="Brand" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Model Name/Number</label><input value={electronicModel} onChange={(e) => setElectronicModel(e.target.value)} placeholder="Model" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Condition</label><select value={electronicCondition} onChange={(e) => setElectronicCondition(e.target.value)} className={inputStyle}><option value="">Select Condition</option><option value="New">New</option><option value="Like New">Like New</option><option value="Fair">Fair</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Warranty Remaining</label><input value={electronicWarranty} onChange={(e) => setElectronicWarranty(e.target.value)} placeholder="e.g. 1 year" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Price</label><input value={electronicPrice} onChange={(e) => setElectronicPrice(e.target.value)} placeholder="₹" className={inputStyle} /></div>
                <div className="flex items-center gap-3"><input type="checkbox" checked={electronicNegotiable} onChange={(e) => setElectronicNegotiable(e.target.checked)} className="w-4 h-4" /><span className="text-sm font-medium text-gray-700">Price Negotiable</span></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Capacity (kg/L/etc)</label><input value={electronicCapacity} onChange={(e) => setElectronicCapacity(e.target.value)} placeholder="e.g. 7 kg, 500 L" className={inputStyle} /></div>
              </div>
            )}

            {selectedCategory.name === "Furniture" && (
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-700">Furniture Type</label><input value={furnitureTypeInput} onChange={(e) => setFurnitureTypeInput(e.target.value)} placeholder="e.g. Sofa, Dining Table" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Material</label><input value={furnitureMaterial} onChange={(e) => setFurnitureMaterial(e.target.value)} placeholder="e.g. Wood, Metal" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Condition</label><select value={furnitureCondition} onChange={(e) => setFurnitureCondition(e.target.value)} className={inputStyle}><option value="">Select Condition</option><option value="New">New</option><option value="Like New">Like New</option><option value="Fair">Fair</option></select></div>
                <div><label className="text-sm font-medium text-gray-700">Seating Capacity / Size</label><input value={furnitureSize} onChange={(e) => setFurnitureSize(e.target.value)} placeholder="e.g. 3 seater / 6ft x 3ft" className={inputStyle} /></div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <input
                    value={furniturePrice}
                    onChange={(e) => setFurniturePrice(e.target.value)}
                    placeholder="₹"
                    className={inputStyle}
                  />
                </div>
                <div className="flex items-center gap-3"><input type="checkbox" checked={furnitureNegotiable} onChange={(e) => setFurnitureNegotiable(e.target.checked)} className="w-4 h-4" /><span className="text-sm font-medium text-gray-700">Price Negotiable</span></div>
              </div>
            )}

            {selectedCategory.name === "Greetings & Tributes" && selectedSub === "Greetings" && (
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-700">Name of the Person</label><input value={greetingPersonName} onChange={(e) => setGreetingPersonName(e.target.value)} placeholder="e.g. John" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Age Turning</label><input value={greetingAgeTurning} onChange={(e) => setGreetingAgeTurning(e.target.value)} placeholder="e.g. 25" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Date of Birthday</label><div className="relative"><input type="text" placeholder="Click to select date" readOnly className={inputStyle + " cursor-pointer"} value={greetingBirthday ? formatDate(greetingBirthday) : ""} onClick={() => setOpenCalendar(openCalendar === "greetingBday" ? null : "greetingBday")} />{openCalendar === "greetingBday" && (<div className="absolute top-14 left-0 bg-[#FFF3D6] p-4 rounded-2xl border border-gray-200 shadow-xl z-20"><DayPicker mode="single" selected={greetingBirthday} onSelect={(date) => { setGreetingBirthday(date); setOpenCalendar(null); }} month={calendarDateMonth} onMonthChange={setCalendarDateMonth} /></div>)}</div></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Your Message / Wishes</label><textarea value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} placeholder="Share your heartfelt message and wishes..." className={inputStyle + " resize-none h-24"} /></div>
                <div><label className="text-sm font-medium text-gray-700">From (Your Name)</label><input value={greetingFromName} onChange={(e) => setGreetingFromName(e.target.value)} placeholder="Your name" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Relationship</label><select value={greetingRelationship} onChange={(e) => setGreetingRelationship(e.target.value)} className={inputStyle}><option value="">Select Relationship</option><option value="Friend">Friend</option><option value="Sister">Sister</option><option value="Brother">Brother</option><option value="Parent">Parent</option><option value="Relative">Relative</option><option value="Colleague">Colleague</option><option value="Other">Other</option></select></div>
              </div>
            )}

            {selectedCategory.name === "Greetings & Tributes" && selectedSub === "Tributes" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Full Name of Deceased</label><input value={tributeFullName} onChange={(e) => setTributeFullName(e.target.value)} placeholder="Full name of the deceased" className={inputStyle} /></div>
                <div><label className="text-sm font-medium text-gray-700">Date of Birth</label><div className="relative"><input type="text" placeholder="Click to select date" readOnly className={inputStyle + " cursor-pointer"} value={tributeDateOfBirth ? formatDate(tributeDateOfBirth) : ""} onClick={() => setOpenCalendar(openCalendar === "tributeDob" ? null : "tributeDob")} />{openCalendar === "tributeDob" && (<div className="absolute top-14 left-0 bg-[#FFF3D6] p-4 rounded-2xl border border-gray-200 shadow-xl z-20"><DayPicker mode="single" selected={tributeDateOfBirth} onSelect={(date) => { setTributeDateOfBirth(date); setOpenCalendar(null); }} month={calendarDateMonth} onMonthChange={setCalendarDateMonth} /></div>)}</div></div>
                <div><label className="text-sm font-medium text-gray-700">Age</label><input value={tributeAge} onChange={(e) => setTributeAge(e.target.value)} placeholder="Age at the time of passing" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Short Biography / Life Summary</label><textarea value={tributeBiography} onChange={(e) => setTributeBiography(e.target.value)} placeholder="Share memories and life achievements..." className={inputStyle + " resize-none h-32"} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Funeral / Prayer Meeting Details (Optional)</label><textarea value={tributeFuneralDetails} onChange={(e) => setTributeFuneralDetails(e.target.value)} placeholder="Venue, date, time, and other details (optional)" className={inputStyle + " resize-none h-20"} /></div>
              </div>
            )}

            {selectedCategory.name === "Other" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Title</label><input value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} placeholder="Title for your listing" className={inputStyle} /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Description</label><textarea value={otherDescription} onChange={(e) => setOtherDescription(e.target.value)} placeholder="Describe the item" className={inputStyle + " resize-none h-24"} /></div>
                <div><label className="text-sm font-medium text-gray-700">Price</label><input value={otherPrice} onChange={(e) => setOtherPrice(e.target.value)} placeholder="₹ (optional)" className={inputStyle} /></div>
              </div>
            )}
          </div>
        )}

        {/* Media Upload */}
        {(!templateId || templateId === 1 || templateId === 2) && (
          <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
            <h3 className="font-semibold text-2xl mb-6 text-gray-800">
              Media & Photos
            </h3>

            <div className="grid grid-cols-4 gap-6">
              {uploadedImages.map((image, index) => (
                <div
                  key={index}
                  className="h-32 border border-gray-200 rounded-2xl relative overflow-hidden shadow-sm"
                >
                  <img
                    src={image.url}
                    alt={`uploaded-${index}`}
                    className="h-full w-full object-contain bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <label
                className="h-32 flex items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer text-gray-400 hover:border-[#157A4F] hover:text-[#157A4F] transition bg-[#FFF3D6]"
                onClick={(e) => {
                  // prevent opening dialog if already at limit for single-media templates
                  if (templateId === 2 && uploadedImages.length >= 1) {
                    e.preventDefault();
                    setMediaError("You can only upload one media for this template.");
                  }
                }}
              >
                + Add
                <input
                  type="file"
                  multiple={templateId === 1}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              {mediaError && (
                <p className="col-span-full text-red-500 text-sm mt-1">{mediaError}</p>
              )}
            </div>
          </div>
        )}

        {/* Scheduling */}
        <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">

          <h3 className="font-semibold text-2xl text-gray-800 mb-8 text-center">
            Ad Scheduling
          </h3>

          <div className="grid md:grid-cols-2 gap-8 items-start">

            {/* LEFT COLUMN — CALENDAR */}
            <div className="space-y-6">

              {/* Month & Year Selectors */}
              <div className="flex gap-4 justify-center">
                <select
                  className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#157A4F] focus:outline-none transition"
                  value={currentMonth.getMonth()}
                  onChange={(e) =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), Number(e.target.value), 1)
                    )
                  }
                >
                  {months.map((month, i) => (
                    <option key={i} value={i}>{month}</option>
                  ))}
                </select>

                <select
                  className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#157A4F] focus:outline-none transition"
                  value={currentMonth.getFullYear()}
                  onChange={(e) =>
                    setCurrentMonth(
                      new Date(Number(e.target.value), currentMonth.getMonth(), 1)
                    )
                  }
                >
                  {years.map((year, i) => (
                    <option key={i} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Calendar Card */}
              <div className="bg-[#FFF3D6] p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-center">
                <DayPicker
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={setSelectedDates}
                  fromDate={new Date()}
                  disabled={{ before: new Date() }}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="text-sm"
                />
              </div>

            </div>

            {/* RIGHT COLUMN — SELECTED DATES */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 shadow-inner flex flex-col h-[420px]">

              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-700">
                  Selected Dates
                </h4>

                {selectedDates.length > 0 && (
                  <span className="bg-[#157A4F] text-white px-3 py-1 rounded-lg text-xs font-medium shadow">
                    {selectedDates.length} Day{selectedDates.length > 1 && "s"}
                  </span>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#157A4F]/60 scrollbar-track-transparent">

                {selectedDates.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {[...selectedDates].sort((a, b) => new Date(a) - new Date(b)).map((date, index) => (
                      <span
                        key={index}
                        className="bg-[#157A4F] text-white px-4 py-2 rounded-full text-sm shadow-md hover:scale-105 transition"
                      >
                        {formatDate(date)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No dates selected yet
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>


      </div>

    </div>
  );
}