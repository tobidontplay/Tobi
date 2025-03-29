import { useState, useEffect } from 'react';
import { MapPin, Frame, ArrowRight, ArrowLeft } from 'lucide-react';
import UserInfoForm from './UserInfoForm';
import PaymentSystem from './PaymentSystem';
import OrderConfirmation from './OrderConfirmation';

interface Size {
  dimensions: string;
  visualWidth: string;
}

interface CountryData {
  name: string;
  flag: string;
  sizes: Size[];
}

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  frameSpecifications: string;
  specialRequests: string;
  triggerImage: File | null;
  celebrationVideos: File[];
}

interface PaymentInfo {
  userInfo: UserInfo;
  selectedSize: string;
  selectedCountry: string;
}

const countries: CountryData[] = [
  {
    name: 'United States',
    flag: '🇺🇸',
    sizes: [
      { dimensions: '12" x 18"', visualWidth: 'w-32' },
      { dimensions: '18" x 24"', visualWidth: 'w-40' },
      { dimensions: '24" x 36"', visualWidth: 'w-48' },
    ],
  },
  {
    name: 'Naija',
    flag: '🇳🇬',
    sizes: [
      { dimensions: '8" x 12"', visualWidth: 'w-28' },
      { dimensions: '12" x 15"', visualWidth: 'w-36' },
      { dimensions: '16" x 20"', visualWidth: 'w-44' },
    ],
  },
];

interface JoinMovementProps {
  onBack?: () => void;
}

export default function JoinMovement({ onBack }: JoinMovementProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizes, setShowSizes] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderDetails, setOrderDetails] = useState<PaymentInfo | null>(null);

  useEffect(() => {
    const savedCountry = localStorage.getItem('selectedCountry');
    const savedSize = localStorage.getItem('selectedSize');
    
    if (savedCountry) {
      const country = countries.find(c => c.name === savedCountry);
      if (country) {
        setSelectedCountry(country);
        setShowSizes(true);
      }
    }
    
    if (savedSize) {
      setSelectedSize(savedSize);
    }
  }, []);

  const handleCountrySelect = (country: CountryData) => {
    setSelectedCountry(country);
    setSelectedSize(null);
    setShowSizes(true);
    localStorage.setItem('selectedCountry', country.name);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    localStorage.setItem('selectedSize', size);
  };

  const handleBack = () => {
    if (showPayment) {
      setShowPayment(false);
      setShowConfirmation(true);
    } else if (showConfirmation) {
      setShowConfirmation(false);
      setShowUserInfo(true);
    } else if (showUserInfo) {
      setShowUserInfo(false);
    } else if (showSizes) {
      setShowSizes(false);
      setSelectedCountry(null);
      setSelectedSize(null);
      localStorage.removeItem('selectedCountry');
      localStorage.removeItem('selectedSize');
    } else if (onBack) {
      onBack();
    }
  };

  const handleUserInfoSubmit = (userInfo: UserInfo & { triggerImage: File | null; celebrationVideos: File[] }) => {
    if (selectedCountry && selectedSize) {
      const details = {
        userInfo,
        selectedSize,
        selectedCountry: selectedCountry.name,
      };
      setOrderDetails(details);
      setShowUserInfo(false);
      setShowConfirmation(true);
    }
  };

  const handleConfirmOrder = () => {
    setShowConfirmation(false);
    setShowPayment(true);
  };

  const handleModifyOrder = () => {
    setShowConfirmation(false);
    setShowUserInfo(true);
  };

  if (showPayment && orderDetails) {
    return (
      <PaymentSystem
        onBack={handleBack}
        amount={99.99} // Replace with actual price calculation based on size
        userInfo={orderDetails.userInfo}
        selectedCountry={orderDetails.selectedCountry}
      />
    );
  }

  if (showConfirmation && orderDetails) {
    return (
      <OrderConfirmation
        onBack={handleBack}
        onConfirm={handleConfirmOrder}
        onModify={handleModifyOrder}
        orderDetails={orderDetails}
      />
    );
  }

  if (showUserInfo) {
    return (
      <UserInfoForm
        onSubmit={handleUserInfoSubmit}
        onBack={handleBack}
        initialData={orderDetails?.userInfo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-950 text-white">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 text-white hover:text-purple-400 transition-colors rounded-full bg-purple-600/20 backdrop-blur-sm hover:bg-purple-600/30"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="max-w-6xl mx-auto px-4 py-20">
        {!showSizes ? (
          <div className="space-y-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Select Your Region</h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Choose your location to see available frame sizes and begin your journey with D-frames.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {countries.map((country) => (
                <button
                  key={country.name}
                  onClick={() => handleCountrySelect(country)}
                  className="group relative overflow-hidden rounded-2xl bg-purple-900/20 p-8 transition-all hover:bg-purple-900/30 border border-purple-500/30 hover:border-purple-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{country.flag}</span>
                      <div className="text-left">
                        <h3 className="text-2xl font-semibold">{country.name}</h3>
                        <p className="text-purple-300 flex items-center gap-2 mt-2">
                          <MapPin className="w-4 h-4" />
                          {country.sizes.length} sizes available
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-purple-400 group-hover:translate-x-2 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Select Your Frame Size
                <span className="block text-2xl text-purple-400 mt-2">
                  {selectedCountry?.name} {selectedCountry?.flag}
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Choose the perfect size for your space. Each frame is crafted to bring your memories to life.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {selectedCountry?.sizes.map((size) => (
                <button
                  key={size.dimensions}
                  onClick={() => handleSizeSelect(size.dimensions)}
                  className={`relative overflow-hidden rounded-2xl p-8 transition-all border ${
                    selectedSize === size.dimensions
                      ? 'bg-purple-900/40 border-purple-400'
                      : 'bg-purple-900/20 border-purple-500/30 hover:border-purple-500 hover:bg-purple-900/30'
                  }`}
                >
                  <div className="flex flex-col items-center gap-6">
                    <div className={`${size.visualWidth} aspect-[3/2] bg-purple-400/20 rounded-lg border-2 border-dashed border-purple-400/40 flex items-center justify-center`}>
                      <Frame className="w-8 h-8 text-purple-400/60" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2">{size.dimensions}</h3>
                      <p className="text-purple-300 text-sm">Perfect for {size.dimensions === '24" x 36"' ? 'large walls' : size.dimensions === '8" x 12"' ? 'desks' : 'medium spaces'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => selectedSize && setShowUserInfo(true)}
                disabled={!selectedSize}
                className={`px-8 py-4 rounded-full text-lg font-semibold transition-all flex items-center gap-2 mx-auto ${
                  selectedSize
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-600/50 text-white/50 cursor-not-allowed'
                }`}
              >
                Continue to Customization
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}