import React, { useState } from 'react';
import { Upload, Video, PartyPopper, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';

interface CelebrationDetails {
  eventType: string;
  message: string;
  preferences: string;
}

interface CelebrationUploadProps {
  onSubmit: (data: {
    triggerImage: File | null;
    celebrationVideos: File[];
    details: CelebrationDetails;
  }) => void;
  onBack: () => void;
}

export default function CelebrationUpload({ onSubmit, onBack }: CelebrationUploadProps) {
  const [triggerImage, setTriggerImage] = useState<File | null>(null);
  const [celebrationVideos, setCelebrationVideos] = useState<File[]>([]);
  const [details, setDetails] = useState<CelebrationDetails>({
    eventType: '',
    message: '',
    preferences: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
      if (file.size > 100 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          videos: 'Each video must be under 100MB.',
        }));
        return false;
      }
      return true;
    });

    if (validVideos.length + celebrationVideos.length > 3) {
      setErrors((prev) => ({
        ...prev,
        videos: 'Maximum 3 videos allowed.',
      }));
      return;
    }

    setCelebrationVideos((prev) => [...prev, ...validVideos]);
    setErrors((prev) => ({ ...prev, videos: '' }));
  };

  const removeVideo = (index: number) => {
    setCelebrationVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!triggerImage) {
      newErrors.triggerImage = 'Please upload a trigger image.';
    }

    if (celebrationVideos.length === 0) {
      newErrors.videos = 'Please upload at least one celebration video.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        triggerImage,
        celebrationVideos,
        details,
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

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Create Your Celebration</h1>
          <p className="text-xl text-gray-300">
            Upload your media and tell us about your special occasion.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 10MB</p>
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
              Upload Celebration Videos (up to 3)
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
                  MP4, MOV up to 100MB each, max 3 videos
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

          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-purple-400" />
              Event Details (Optional)
            </h3>
            
            <div>
              <label htmlFor="eventType" className="block text-sm font-medium text-gray-300 mb-2">
                Type of Celebration
              </label>
              <input
                type="text"
                id="eventType"
                value={details.eventType}
                onChange={(e) => setDetails({ ...details, eventType: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-purple-900/20 border border-purple-500/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white"
                placeholder="e.g., Birthday, Anniversary, Graduation"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Special Message or Dedication
              </label>
              <textarea
                id="message"
                value={details.message}
                onChange={(e) => setDetails({ ...details, message: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-purple-900/20 border border-purple-500/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white"
                placeholder="Add a personal message or dedication..."
              />
            </div>

            <div>
              <label htmlFor="preferences" className="block text-sm font-medium text-gray-300 mb-2">
                Playback Preferences
              </label>
              <textarea
                id="preferences"
                value={details.preferences}
                onChange={(e) => setDetails({ ...details, preferences: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-lg bg-purple-900/20 border border-purple-500/30 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-white"
                placeholder="Any specific preferences for how the videos should play..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all"
            >
              Review Celebration
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}