
// CO2 emission factors (kg CO2 per unit)
const EMISSION_FACTORS = {
  transport: {
    car: 0.21, // kg CO2 per km
    bus: 0.089, // kg CO2 per km
    bike: 0, // kg CO2 per km
    walk: 0 // kg CO2 per km
  },
  electricity: {
    kwh: 0.5 // kg CO2 per kWh (average)
  },
  food: {
    meat: 6.61, // kg CO2 per serving
    dairy: 3.15, // kg CO2 per serving
    vegetables: 0.43, // kg CO2 per serving
    processed: 2.3 // kg CO2 per serving
  }
};

export const calculateCO2 = (activityData) => {
  let totalCO2 = 0;

  // Transport emissions
  if (activityData.transport) {
    totalCO2 += (activityData.transport.carKm || 0) * EMISSION_FACTORS.transport.car;
    totalCO2 += (activityData.transport.busKm || 0) * EMISSION_FACTORS.transport.bus;
  }

  // Electricity emissions
  if (activityData.electricity) {
    totalCO2 += (activityData.electricity.kwhUsed || 0) * EMISSION_FACTORS.electricity.kwh;
  }

  // Food emissions
  if (activityData.food) {
    totalCO2 += (activityData.food.meat || 0) * EMISSION_FACTORS.food.meat;
    totalCO2 += (activityData.food.dairy || 0) * EMISSION_FACTORS.food.dairy;
    totalCO2 += (activityData.food.vegetables || 0) * EMISSION_FACTORS.food.vegetables;
    totalCO2 += (activityData.food.processed || 0) * EMISSION_FACTORS.food.processed;
  }

  return Math.round(totalCO2 * 100) / 100; // Round to 2 decimal places
};

export const generateEcoTips = (activityData, totalCO2) => {
  const tips = [];

  if (activityData.transport && activityData.transport.carKm > 20) {
    tips.push("Consider using public transport or biking for shorter trips to reduce emissions.");
  }

  if (activityData.electricity && activityData.electricity.kwhUsed > 15) {
    tips.push("Switch to LED bulbs and unplug electronics when not in use to save energy.");
  }

  if (activityData.food && activityData.food.meat > 2) {
    tips.push("Try having one meat-free day per week to reduce your food carbon footprint.");
  }

  if (totalCO2 > 30) {
    tips.push("Your daily emissions are high. Try combining errands into one trip.");
  }

  if (tips.length === 0) {
    tips.push("Great job! You're keeping your carbon footprint low today.");
  }

  return tips;
};
