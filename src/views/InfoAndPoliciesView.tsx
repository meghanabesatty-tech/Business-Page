import React, { useState } from 'react';
import { ExternalLink, Mail, MessageCircle, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STUDIO_ASSETS } from '../data/initialCatalog';
import { AppView } from '../types';

export const AboutView: React.FC = () => {
  const { navigateTo } = useStore();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-xs text-[#8C6D46] font-medium">Our Artisanal Story · @md_art_studio0608</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#1C2822] leading-tight">
            Handmade With Love, Made Just For You
          </h1>
          <p className="text-sm text-[#1C2822]/80 leading-relaxed">
            <strong>MD ART STUDIO</strong> was born out of a passion for slow, intentional handmade
            artistry. In a world of mass-produced factory prints, we believe gifts should carry the
            warmth of human hands—the texture of a brushstroke, the patience of a French knot
            stitch, and the joy of personal memories.
          </p>
          <p className="text-sm text-[#1C2822]/80 leading-relaxed">
            Every creation is crafted to order in our studio and shared with our growing community
            on Instagram at <strong>@md_art_studio0608</strong>.
          </p>
        </div>

        <div className="lg:col-span-6">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-[#EAE3D5] border border-[#1C2822]/10">
            <img
              src={STUDIO_ASSETS.heroStudioImg}
              alt="Inside MD ART STUDIO workspace"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Our 6 Signature Mediums */}
      <div className="bg-[#F4EFE6] p-8 sm:p-10 rounded-3xl border border-[#1C2822]/10 space-y-6">
        <h2 className="font-serif text-3xl font-semibold text-[#1C2822]">
          What We Handcraft at MD ART STUDIO
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
              01. T-Shirt Paintings (₹259+)
            </h3>
            <p className="text-[#1C2822]/75 leading-relaxed">
              Wearable custom paintings on breathable combed cotton t-shirts using permanent,
              wash-fast textile pigments.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
              02. Handkerchief Paintings (₹99+)
            </h3>
            <p className="text-[#1C2822]/75 leading-relaxed">
              Heirloom mulmul cotton handkerchiefs painted with delicate florals, couple initials,
              and special dates.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
              03. Hand Embroidery (₹120+)
            </h3>
            <p className="text-[#1C2822]/75 leading-relaxed">
              3D botanical bamboo hoops, wedding save-the-date calendars, and floral monogrammed
              keepsakes.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
              04. Canvas Paintings (₹69+)
            </h3>
            <p className="text-[#1C2822]/75 leading-relaxed">
              From cute ₹69 mini easel desk canvases to custom gallery-wrapped memory portraits and
              landscapes.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
              05. 3D Texture Art
            </h3>
            <p className="text-[#1C2822]/75 leading-relaxed">
              Sculpted plaster arches and palette-knife botanical reliefs crafted in soothing
              pastel and cream tones.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl font-semibold text-[#1E3F2F]">
              06. Customized UNO Cards (₹300 / 30 Cards)
            </h3>
            <p className="text-[#1C2822]/75 leading-relaxed">
              Personalized 30-card UNO decks printed with your favorite photos, inside jokes, and
              custom game rules.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigateTo('shop')}
            className="px-6 py-3 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] cursor-pointer"
          >
            Explore the Shop
          </button>
          <button
            type="button"
            onClick={() => navigateTo('custom-art')}
            className="px-6 py-3 text-xs font-semibold rounded-xl border border-[#1E3F2F]/30 text-[#1E3F2F] cursor-pointer"
          >
            Request Custom Art
          </button>
        </div>
      </div>
    </div>
  );
};

export const ContactView: React.FC = () => {
  const { submitContactMessage, paymentConfig } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await submitContactMessage({ name, email, phone, subject, message });
      setSubject('');
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-2 border-b border-[#1C2822]/10 pb-6">
        <p className="text-xs text-[#8C6D46] font-medium">Get in Touch</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
          Contact MD ART STUDIO
        </h1>
        <p className="text-sm text-[#1C2822]/75">
          Have a question about a custom order, bulk return gifts, or shipping timelines? Reach out
          to us directly via Instagram, WhatsApp, or the form below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Direct Studio Channels */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-3 text-xs">
            <h2 className="font-serif text-xl font-semibold text-[#1C2822]">
              Direct Studio Channels
            </h2>
            <p className="text-[#1C2822]/75">
              <strong>Instagram:</strong> @md_art_studio0608
            </p>
            <p className="text-[#1C2822]/75">
              <strong>Email:</strong> {paymentConfig.studioEmail}
            </p>
            <p className="text-[#1C2822]/75">
              <strong>WhatsApp / Phone:</strong> +{paymentConfig.studioWhatsapp}
            </p>

            <div className="pt-3 flex flex-col gap-2.5">
              <a
                href="https://www.instagram.com/md_art_studio0608/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#1E3F2F] text-[#FAF7F2] font-semibold flex items-center justify-center gap-2"
              >
                <span>Message @md_art_studio0608 on Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={`https://wa.me/${paymentConfig.studioWhatsapp}?text=${encodeURIComponent(
                  'Hi MD ART STUDIO! I would like to inquire about a handmade custom order.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#EAE3D5] text-[#1E3F2F] font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={`mailto:${paymentConfig.studioEmail}`}
                className="w-full py-3 px-4 rounded-xl border border-[#1C2822]/15 text-[#1C2822] font-medium flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#F4EFE6] p-6 sm:p-8 rounded-3xl border border-[#1C2822]/10 space-y-4"
        >
          <h2 className="font-serif text-2xl font-semibold text-[#1C2822]">Send a Studio Inquiry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs text-[#1C2822]/75 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Order inquiry / Custom UNO cards"
                className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#1C2822]/75 mb-1">Message *</label>
            <textarea
              rows={4}
              required
              minLength={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#1C2822]/15 rounded-xl"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 text-xs font-semibold rounded-xl bg-[#1E3F2F] text-[#FAF7F2] flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? 'Sending...' : 'Send Message'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export const PolicyView: React.FC<{ policyType: AppView }> = ({ policyType }) => {
  const { navigateTo } = useStore();

  const policyContent: Record<
    string,
    { title: string; subtitle: string; sections: { heading: string; body: string }[] }
  > = {
    'privacy-policy': {
      title: 'Privacy Policy',
      subtitle: 'How MD ART STUDIO protects your personal data and custom reference photos.',
      sections: [
        {
          heading: '1. Data Collection & PII Isolation',
          body: 'We collect only the information needed to craft and deliver your handmade order (Name, Email, Mobile Number, Delivery Address, and uploaded customization reference photos). Contact PII is isolated in restricted database records accessible only to you and verified studio administrators.',
        },
        {
          heading: '2. Payment Security',
          body: 'Payments are processed directly via official Razorpay and PayPal gateways. MD ART STUDIO never stores your credit/debit card numbers, CVV, or UPI PIN.',
        },
        {
          heading: '3. Reference Photos',
          body: 'Uploaded photos for customized UNO cards, portraits, and embroidery are used strictly to create your ordered artwork and are never shared publicly without your explicit consent.',
        },
      ],
    },
    terms: {
      title: 'Terms & Conditions',
      subtitle: 'Terms governing purchases and commissions from MD ART STUDIO (@md_art_studio0608).',
      sections: [
        {
          heading: '1. Handmade Nature of Products',
          body: 'Every t-shirt painting, handkerchief, embroidery hoop, canvas, texture piece, and UNO deck is handcrafted individually. Subtle variations in brushstrokes and hand-stitching are a hallmark of genuine handmade art.',
        },
        {
          heading: '2. Pricing & Taxes',
          body: 'All prices listed on MD ART STUDIO are in Indian Rupees (₹). International customers checking out via PayPal see the equivalent USD conversion at checkout.',
        },
      ],
    },
    'shipping-policy': {
      title: 'Shipping Policy',
      subtitle: 'Preparation and pan-India delivery timelines for handmade creations.',
      sections: [
        {
          heading: '1. Crafting & Curing Time',
          body: 'Because each piece is hand-painted or hand-embroidered to order and heat-cured for wash durability, please allow 4–7 business days for studio preparation before dispatch.',
        },
        {
          heading: '2. Shipping Rates & Tracking',
          body: 'Enjoy FREE pan-India shipping on orders of ₹499 or above (flat ₹49 shipping on smaller orders). Live order status updates are available in your My Orders dashboard.',
        },
      ],
    },
    'refund-policy': {
      title: 'Return & Refund Policy',
      subtitle: 'Our fair guarantee for damaged-in-transit items.',
      sections: [
        {
          heading: '1. Damaged or Incorrect Items',
          body: 'If your artwork arrives damaged during courier transit, please share an unboxing video within 48 hours of delivery via Instagram (@md_art_studio0608) or email for a free replacement or full refund.',
        },
        {
          heading: '2. Personalized Items',
          body: 'Because custom-named t-shirts, monogrammed handkerchiefs, and photo UNO cards are made exclusively for you, returns are not accepted for change of mind.',
        },
      ],
    },
    'cancellation-policy': {
      title: 'Cancellation Policy',
      subtitle: 'Guidelines for modifying or cancelling an order.',
      sections: [
        {
          heading: '1. Cancellation Window',
          body: 'Orders may be cancelled within 12 hours of placement or before our artists begin sketching/painting your custom piece (whichever is earlier).',
        },
      ],
    },
    'custom-policy': {
      title: 'Custom Product Policy',
      subtitle: 'Guidelines for Customized UNO Cards (₹300 / 30 cards), T-Shirts, and Portraits.',
      sections: [
        {
          heading: '1. Photo Quality & Instructions',
          body: 'Please upload clear, well-lit reference photos (JPG, PNG, or WEBP). For Customized UNO Cards (₹300 for 30 cards), you may upload a photo collage or share drive/WhatsApp photos quoting your Order ID.',
        },
        {
          heading: '2. Care Instructions for Painted Fabrics',
          body: 'For hand-painted t-shirts and handkerchiefs: gentle hand wash in cold water inside-out using mild detergent. Do not scrub or bleach directly on the painted motif; iron on reverse.',
        },
      ],
    },
  };

  const active = policyContent[policyType] || policyContent['privacy-policy'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2 border-b border-[#1C2822]/10 pb-6">
        <p className="text-xs text-[#8C6D46] font-medium">MD ART STUDIO Official Policy</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2822]">
          {active.title}
        </h1>
        <p className="text-sm text-[#1C2822]/75">{active.subtitle}</p>
      </div>

      <div className="space-y-6">
        {active.sections.map((sec, i) => (
          <div
            key={i}
            className="bg-[#F4EFE6] p-6 rounded-2xl border border-[#1C2822]/10 space-y-2"
          >
            <h2 className="font-serif text-xl font-semibold text-[#1E3F2F]">{sec.heading}</h2>
            <p className="text-xs text-[#1C2822]/80 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-4">
        {(
          [
            ['privacy-policy', 'Privacy Policy'],
            ['terms', 'Terms & Conditions'],
            ['shipping-policy', 'Shipping Policy'],
            ['refund-policy', 'Return & Refund Policy'],
            ['cancellation-policy', 'Cancellation Policy'],
            ['custom-policy', 'Custom Product Policy'],
          ] as [AppView, string][]
        ).map(([viewKey, label]) => (
          <button
            key={viewKey}
            type="button"
            onClick={() => navigateTo(viewKey)}
            className={`px-3.5 py-2 text-xs font-medium rounded-xl cursor-pointer ${
              policyType === viewKey
                ? 'bg-[#1E3F2F] text-[#FAF7F2]'
                : 'bg-[#F4EFE6] text-[#1C2822]/75 hover:bg-[#EAE3D5]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
