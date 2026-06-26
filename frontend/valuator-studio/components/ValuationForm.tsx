"use client";

import { useState } from "react";
import { submitValuation } from "@/lib/api";

interface SubjectProperty {
  square_feet: number;
  bedrooms: number;
  bathrooms: number;
  age_years: number;
  monthly_rent: number;
}

interface ComparableSale {
  sale_price: number;
  square_feet: number;
  bedrooms: number;
  bathrooms: number;
  age_years: number;
}

interface ValuationFormProps {
  onSubmit: (result: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function ValuationForm({ onSubmit, loading, setLoading }: ValuationFormProps) {
  const [subject, setSubject] = useState<SubjectProperty>({
    square_feet: 2000,
    bedrooms: 3,
    bathrooms: 2,
    age_years: 10,
    monthly_rent: 2200,
  });

  const [comparables, setComparables] = useState<ComparableSale[]>([
    { sale_price: 400000, square_feet: 2000, bedrooms: 3, bathrooms: 2, age_years: 10 },
  ]);

  const handleSubjectChange = (field: keyof SubjectProperty, value: string) => {
    setSubject({ ...subject, [field]: parseFloat(value) || 0 });
  };

  const handleComparableChange = (index: number, field: keyof ComparableSale, value: string) => {
    const updated = [...comparables];
    updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    setComparables(updated);
  };

  const addComparable = () => {
    setComparables([
      ...comparables,
      { sale_price: 400000, square_feet: 2000, bedrooms: 3, bathrooms: 2, age_years: 10 },
    ]);
  };

  const removeComparable = (index: number) => {
    setComparables(comparables.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await submitValuation({ subject, comparables });
      onSubmit(result);
    } catch (error) {
      console.error("Valuation error:", error);
      alert("Failed to complete valuation. Please check the API connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Property Details</h2>

      {/* Subject Property */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Subject Property</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject-square-feet" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Square Feet
            </label>
            <input
              id="subject-square-feet"
              type="number"
              value={subject.square_feet}
              onChange={(e) => handleSubjectChange("square_feet", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="subject-monthly-rent" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Monthly Rent
            </label>
            <input
              id="subject-monthly-rent"
              type="number"
              value={subject.monthly_rent}
              onChange={(e) => handleSubjectChange("monthly_rent", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="subject-bedrooms" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bedrooms
            </label>
            <input
              id="subject-bedrooms"
              type="number"
              value={subject.bedrooms}
              onChange={(e) => handleSubjectChange("bedrooms", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="subject-bathrooms" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bathrooms
            </label>
            <input
              id="subject-bathrooms"
              type="number"
              value={subject.bathrooms}
              onChange={(e) => handleSubjectChange("bathrooms", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="subject-age-years" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Age (years)
            </label>
            <input
              id="subject-age-years"
              type="number"
              value={subject.age_years}
              onChange={(e) => handleSubjectChange("age_years", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>
        </div>
      </div>

      {/* Comparable Sales */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            Comparable Sales
          </h3>
          <button
            type="button"
            onClick={addComparable}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            + Add Comparable
          </button>
        </div>

        {comparables.map((comp, index) => (
          <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Comparable #{index + 1}
              </span>
              {comparables.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeComparable(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`comp-${index}-sale-price`} className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Sale Price ($)
                </label>
                <input
                  id={`comp-${index}-sale-price`}
                  type="number"
                  value={comp.sale_price}
                  onChange={(e) => handleComparableChange(index, "sale_price", e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor={`comp-${index}-square-feet`} className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Square Feet
                </label>
                <input
                  id={`comp-${index}-square-feet`}
                  type="number"
                  value={comp.square_feet}
                  onChange={(e) => handleComparableChange(index, "square_feet", e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor={`comp-${index}-bedrooms`} className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Bedrooms
                </label>
                <input
                  id={`comp-${index}-bedrooms`}
                  type="number"
                  value={comp.bedrooms}
                  onChange={(e) => handleComparableChange(index, "bedrooms", e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor={`comp-${index}-bathrooms`} className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Bathrooms
                </label>
                <input
                  id={`comp-${index}-bathrooms`}
                  type="number"
                  value={comp.bathrooms}
                  onChange={(e) => handleComparableChange(index, "bathrooms", e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor={`comp-${index}-age-years`} className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Age (years)
                </label>
                <input
                  id={`comp-${index}-age-years`}
                  type="number"
                  value={comp.age_years}
                  onChange={(e) => handleComparableChange(index, "age_years", e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? "Processing..." : "Calculate Valuation"}
      </button>
    </form>
  );
}
