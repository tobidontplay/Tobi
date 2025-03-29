import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Edit2, Package, User, Mail, Phone, FileText, Image, Video, DollarSign, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

interface OrderConfirmationProps {
  onBack: () => void;
  onConfirm: () => void;
  onModify: () => void;
  orderDetails: {
    userInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      frameSpecifications: string;
      specialRequests: string;
      triggerImage: File | null;
      celebrationVideos: File[];
    };
    selectedSize: string;
    selectedCountry: string;
  };
}

export default function OrderConfirmation({ onBack, onConfirm, onModify, orderDetails }: OrderConfirmationProps) {
  const { userInfo, selectedSize, selectedCountry } = orderDetails;
  const [expandedSections, setExpandedSections] = useState({
    frameDetails: true,
    customerInfo: true,
    customSpecs: true,
    mediaFiles: true,
    pricing: true
  });
  
  // Calculate price based on country and size
  const basePrice = selectedCountry === 'Naija' ? 45000 : 99.99;
  const sizeMultiplier = selectedSize.includes('24"') ? 1.5 : selectedSize.includes('18"') ? 1.25 : 1;
  const totalPrice = basePrice * sizeMultiplier;
  
  const formatPrice = (price: number) => {
    if (selectedCountry === 'Naija') {
      return `₦${price.toLocaleString()}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

    // Read More Text Component
  const ReadMoreText = ({ text, maxLength = 150 }: { text: string; maxLength?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = text.length > maxLength;
    
    // Simplify the handler to just toggle the state
    const handleToggle = () => {
      setIsExpanded(!isExpanded);
    };
    
    if (!shouldTruncate) {
      return (
        <div className="font-medium bg-purple-900/10 p-3 rounded overflow-hidden">
          <p className="break-words whitespace-pre-wrap">{text}</p>
        </div>
      );
    }
    
    return (
      <div className="font-medium bg-purple-900/10 p-3 rounded overflow-hidden">
        {!isExpanded ? (
          <div>
            <p className="break-words">{text.substring(0, maxLength)}...</p>
            <button 
              type="button"
              onClick={handleToggle}
              className="mt-2 inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Read More <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <p className="break-words whitespace-pre-wrap">{text}</p>
            <button 
              type="button"
              onClick={handleToggle}
              className="mt-2 inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Show Less <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section, 
    iconColor = 'text-purple-400' 
  }: { 
    title: string; 
    icon: React.ElementType; 
    section: keyof typeof expandedSections; 
    iconColor?: string;
  }) => (
    <div 
      className="flex items-center justify-between cursor-pointer py-3"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-6 h-6 ${iconColor}`} />
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      {expandedSections[section] ? 
        <ChevronUp className="w-5 h-5 text-purple-400" /> : 
        <ChevronDown className="w-5 h-5 text-purple-400" />
      }
    </div>
  );

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
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Complete Order Summary</h1>
          <p className="text-xl text-gray-300">
            Please review all details of your order before proceeding to payment
          </p>
        </div>

        <div className="space-y-6">
          {/* Frame Details */}
          <div className="bg-purple-900/20 rounded-lg p-6 shadow-lg shadow-purple-900/10">
            <SectionHeader title="Frame Specifications" icon={Package} section="frameDetails" />
            
            {expandedSections.frameDetails && (
              <div className="space-y-4 mt-4 pl-2 border-l-2 border-purple-500/30">
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <span className="text-gray-300">Frame Size</span>
                  <span className="font-medium">{selectedSize}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <span className="text-gray-300">Region</span>
                  <span className="font-medium">{selectedCountry}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <span className="text-gray-300">Material</span>
                  <span className="font-medium">Premium Wood Composite</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <span className="text-gray-300">Finish</span>
                  <span className="font-medium">Matte Black</span>
                </div>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="bg-purple-900/20 rounded-lg p-6 shadow-lg shadow-purple-900/10">
            <SectionHeader title="Customer Information" icon={User} section="customerInfo" />
            
            {expandedSections.customerInfo && (
              <div className="space-y-4 mt-4 pl-2 border-l-2 border-purple-500/30">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <User className="w-4 h-4" />
                      <p className="text-gray-300">Full Name</p>
                    </div>
                    <p className="font-medium">{userInfo.firstName} {userInfo.lastName}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <Mail className="w-4 h-4" />
                      <p className="text-gray-300">Email</p>
                    </div>
                    <p className="font-medium">{userInfo.email}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <Phone className="w-4 h-4" />
                      <p className="text-gray-300">Phone</p>
                    </div>
                    <p className="font-medium">{userInfo.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customization Options */}
          <div className="bg-purple-900/20 rounded-lg p-6 shadow-lg shadow-purple-900/10">
            <SectionHeader title="Customization Options" icon={FileText} section="customSpecs" />
            
            {expandedSections.customSpecs && (
              <div className="space-y-4 mt-4 pl-2 border-l-2 border-purple-500/30">
                <div>
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <FileText className="w-4 h-4" />
                    <p className="text-gray-300">Frame Requirements</p>
                  </div>
                  <ReadMoreText text={userInfo.frameSpecifications} maxLength={150} />
                </div>
                {userInfo.specialRequests && (
                  <div>
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <FileText className="w-4 h-4" />
                      <p className="text-gray-300">Special Requests</p>
                    </div>
                    <ReadMoreText text={userInfo.specialRequests} maxLength={150} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Media Files */}
          <div className="bg-purple-900/20 rounded-lg p-6 shadow-lg shadow-purple-900/10">
            <SectionHeader title="Media Files" icon={Image} section="mediaFiles" />
            
            {expandedSections.mediaFiles && (
              <div className="space-y-4 mt-4 pl-2 border-l-2 border-purple-500/30">
                <div>
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Image className="w-4 h-4" />
                    <p className="text-gray-300">Trigger Image</p>
                  </div>
                  {userInfo.triggerImage ? (
                    <div className="bg-purple-900/10 p-3 rounded">
                      <p className="font-medium">{userInfo.triggerImage.name}</p>
                      <p className="text-sm text-gray-400">{(userInfo.triggerImage.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">No trigger image uploaded</p>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-purple-400 mb-1">
                    <Video className="w-4 h-4" />
                    <p className="text-gray-300">Celebration Videos ({userInfo.celebrationVideos.length})</p>
                  </div>
                  {userInfo.celebrationVideos.length > 0 ? (
                    <div className="space-y-2">
                      {userInfo.celebrationVideos.map((video, index) => (
                        <div key={index} className="bg-purple-900/10 p-3 rounded flex justify-between items-center">
                          <p className="font-medium truncate max-w-xs">{video.name}</p>
                          <p className="text-sm text-gray-400">{(video.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No celebration videos uploaded</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="bg-purple-900/20 rounded-lg p-6 shadow-lg shadow-purple-900/10">
            <SectionHeader title="Pricing Breakdown" icon={DollarSign} section="pricing" iconColor="text-green-400" />
            
            {expandedSections.pricing && (
              <div className="space-y-4 mt-4 pl-2 border-l-2 border-purple-500/30">
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <span className="text-gray-300">Base Price</span>
                  <span className="font-medium">{formatPrice(basePrice)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <span className="text-gray-300">Size Adjustment</span>
                  <span className="font-medium">×{sizeMultiplier}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <span className="text-gray-300">Customization Fee</span>
                  <span className="font-medium">{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <span className="text-gray-300">Media Processing</span>
                  <span className="font-medium">{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between items-center py-4 text-xl font-semibold bg-purple-900/30 p-3 rounded-lg mt-2">
                  <span>Total Price</span>
                  <span className="text-green-400">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 mt-8">
            <button
              onClick={onModify}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-semibold transition-all border-2 border-purple-500 hover:border-purple-400 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
            >
              <Edit2 className="w-5 h-5" />
              Modify Order
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30"
            >
              Continue to Payment
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}