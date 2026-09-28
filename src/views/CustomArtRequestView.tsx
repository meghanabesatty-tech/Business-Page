import React, { useState } from 'react';
import { Check, Palette, Upload } from 'lucide-react';
import { useStore, validateAndCompressImageFile } from '../context/StoreContext';

export const CustomArtRequestView: React.FC = () => {
  const { user, userProfile, userPrivate, submitCustomArtRequest, showToast } = useStore();

  const [name, setName] = useState(userProfile?.displayName || user?.displayName || '');
  const [email, setEmail] = useState(userPrivate?.email || user?.email || '');
  const [phone, setPhone] = useState(userPrivate?.phone || user?.phoneNumber || '');
  const [productType, setProductType] = useState('T-Shirt Painting (from ₹259+)');
  const [preferredSize, setPreferredSize] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [colorPreference, setColorPreference] = useState('');
  const [referenceImageData, setReferenceImageData] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await validateAndCompressImageFile(file);
      setReferenceImageData(dataUrl);
      showToast('Reference image attached!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Image upload error', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitCustomArtRequest({
        name,
        email,
        phone,
        productType,
        preferredSize,
        budget,
        description,
        colorPreference,
        referenceImageData,
        additionalInstructions,
      });
      setSubmittedSuccess(true);
      setDescription('');
      setAdditionalInstructions('');
      setReferenceImageData('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-2 border-b border-[#1C2822]/10 pb-6">
        <p className="text-xs text-[#8C6D46] font-medium">Bespoke Commissions · MD ART STUDIO</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
          Request Custom Handmade Art
        </h1>
        <p className="text-sm text-[#1C2822]/75 max-w-2xl">
          Have a specific vision for a hand-painted t-shirt, heirloom handkerchief, wedding
          embroidery hoop, canvas portrait, 3D texture piece, or a 30-card custom UNO deck? Fill out
          the studio brief below and our artists will review your request.
        </p>
      </div>

      {submittedSuccess && (
        <div className="bg-[#1E3F2F] text-[#FAF7F2] p-6 rounded-2xl flex items-start gap-3">
          <Check className="w-5 h-5 shrink-0 mt-0.5 text-[#E5D5B5]" />
          <div className="space-y-1 text-xs">
            <p className="font-serif text-lg font-semibold">
              Custom Art Request Received by MD ART STUDIO ❤️
            </p>
            <p className="text-[#FAF7F2]/80">
              Your commission brief and reference details have been saved. You can track the status
              of your request anytime under My Profile → Custom Requests.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">Your Name *</label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Priya Verma"
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">Email *</label>
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@example.com"
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
              Mobile / WhatsApp Number *
            </label>
            <input
              type="tel"
              required
              maxLength={25}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
              Product Type *
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            >
              <option value="T-Shirt Painting (from ₹259+)">T-Shirt Painting (from ₹259+)</option>
              <option value="Handkerchief Painting (from ₹99+)">
                Handkerchief Painting (from ₹99+)
              </option>
              <option value="Embroidery Hoop / Apparel (from ₹120+)">
                Embroidery Hoop / Apparel (from ₹120+)
              </option>
              <option value="Canvas Painting (from ₹69+)">Canvas Painting (from ₹69+)</option>
              <option value="3D Texture Art">3D Texture Art</option>
              <option value="Customized UNO Cards (₹300 / 30 cards)">
                Customized UNO Cards (₹300 / 30 cards)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
              Preferred Size / Fit *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={preferredSize}
              onChange={(e) => setPreferredSize(e.target.value)}
              placeholder="e.g., Oversized L Tee / 8x10 Canvas / 30 Cards"
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
              Estimated Budget (₹) *
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., ₹300 - ₹600"
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
            Artwork Description &amp; Concept *
          </label>
          <textarea
            rows={4}
            required
            minLength={5}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the motif, portrait, floral arrangement, or custom UNO theme you want us to create..."
            className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
              Color Preference
            </label>
            <input
              type="text"
              maxLength={200}
              value={colorPreference}
              onChange={(e) => setColorPreference(e.target.value)}
              placeholder="e.g., Soft pastel lavender, sage green & warm cream"
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
              Reference Image Upload (JPG, PNG, WEBP)
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-[#EAE3D5] text-[#1C2822] hover:bg-[#DED4C1] transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Processing...' : 'Choose Reference Photo'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {referenceImageData && (
                <img
                  src={referenceImageData}
                  alt="Reference preview"
                  className="w-10 h-10 rounded-lg object-cover border border-[#1E3F2F]/30"
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1C2822]/80 mb-1">
            Additional Instructions / Delivery Date Needed By
          </label>
          <textarea
            rows={2}
            maxLength={1000}
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="Let us know if this is for an upcoming birthday or anniversary date..."
            className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3.5 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] hover:bg-[#163023] disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Palette className="w-4 h-4" />
          <span>{submitting ? 'Saving Commission Request...' : 'Submit Custom Art Request'}</span>
        </button>
      </form>
    </div>
  );
};
