import React, { useState } from 'react';
import { Upload, Video, ArrowLeft, ArrowRight } from 'lucide-react';

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  frameSpecifications: string;
  specialRequests: string;
}

interface UserInfoFormProps {
  onSubmit: (data: UserInfo & { 
    triggerImage: File | null;
    celebrationVideos: File[];
  }) => void;
  onBack: () => void;
  initialData?: UserInfo & {
    triggerImage: File | null;
    celebrationVideos: File[];
  };
}

export default function UserInfoForm({ onSubmit, onBack, initialData }: UserInfoFormProps) {
  const [formData, setFormData] = useState<UserInfo>(initialData || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    frameSpecifications: '',
    specialRequests: '',
  });
  const [triggerImage, setTriggerImage] = useState<File | null>(initialData?.triggerImage || null);
  const [celebrationVideos, setCelebrationVideos] = useState<File[]>(initialData?.celebrationVideos || []);
  const [errors, setErrors] = useState<Partial<UserInfo & { triggerImage?: string; videos?: string }>>({});

  const handleTriggerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.match('image/(jpeg|png|jpg)')) {
        setTriggerImage(file);
        setErrors((prev) => ({ ...prev, triggerImage: '' }));
      } else {
        setErrors((prev) => ({
          ...prev,
          triggerImage: 'Please upload only JPG, JPEG, or PNG files.',
        }));
      }
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validVideos = files.filter((file) => {
      if (!file.type.match('video/(mp4|quicktime)')) {
        setErrors((prev) => ({
          ...prev,
          videos: 'Please upload only MP4 or MOV files.',
        }));
        return false;
      }
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        setErrors((prev) => ({
          ...prev,
          videos: 'Each video must be under 500MB.',
        }));
        return false;
      }
      return true;
    });

    const totalSize = [...celebrationVideos, ...validVideos].reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 2 * 1024 * 1024 * 1024) { // 2GB total limit
      setErrors((prev) => ({
        ...prev,
        videos: 'Total upload size cannot exceed 2GB.',
      }));
      return;
    }

    setCelebrationVideos((prev) => [...prev, ...validVideos]);
    setErrors((prev) => ({ ...prev, videos: '' }));
  };

  const removeVideo = (index: number) => {
    setCelebrationVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Partial<UserInfo & { triggerImage?: string; videos?: string }> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.frameSpecifications.trim()) {
      newErrors.frameSpecifications = 'Frame specifications are required';
    }
    
    if (!triggerImage) {
      newErrors.triggerImage = 'Please upload a trigger image';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        triggerImage,
        celebrationVideos,
      });
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Create Your Frame</h1>
          <p className="text-xl text-gray-300">
            Tell us about yourself and your preferences to create your perfect frame.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-purple-900/20 rounded-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                    errors.firstName ? 'border-red-500' : 'border-purple-500/30'
                  } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                    errors.lastName ? 'border-red-500' : 'border-purple-500/30'
                  } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                    errors.email ? 'border-red-500' : 'border-purple-500/30'
                  } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                    errors.phone ? 'border-red-500' : 'border-purple-500/30'
                  } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-purple-900/20 rounded-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Preferences</h2>

            <div>
              <label htmlFor="frameSpecifications" className="block text-sm font-medium text-gray-300 mb-2">
                Frame Specifications
              </label>
              <textarea
                id="frameSpecifications"
                value={formData.frameSpecifications}
                onChange={(e) => setFormData({ ...formData, frameSpecifications: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-purple-900/20 border ${
                  errors.frameSpecifications ? 'border-red-500' : 'border-purple-500/30'
                } focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white`}
                rows={4}
                placeholder="Describe your frame requirements (aspect ratio, dimensions, format preferences)"
              />
              {errors.frameSpecifications && (
                <p className="mt-1 text-sm text-red-400">{errors.frameSpecifications}</p>
              )}
            </div>

            <div>
              <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-300 mb-2">
                Special Requests
              </label>
              <textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-purple-900/20 border border-purple-500/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white"
                rows={4}
                placeholder="Any specific editing preferences, effects, transitions, or video adjustments needed"
              />
            </div>
          </div>

          {/* Media Upload */}
          <div className="bg-purple-900/20 rounded-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Media Upload</h2>

            {/* Trigger Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Trigger Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-purple-500/30 border-dashed rounded-lg hover:border-purple-400/50 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-400">
                    <label
                      htmlFor="triggerImage"
                      className="relative cursor-pointer rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="triggerImage"
                        name="triggerImage"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleTriggerImageUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 500MB</p>
                  {triggerImage && (
                    <p className="text-sm text-purple-400">
                      Selected: {triggerImage.name}
                    </p>
                  )}
                </div>
              </div>
              {errors.triggerImage && (
                <p className="mt-2 text-sm text-red-400">{errors.triggerImage}</p>
              )}
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Videos
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-purple-500/30 border-dashed rounded-lg hover:border-purple-400/50 transition-colors">
                <div className="space-y-1 text-center">
                  <Video className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-400">
                    <label
                      htmlFor="videos"
                      className="relative cursor-pointer rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none"
                    >
                      <span>Upload videos</span>
                      <input
                        id="videos"
                        name="videos"
                        type="file"
                        className="sr-only"
                        accept="video/mp4,video/quicktime"
                        multiple
                        onChange={handleVideoUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    MP4, MOV up to 500MB each (2GB total)
                  </p>
                </div>
              </div>
              {celebrationVideos.length > 0 && (
                <div className="mt-4 space-y-2">
                  {celebrationVideos.map((video, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg"
                    >
                      <span className="text-sm text-purple-300">{video.name}</span>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.videos && (
                <p className="mt-2 text-sm text-red-400">{errors.videos}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all"
            >
              Review Order
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}