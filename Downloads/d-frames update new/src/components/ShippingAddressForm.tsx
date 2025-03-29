import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Check } from 'lucide-react';

// Define the shipping address interface
export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface ShippingAddressFormProps {
  onSubmit: (address: ShippingAddress) => void;
  onBack: () => void;
  initialData?: ShippingAddress;
}

// List of countries for the dropdown
const countries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Nigeria',
  'Ghana',
  'South Africa',
  'Kenya',
  // Add more countries as needed
];

// List of states for US
const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
  'Wisconsin', 'Wyoming'
];

// List of states for Nigeria
const nigeriaStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 
  'Yobe', 'Zamfara'
];

export default function ShippingAddressForm({ onSubmit, onBack, initialData }: ShippingAddressFormProps) {
  const [formData, setFormData] = useState<ShippingAddress>(initialData || {
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    isDefault: true
  });

  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  // Get the appropriate states list based on selected country
  const getStatesList = () => {
    switch (formData.country) {
      case 'United States':
        return usStates;
      case 'Nigeria':
        return nigeriaStates;
      default:
        return [];
    }
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear the error for this field when the user makes a change
    if (errors[name as keyof ShippingAddress]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Validate the form
  const validateForm = () => {
    const newErrors: Partial<ShippingAddress> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State/Province is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal/ZIP code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-950 text-white py-20 px-4">
      <button
        onClick={onBack}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 text-white hover:text-purple-400 transition-colors rounded-full bg-purple-600/20 backdrop-blur-sm hover:bg-purple-600/30"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Shipping Information</h1>
          <p className="text-xl text-gray-300">
            Please provide your shipping details to complete your order.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-purple-900/20 rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-semibold">Shipping Address</h2>
            </div>
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                  errors.fullName ? 'border-red-500' : 'border-purple-500/30'
                } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                placeholder="Enter recipient's full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-300 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                  errors.addressLine1 ? 'border-red-500' : 'border-purple-500/30'
                } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                placeholder="Street address, P.O. box"
              />
              {errors.addressLine1 && (
                <p className="mt-1 text-sm text-red-400">{errors.addressLine1}</p>
              )}
            </div>

            <div>
              <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-300 mb-2">
                Address Line 2 <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-purple-900/20 border border-purple-500/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                    errors.city ? 'border-red-500' : 'border-purple-500/30'
                  } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-400">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-2">
                  State / Province
                </label>
                {getStatesList().length > 0 ? (
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                      errors.state ? 'border-red-500' : 'border-purple-500/30'
                    } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                  >
                    <option value="">Select state/province</option>
                    {getStatesList().map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                      errors.state ? 'border-red-500' : 'border-purple-500/30'
                    } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                    placeholder="Enter state/province"
                  />
                )}
                {errors.state && (
                  <p className="mt-1 text-sm text-red-400">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                    errors.postalCode ? 'border-red-500' : 'border-purple-500/30'
                  } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                  placeholder="Enter postal/ZIP code"
                />
                {errors.postalCode && (
                  <p className="mt-1 text-sm text-red-400">{errors.postalCode}</p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                    errors.country ? 'border-red-500' : 'border-purple-500/30'
                  } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                >
                  <option value="">Select country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-400">{errors.country}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                  errors.phone ? 'border-red-500' : 'border-purple-500/30'
                } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                placeholder="Enter phone number for delivery updates"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
              )}
            </div>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleCheckboxChange}
                className="w-5 h-5 rounded border-purple-500/30 bg-purple-900/20 focus:ring-purple-400 text-purple-600"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-300">
                Save as my default shipping address
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-lg font-semibold transition-all"
            >
              Continue to Payment
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
