'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    password: '',
    job_type: '',
    job_subcategory: '',
    country: '',
    currency: 'USD',
    phone: '',
    subscription_plan: 'free',
    accept_terms: false,
  });
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  // Job subcategories mapping
  const jobSubcategories = {
    freelancer: [
      'Software & Web Development',
      'AI',
      'Data & Automation',
      'Design & Creative',
      'Writing & Content',
      'Digital Marketing',
      'Cloud, DevOps & Security',
      'E-commerce',
      'Business, Finance & Support',
      'Other'
    ],
    businessman: [
      'Technology',
      'Manufacturing',
      'Retail & E-commerce',
      'Healthcare',
      'Finance & Banking',
      'Real Estate',
      'Consulting',
      'Marketing & Advertising',
      'Construction',
      'Food & Hospitality',
      'Gem Business',
      'Other'
    ],
    employee: [
      'Software Development',
      'Data Analysis',
      'Design',
      'Marketing',
      'Sales',
      'Human Resources',
      'Finance & Accounting',
      'Operations',
      'Customer Service',
      'Management',
      'Other'
    ]
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Reset subcategory when job type changes
      if (name === 'job_type' && value !== prev.job_type) {
        newData.job_subcategory = '';
      }

      return newData;
    });
  };

  const nextStep = () => {
    setError('');
    if (currentStep === 1) {
      // Validate step 1: username, fullname, email, password
      if (!formData.username || !formData.fullname || !formData.email || !formData.password) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2: job_type and job_subcategory
      if (!formData.job_type) {
        setError('Please select your job type');
        return;
      }
      if (!formData.job_subcategory) {
        setError('Please select your job subcategory');
        return;
      }
    } else if (currentStep === 3) {
      // Validate step 3: phone, country, currency
      if (!formData.phone || !formData.country || !formData.currency) {
        setError('Please fill in all required fields');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.accept_terms) {
      setError('Please accept the terms and conditions');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/login');
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-powerbi-blue-50 via-white to-powerbi-blue-100 dark:from-powerbi-gray-900 dark:via-powerbi-gray-800 dark:to-powerbi-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        {/* Header */}
        <div className="lg:text-left text-center mb-8">
          
          <h2 className="text-3xl sm:text-4xl font-bold text-powerbi-gray-900 dark:text-white mb-6">Control Your Money, Goals & Life — One System</h2>
          <div className="space-y-4 text-lg text-powerbi-gray-600 dark:text-powerbi-gray-300 leading-relaxed">
            <p>
              This application is an all-in-one personal management system designed to help individuals take full control of their daily life, finances, and long-term goals in one secure place.
            </p>
            <p>
              With this system, you can easily track your income and expenses, manage personal and vehicle-related costs, plan and monitor your goals, organize tasks, and maintain a private daily diary. Everything is structured, clear, and built to reduce stress while improving focus and financial awareness.
            </p>
            <p>
              Unlike traditional planners or multiple disconnected apps, this platform brings all essential personal management tools together in a single dashboard—giving you a clear picture of where your time, money, and effort go.
            </p>
            <p>
              The system is suitable for freelancers, professionals, small business owners, and individuals who want better control over their finances and personal growth. It is designed for both local and global users, with support for multiple currencies and flexible planning needs.
            </p>
            <p>
              Whether you are planning your year, managing daily expenses, tracking vehicle costs, or simply writing your thoughts, this application helps you stay organized, disciplined, and in control.
            </p>
            <p className="font-semibold text-powerbi-primary mt-6">
              Plan with clarity. Track with confidence. Live with control.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-2xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden backdrop-blur-sm bg-white/95 dark:bg-powerbi-gray-800/95">
          <div className="p-4 sm:p-8 md:px-16 md:py-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step Indicator */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 1 ? 'bg-powerbi-primary text-white' : 'bg-powerbi-gray-200 dark:bg-powerbi-gray-600 text-powerbi-gray-600 dark:text-powerbi-gray-300'}`}>1</div>
                  <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-powerbi-primary' : 'bg-powerbi-gray-200 dark:bg-powerbi-gray-600'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 2 ? 'bg-powerbi-primary text-white' : 'bg-powerbi-gray-200 dark:bg-powerbi-gray-600 text-powerbi-gray-600 dark:text-powerbi-gray-300'}`}>2</div>
                  <div className={`w-8 h-1 ${currentStep >= 3 ? 'bg-powerbi-primary' : 'bg-powerbi-gray-200 dark:bg-powerbi-gray-600'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 3 ? 'bg-powerbi-primary text-white' : 'bg-powerbi-gray-200 dark:bg-powerbi-gray-600 text-powerbi-gray-600 dark:text-powerbi-gray-300'}`}>3</div>
                  <div className={`w-8 h-1 ${currentStep >= 4 ? 'bg-powerbi-primary' : 'bg-powerbi-gray-200 dark:bg-powerbi-gray-600'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 4 ? 'bg-powerbi-primary text-white' : 'bg-powerbi-gray-200 dark:bg-powerbi-gray-600 text-powerbi-gray-600 dark:text-powerbi-gray-300'}`}>4</div>
                </div>
              </div>

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white border-b border-powerbi-gray-200 dark:border-powerbi-gray-600 pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Job Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white border-b border-powerbi-gray-200 dark:border-powerbi-gray-600 pb-2">Job Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">What best describes your profession?</label>
                      <select
                        name="job_type"
                        value={formData.job_type}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                      >
                        <option value="">Select your profession</option>
                        <option value="freelancer">👨‍💻 Freelancer</option>
                        <option value="businessman">💼 Business</option>
                        <option value="employee">🏢 Employee</option>
                      </select>
                    </div>

                    {formData.job_type && (
                      <div>
                        <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">What is your specialization?</label>
                        <select
                          name="job_subcategory"
                          value={formData.job_subcategory}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                        >
                          <option value="">Select your specialization</option>
                          {jobSubcategories[formData.job_type as keyof typeof jobSubcategories]?.map((subcategory) => (
                            <option key={subcategory} value={subcategory}>
                              {subcategory}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Contact & Location */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white border-b border-powerbi-gray-200 dark:border-powerbi-gray-600 pb-2">Contact & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Country</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                    >
                    <option value="">Select Country</option>
                    <option value="Afghanistan">🇦🇫 Afghanistan</option>
                    <option value="Albania">🇦🇱 Albania</option>
                    <option value="Algeria">🇩🇿 Algeria</option>
                    <option value="Andorra">🇦🇩 Andorra</option>
                    <option value="Angola">🇦🇴 Angola</option>
                    <option value="Antigua and Barbuda">🇦🇬 Antigua and Barbuda</option>
                    <option value="Argentina">🇦🇷 Argentina</option>
                    <option value="Armenia">🇦🇲 Armenia</option>
                    <option value="Australia">🇦🇺 Australia</option>
                    <option value="Austria">🇦🇹 Austria</option>
                    <option value="Azerbaijan">🇦🇿 Azerbaijan</option>
                    <option value="Bahamas">🇧🇸 Bahamas</option>
                    <option value="Bahrain">🇧🇭 Bahrain</option>
                    <option value="Bangladesh">🇧🇩 Bangladesh</option>
                    <option value="Barbados">🇧🇧 Barbados</option>
                    <option value="Belarus">🇧🇾 Belarus</option>
                    <option value="Belgium">🇧🇪 Belgium</option>
                    <option value="Belize">🇧🇿 Belize</option>
                    <option value="Benin">🇧🇯 Benin</option>
                    <option value="Bhutan">🇧🇹 Bhutan</option>
                    <option value="Bolivia">🇧🇴 Bolivia</option>
                    <option value="Bosnia and Herzegovina">🇧🇦 Bosnia and Herzegovina</option>
                    <option value="Botswana">🇧🇼 Botswana</option>
                    <option value="Brazil">🇧🇷 Brazil</option>
                    <option value="Brunei">🇧🇳 Brunei</option>
                    <option value="Bulgaria">🇧🇬 Bulgaria</option>
                    <option value="Burkina Faso">🇧🇫 Burkina Faso</option>
                    <option value="Burundi">🇧🇮 Burundi</option>
                    <option value="Cabo Verde">🇨🇻 Cabo Verde</option>
                    <option value="Cambodia">🇰🇭 Cambodia</option>
                    <option value="Cameroon">🇨🇲 Cameroon</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="Central African Republic">🇨🇫 Central African Republic</option>
                    <option value="Chad">🇹🇩 Chad</option>
                    <option value="Chile">🇨🇱 Chile</option>
                    <option value="China">🇨🇳 China</option>
                    <option value="Colombia">🇨🇴 Colombia</option>
                    <option value="Comoros">🇰🇲 Comoros</option>
                    <option value="Congo">🇨🇬 Congo</option>
                    <option value="Costa Rica">🇨🇷 Costa Rica</option>
                    <option value="Croatia">🇭🇷 Croatia</option>
                    <option value="Cuba">🇨🇺 Cuba</option>
                    <option value="Cyprus">🇨🇾 Cyprus</option>
                    <option value="Czech Republic">🇨🇿 Czech Republic</option>
                    <option value="Denmark">🇩🇰 Denmark</option>
                    <option value="Djibouti">🇩🇯 Djibouti</option>
                    <option value="Dominica">🇩🇲 Dominica</option>
                    <option value="Dominican Republic">🇩🇴 Dominican Republic</option>
                    <option value="Ecuador">🇪🇨 Ecuador</option>
                    <option value="Egypt">🇪🇬 Egypt</option>
                    <option value="El Salvador">🇸🇻 El Salvador</option>
                    <option value="Equatorial Guinea">🇬🇶 Equatorial Guinea</option>
                    <option value="Eritrea">🇪🇷 Eritrea</option>
                    <option value="Estonia">🇪🇪 Estonia</option>
                    <option value="Eswatini">🇸🇿 Eswatini</option>
                    <option value="Ethiopia">🇪🇹 Ethiopia</option>
                    <option value="Fiji">🇫🇯 Fiji</option>
                    <option value="Finland">🇫🇮 Finland</option>
                    <option value="France">🇫🇷 France</option>
                    <option value="Gabon">🇬🇦 Gabon</option>
                    <option value="Gambia">🇬🇲 Gambia</option>
                    <option value="Georgia">🇬🇪 Georgia</option>
                    <option value="Germany">🇩🇪 Germany</option>
                    <option value="Ghana">🇬🇭 Ghana</option>
                    <option value="Greece">🇬🇷 Greece</option>
                    <option value="Grenada">🇬🇩 Grenada</option>
                    <option value="Guatemala">🇬🇹 Guatemala</option>
                    <option value="Guinea">🇬🇳 Guinea</option>
                    <option value="Guinea-Bissau">🇬🇼 Guinea-Bissau</option>
                    <option value="Guyana">🇬🇾 Guyana</option>
                    <option value="Haiti">🇭🇹 Haiti</option>
                    <option value="Honduras">🇭🇳 Honduras</option>
                    <option value="Hungary">🇭🇺 Hungary</option>
                    <option value="Iceland">🇮🇸 Iceland</option>
                    <option value="India">🇮🇳 India</option>
                    <option value="Indonesia">🇮🇩 Indonesia</option>
                    <option value="Iran">🇮🇷 Iran</option>
                    <option value="Iraq">🇮🇶 Iraq</option>
                    <option value="Ireland">🇮🇪 Ireland</option>
                    <option value="Israel">🇮🇱 Israel</option>
                    <option value="Italy">🇮🇹 Italy</option>
                    <option value="Jamaica">🇯🇲 Jamaica</option>
                    <option value="Japan">🇯🇵 Japan</option>
                    <option value="Jordan">🇯🇴 Jordan</option>
                    <option value="Kazakhstan">🇰🇿 Kazakhstan</option>
                    <option value="Kenya">🇰🇪 Kenya</option>
                    <option value="Kiribati">🇰🇮 Kiribati</option>
                    <option value="Kuwait">🇰🇼 Kuwait</option>
                    <option value="Kyrgyzstan">🇰🇬 Kyrgyzstan</option>
                    <option value="Laos">🇱🇦 Laos</option>
                    <option value="Latvia">🇱🇻 Latvia</option>
                    <option value="Lebanon">🇱🇧 Lebanon</option>
                    <option value="Lesotho">🇱🇸 Lesotho</option>
                    <option value="Liberia">🇱🇷 Liberia</option>
                    <option value="Libya">🇱🇾 Libya</option>
                    <option value="Liechtenstein">🇱🇮 Liechtenstein</option>
                    <option value="Lithuania">🇱🇹 Lithuania</option>
                    <option value="Luxembourg">🇱🇺 Luxembourg</option>
                    <option value="Madagascar">🇲🇬 Madagascar</option>
                    <option value="Malawi">🇲🇼 Malawi</option>
                    <option value="Malaysia">🇲🇾 Malaysia</option>
                    <option value="Maldives">🇲🇻 Maldives</option>
                    <option value="Mali">🇲🇱 Mali</option>
                    <option value="Malta">🇲🇹 Malta</option>
                    <option value="Marshall Islands">🇲🇭 Marshall Islands</option>
                    <option value="Mauritania">🇲🇷 Mauritania</option>
                    <option value="Mauritius">🇲🇺 Mauritius</option>
                    <option value="Mexico">🇲🇽 Mexico</option>
                    <option value="Micronesia">🇫🇲 Micronesia</option>
                    <option value="Moldova">🇲🇩 Moldova</option>
                    <option value="Monaco">🇲🇨 Monaco</option>
                    <option value="Mongolia">🇲🇳 Mongolia</option>
                    <option value="Montenegro">🇲🇪 Montenegro</option>
                    <option value="Morocco">🇲🇦 Morocco</option>
                    <option value="Mozambique">🇲🇿 Mozambique</option>
                    <option value="Myanmar">🇲🇲 Myanmar</option>
                    <option value="Namibia">🇳🇦 Namibia</option>
                    <option value="Nauru">🇳🇷 Nauru</option>
                    <option value="Nepal">🇳🇵 Nepal</option>
                    <option value="Netherlands">🇳🇱 Netherlands</option>
                    <option value="New Zealand">🇳🇿 New Zealand</option>
                    <option value="Nicaragua">🇳🇮 Nicaragua</option>
                    <option value="Niger">🇳🇪 Niger</option>
                    <option value="Nigeria">🇳🇬 Nigeria</option>
                    <option value="North Korea">🇰🇵 North Korea</option>
                    <option value="North Macedonia">🇲🇰 North Macedonia</option>
                    <option value="Norway">🇳🇴 Norway</option>
                    <option value="Oman">🇴🇲 Oman</option>
                    <option value="Pakistan">🇵🇰 Pakistan</option>
                    <option value="Palau">🇵🇼 Palau</option>
                    <option value="Palestine">🇵🇸 Palestine</option>
                    <option value="Panama">🇵🇦 Panama</option>
                    <option value="Papua New Guinea">🇵🇬 Papua New Guinea</option>
                    <option value="Paraguay">🇵🇾 Paraguay</option>
                    <option value="Peru">🇵🇪 Peru</option>
                    <option value="Philippines">🇵🇭 Philippines</option>
                    <option value="Poland">🇵🇱 Poland</option>
                    <option value="Portugal">🇵🇹 Portugal</option>
                    <option value="Qatar">🇶🇦 Qatar</option>
                    <option value="Romania">🇷🇴 Romania</option>
                    <option value="Russia">🇷🇺 Russia</option>
                    <option value="Rwanda">🇷🇼 Rwanda</option>
                    <option value="Saint Kitts and Nevis">🇰🇳 Saint Kitts and Nevis</option>
                    <option value="Saint Lucia">🇱🇨 Saint Lucia</option>
                    <option value="Saint Vincent and the Grenadines">🇻🇨 Saint Vincent and the Grenadines</option>
                    <option value="Samoa">🇼🇸 Samoa</option>
                    <option value="San Marino">🇸🇲 San Marino</option>
                    <option value="Sao Tome and Principe">🇸🇹 Sao Tome and Principe</option>
                    <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                    <option value="Senegal">🇸🇳 Senegal</option>
                    <option value="Serbia">🇷🇸 Serbia</option>
                    <option value="Seychelles">🇸🇨 Seychelles</option>
                    <option value="Sierra Leone">🇸🇱 Sierra Leone</option>
                    <option value="Singapore">🇸🇬 Singapore</option>
                    <option value="Slovakia">🇸🇰 Slovakia</option>
                    <option value="Slovenia">🇸🇮 Slovenia</option>
                    <option value="Solomon Islands">🇸🇧 Solomon Islands</option>
                    <option value="Somalia">🇸🇴 Somalia</option>
                    <option value="South Africa">🇿🇦 South Africa</option>
                    <option value="South Korea">🇰🇷 South Korea</option>
                    <option value="South Sudan">🇸🇸 South Sudan</option>
                    <option value="Spain">🇪🇸 Spain</option>
                    <option value="Sri Lanka">🇱🇰 Sri Lanka</option>
                    <option value="Sudan">🇸🇩 Sudan</option>
                    <option value="Suriname">🇸🇷 Suriname</option>
                    <option value="Sweden">🇸🇪 Sweden</option>
                    <option value="Switzerland">🇨🇭 Switzerland</option>
                    <option value="Syria">🇸🇾 Syria</option>
                    <option value="Taiwan">🇹🇼 Taiwan</option>
                    <option value="Tajikistan">🇹🇯 Tajikistan</option>
                    <option value="Tanzania">🇹🇿 Tanzania</option>
                    <option value="Thailand">🇹🇭 Thailand</option>
                    <option value="Timor-Leste">🇹🇱 Timor-Leste</option>
                    <option value="Togo">🇹🇬 Togo</option>
                    <option value="Tonga">🇹🇴 Tonga</option>
                    <option value="Trinidad and Tobago">🇹🇹 Trinidad and Tobago</option>
                    <option value="Tunisia">🇹🇳 Tunisia</option>
                    <option value="Turkey">🇹🇷 Turkey</option>
                    <option value="Turkmenistan">🇹🇲 Turkmenistan</option>
                    <option value="Tuvalu">🇹🇻 Tuvalu</option>
                    <option value="Uganda">🇺🇬 Uganda</option>
                    <option value="Ukraine">🇺🇦 Ukraine</option>
                    <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                    <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    <option value="United States">🇺🇸 United States</option>
                    <option value="Uruguay">🇺🇾 Uruguay</option>
                    <option value="Uzbekistan">🇺🇿 Uzbekistan</option>
                    <option value="Vanuatu">🇻🇺 Vanuatu</option>
                    <option value="Vatican City">🇻🇦 Vatican City</option>
                    <option value="Venezuela">🇻🇪 Venezuela</option>
                    <option value="Vietnam">🇻🇳 Vietnam</option>
                    <option value="Yemen">🇾🇪 Yemen</option>
                    <option value="Zambia">🇿🇲 Zambia</option>
                    <option value="Zimbabwe">🇿🇼 Zimbabwe</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-colors"
                  >
                    <option value="USD">💵 USD - US Dollar</option>
                    <option value="EUR">💶 EUR - Euro</option>
                    <option value="GBP">💷 GBP - British Pound</option>
                    <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                    <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                    <option value="JPY">💴 JPY - Japanese Yen</option>
                    <option value="INR">🇮🇳 INR - Indian Rupee</option>
                    <option value="BRL">🇧🇷 BRL - Brazilian Real</option>
                    <option value="MXN">🇲🇽 MXN - Mexican Peso</option>
                    <option value="KRW">🇰🇷 KRW - South Korean Won</option>
                    <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                    <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                    <option value="SEK">🇸🇪 SEK - Swedish Krona</option>
                    <option value="NZD">🇳🇿 NZD - New Zealand Dollar</option>
                    <option value="SGD">🇸🇬 SGD - Singapore Dollar</option>
                    <option value="HKD">🇭🇰 HKD - Hong Kong Dollar</option>
                    <option value="NOK">🇳🇴 NOK - Norwegian Krone</option>
                    <option value="DKK">🇩🇰 DKK - Danish Krone</option>
                    <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
                    <option value="RUB">🇷🇺 RUB - Russian Ruble</option>
                    <option value="TRY">🇹🇷 TRY - Turkish Lira</option>
                    <option value="PLN">🇵🇱 PLN - Polish Złoty</option>
                    <option value="THB">🇹🇭 THB - Thai Baht</option>
                    <option value="IDR">🇮🇩 IDR - Indonesian Rupiah</option>
                    <option value="MYR">🇲🇾 MYR - Malaysian Ringgit</option>
                    <option value="PHP">🇵🇭 PHP - Philippine Peso</option>
                    <option value="CZK">🇨🇿 CZK - Czech Koruna</option>
                    <option value="HUF">🇭🇺 HUF - Hungarian Forint</option>
                    <option value="ILS">🇮🇱 ILS - Israeli Shekel</option>
                    <option value="AED">🇦🇪 AED - UAE Dirham</option>
                    <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
                    <option value="EGP">🇪🇬 EGP - Egyptian Pound</option>
                    <option value="ARS">🇦🇷 ARS - Argentine Peso</option>
                    <option value="CLP">🇨🇱 CLP - Chilean Peso</option>
                    <option value="COP">🇨🇴 COP - Colombian Peso</option>
                    <option value="PEN">🇵🇪 PEN - Peruvian Sol</option>
                    <option value="UYU">🇺🇾 UYU - Uruguayan Peso</option>
                    <option value="PYG">🇵🇾 PYG - Paraguayan Guarani</option>
                    <option value="BOB">🇧🇴 BOB - Bolivian Boliviano</option>
                    <option value="VES">🇻🇪 VES - Venezuelan Bolívar</option>
                    <option value="GTQ">🇬🇹 GTQ - Guatemalan Quetzal</option>
                    <option value="HNL">🇭🇳 HNL - Honduran Lempira</option>
                    <option value="NIO">🇳🇮 NIO - Nicaraguan Córdoba</option>
                    <option value="CRC">🇨🇷 CRC - Costa Rican Colón</option>
                    <option value="SVC">🇸🇻 SVC - Salvadoran Colón</option>
                    <option value="PAB">🇵🇦 PAB - Panamanian Balboa</option>
                    <option value="BMD">🇧🇲 BMD - Bermudian Dollar</option>
                    <option value="BSD">🇧🇸 BSD - Bahamian Dollar</option>
                    <option value="KYD">🇰🇾 KYD - Cayman Islands Dollar</option>
                    <option value="JMD">🇯🇲 JMD - Jamaican Dollar</option>
                    <option value="TTD">🇹🇹 TTD - Trinidad and Tobago Dollar</option>
                    <option value="BBD">🇧🇧 BBD - Barbadian Dollar</option>
                    <option value="XCD">🇦🇬 XCD - East Caribbean Dollar</option>
                    <option value="GYD">🇬🇾 GYD - Guyanese Dollar</option>
                    <option value="SRD">🇸🇷 SRD - Surinamese Dollar</option>
                    <option value="AWG">🇦🇼 AWG - Aruban Florin</option>
                    <option value="ANG">🇳🇱 ANG - Netherlands Antillean Guilder</option>
                    <option value="DOP">🇩🇴 DOP - Dominican Peso</option>
                    <option value="HTG">🇭🇹 HTG - Haitian Gourde</option>
                    <option value="CUP">🇨🇺 CUP - Cuban Peso</option>
                
                    <option value="LBP">🇱🇧 LBP - Lebanese Pound</option>
                    <option value="SYP">🇸🇾 SYP - Syrian Pound</option>
                    <option value="IQD">🇮🇶 IQD - Iraqi Dinar</option>
                    <option value="JOD">🇯🇴 JOD - Jordanian Dinar</option>
                    <option value="KWD">🇰🇼 KWD - Kuwaiti Dinar</option>
                    <option value="BHD">🇧🇭 BHD - Bahraini Dinar</option>
                    <option value="OMR">🇴🇲 OMR - Omani Rial</option>
                    <option value="QAR">🇶🇦 QAR - Qatari Riyal</option>
                    <option value="YER">🇾🇪 YER - Yemeni Rial</option>
                    <option value="LYD">🇱🇾 LYD - Libyan Dinar</option>
                    <option value="TND">🇹🇳 TND - Tunisian Dinar</option>
                    <option value="DZD">🇩🇿 DZD - Algerian Dinar</option>
                    <option value="MAD">🇲🇦 MAD - Moroccan Dirham</option>
                    <option value="STD">🇸🇹 STD - São Tomé and Príncipe Dobra</option>
                    <option value="CVE">🇨🇻 CVE - Cape Verdean Escudo</option>
                    <option value="GNF">🇬🇳 GNF - Guinean Franc</option>
                    <option value="XOF">🇨🇮 XOF - West African CFA Franc</option>
                    <option value="XAF">🇨🇲 XAF - Central African CFA Franc</option>
                    <option value="CDF">🇨🇩 CDF - Congolese Franc</option>
                    <option value="DJF">🇩🇯 DJF - Djiboutian Franc</option>
                    <option value="KMF">🇰🇲 KMF - Comorian Franc</option>
                    <option value="RWF">🇷🇼 RWF - Rwandan Franc</option>
                    <option value="BIF">🇧🇮 BIF - Burundian Franc</option>
                    <option value="MGA">🇲🇬 MGA - Malagasy Ariary</option>
                    <option value="MUR">🇲🇺 MUR - Mauritian Rupee</option>
                    <option value="SCR">🇸🇨 SCR - Seychellois Rupee</option>
                    <option value="MVR">🇲🇻 MVR - Maldivian Rufiyaa</option>
                    <option value="LKR">🇱🇰 LKR - Sri Lankan Rupee</option>
                    <option value="NPR">🇳🇵 NPR - Nepalese Rupee</option>
                    <option value="PKR">🇵🇰 PKR - Pakistani Rupee</option>
                    <option value="BDT">🇧🇩 BDT - Bangladeshi Taka</option>
                    <option value="BTN">🇧🇹 BTN - Bhutanese Ngultrum</option>
                    <option value="MMK">🇲🇲 MMK - Myanmar Kyat</option>
                    <option value="KHR">🇰🇭 KHR - Cambodian Riel</option>
                    <option value="LAK">🇱🇦 LAK - Lao Kip</option>
                    <option value="VND">🇻🇳 VND - Vietnamese Đồng</option>
                    <option value="KPW">🇰🇵 KPW - North Korean Won</option>
                    <option value="TWD">🇹🇼 TWD - New Taiwan Dollar</option>
                    <option value="MNT">🇲🇳 MNT - Mongolian Tögrög</option>
                    <option value="MOP">🇲🇴 MOP - Macanese Pataca</option>
                    <option value="BND">🇧🇳 BND - Brunei Dollar</option>
                    <option value="FJD">🇫🇯 FJD - Fijian Dollar</option>
                    <option value="PGK">🇵🇬 PGK - Papua New Guinean Kina</option>
                    <option value="SBD">🇸🇧 SBD - Solomon Islands Dollar</option>
                    <option value="TOP">🇹🇴 TOP - Tongan Pa&apos;anga</option>
                    <option value="VUV">🇻🇺 VUV - Vanuatu Vatu</option>
                    <option value="WST">🇼🇸 WST - Samoan Tala</option>
                    <option value="KID">🇰🇮 KID - Kiribati Dollar</option>
                    <option value="TVD">🇹🇻 TVD - Tuvaluan Dollar</option>
                    <option value="ETB">🇪🇹 ETB - Ethiopian Birr</option>
                    <option value="SOS">🇸🇴 SOS - Somali Shilling</option>
                    <option value="KES">🇰🇪 KES - Kenyan Shilling</option>
                    <option value="TZS">🇹🇿 TZS - Tanzanian Shilling</option>
                    <option value="UGX">🇺🇬 UGX - Ugandan Shilling</option>
                    <option value="SZL">🇸🇿 SZL - Swazi Lilangeni</option>
                    <option value="LSL">🇱🇸 LSL - Lesotho Loti</option>
                    <option value="NAD">🇳🇦 NAD - Namibian Dollar</option>
                    <option value="MWK">🇲🇼 MWK - Malawian Kwacha</option>
                    <option value="ZMW">🇿🇲 ZMW - Zambian Kwacha</option>
                    <option value="MZN">🇲🇿 MZN - Mozambican Metical</option>
                    <option value="AOA">🇦🇴 AOA - Angolan Kwanza</option>
                    <option value="GMD">🇬🇲 GMD - Gambian Dalasi</option>
                    <option value="SLL">🇸🇱 SLL - Sierra Leonean Leone</option>
                    <option value="LRD">🇱🇷 LRD - Liberian Dollar</option>
                    <option value="GHS">🇬🇭 GHS - Ghanaian Cedi</option>
                    <option value="NGN">🇳🇬 NGN - Nigerian Naira</option>
                    <option value="ERN">🇪🇷 ERN - Eritrean Nakfa</option>
                    <option value="SSP">🇸🇸 SSP - South Sudanese Pound</option>
                    <option value="SDG">🇸🇩 SDG - Sudanese Pound</option>
                    <option value="TMT">🇹🇲 TMT - Turkmenistani Manat</option>
                    <option value="TJS">🇹🇯 TJS - Tajikistani Somoni</option>
                    <option value="GEL">🇬🇪 GEL - Georgian Lari</option>
                    <option value="AMD">🇦🇲 AMD - Armenian Dram</option>
                    <option value="AZN">🇦🇿 AZN - Azerbaijani Manat</option>
                    <option value="BYN">🇧🇾 BYN - Belarusian Ruble</option>
                    <option value="MDL">🇲🇩 MDL - Moldovan Leu</option>
                    <option value="RON">🇷🇴 RON - Romanian Leu</option>
                    <option value="BGN">🇧🇬 BGN - Bulgarian Lev</option>
                    <option value="MKD">🇲🇰 MKD - Macedonian Denar</option>
                    <option value="ALL">🇦🇱 ALL - Albanian Lek</option>
                    <option value="RSD">🇷🇸 RSD - Serbian Dinar</option>
                    <option value="BAM">🇧🇦 BAM - Bosnia and Herzegovina Convertible Mark</option>
                    <option value="HRK">🇭🇷 HRK - Croatian Kuna</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Preferred Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                  >
                    <option value="USD">💵 USD - US Dollar</option>
                    <option value="EUR">💶 EUR - Euro</option>
                    <option value="GBP">💷 GBP - British Pound</option>
                    <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                    <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                    <option value="JPY">💴 JPY - Japanese Yen</option>
                    <option value="INR">🇮🇳 INR - Indian Rupee</option>
                    <option value="BRL">🇧🇷 BRL - Brazilian Real</option>
                    <option value="MXN">🇲🇽 MXN - Mexican Peso</option>
                    <option value="KRW">🇰🇷 KRW - South Korean Won</option>
                    <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                    <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                    <option value="SEK">🇸🇪 SEK - Swedish Krona</option>
                    <option value="NZD">🇳🇿 NZD - New Zealand Dollar</option>
                    <option value="SGD">🇸🇬 SGD - Singapore Dollar</option>
                    <option value="HKD">🇭🇰 HKD - Hong Kong Dollar</option>
                    <option value="NOK">🇳🇴 NOK - Norwegian Krone</option>
                    <option value="DKK">🇩🇰 DKK - Danish Krone</option>
                    <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
                    <option value="RUB">🇷🇺 RUB - Russian Ruble</option>
                    <option value="TRY">🇹🇷 TRY - Turkish Lira</option>
                    <option value="PLN">🇵🇱 PLN - Polish Złoty</option>
                    <option value="THB">🇹🇭 THB - Thai Baht</option>
                    <option value="IDR">🇮🇩 IDR - Indonesian Rupiah</option>
                    <option value="MYR">🇲🇾 MYR - Malaysian Ringgit</option>
                    <option value="PHP">🇵🇭 PHP - Philippine Peso</option>
                    <option value="CZK">🇨🇿 CZK - Czech Koruna</option>
                    <option value="HUF">🇭🇺 HUF - Hungarian Forint</option>
                    <option value="ILS">🇮🇱 ILS - Israeli Shekel</option>
                    <option value="AED">🇦🇪 AED - UAE Dirham</option>
                    <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
                    <option value="EGP">🇪🇬 EGP - Egyptian Pound</option>
                    <option value="ARS">🇦🇷 ARS - Argentine Peso</option>
                    <option value="CLP">🇨🇱 CLP - Chilean Peso</option>
                    <option value="COP">🇨🇴 COP - Colombian Peso</option>
                    <option value="PEN">🇵🇪 PEN - Peruvian Sol</option>
                    <option value="UYU">🇺🇾 UYU - Uruguayan Peso</option>
                    <option value="PYG">🇵🇾 PYG - Paraguayan Guarani</option>
                    <option value="BOB">🇧🇴 BOB - Bolivian Boliviano</option>
                    <option value="VES">🇻🇪 VES - Venezuelan Bolívar</option>
                    <option value="GTQ">🇬🇹 GTQ - Guatemalan Quetzal</option>
                    <option value="HNL">🇭🇳 HNL - Honduran Lempira</option>
                    <option value="NIO">🇳🇮 NIO - Nicaraguan Córdoba</option>
                    <option value="CRC">🇨🇷 CRC - Costa Rican Colón</option>
                    <option value="SVC">🇸🇻 SVC - Salvadoran Colón</option>
                    <option value="PAB">🇵🇦 PAB - Panamanian Balboa</option>
                    <option value="BMD">🇧🇲 BMD - Bermudian Dollar</option>
                    <option value="BSD">🇧🇸 BSD - Bahamian Dollar</option>
                    <option value="KYD">🇰🇾 KYD - Cayman Islands Dollar</option>
                    <option value="JMD">🇯🇲 JMD - Jamaican Dollar</option>
                    <option value="TTD">🇹🇹 TTD - Trinidad and Tobago Dollar</option>
                    <option value="BBD">🇧🇧 BBD - Barbadian Dollar</option>
                    <option value="XCD">🇦🇬 XCD - East Caribbean Dollar</option>
                    <option value="GYD">🇬🇾 GYD - Guyanese Dollar</option>
                    <option value="SRD">🇸🇷 SRD - Surinamese Dollar</option>
                    <option value="AWG">🇦🇼 AWG - Aruban Florin</option>
                    <option value="ANG">🇳🇱 ANG - Netherlands Antillean Guilder</option>
                    <option value="DOP">🇩🇴 DOP - Dominican Peso</option>
                    <option value="HTG">🇭🇹 HTG - Haitian Gourde</option>
                    <option value="CUP">🇨🇺 CUP - Cuban Peso</option>
                    <option value="CUC">🇨🇺 CUC - Cuban Convertible Peso</option>
                    <option value="FKP">🇫🇰 FKP - Falkland Islands Pound</option>
                    <option value="GIP">🇬🇮 GIP - Gibraltar Pound</option>
                    <option value="SHP">🇸🇭 SHP - Saint Helena Pound</option>
                    <option value="GGP">🇬🇬 GGP - Guernsey Pound</option>
                    <option value="IMP">🇮🇲 IMP - Isle of Man Pound</option>
                    <option value="JEP">🇯🇪 JEP - Jersey Pound</option>
                    <option value="LBP">🇱🇧 LBP - Lebanese Pound</option>
                    <option value="SYP">🇸🇾 SYP - Syrian Pound</option>
                    <option value="IQD">🇮🇶 IQD - Iraqi Dinar</option>
                    <option value="JOD">🇯🇴 JOD - Jordanian Dinar</option>
                    <option value="KWD">🇰🇼 KWD - Kuwaiti Dinar</option>
                    <option value="BHD">🇧🇭 BHD - Bahraini Dinar</option>
                    <option value="OMR">🇴🇲 OMR - Omani Rial</option>
                    <option value="QAR">🇶🇦 QAR - Qatari Riyal</option>
                    <option value="YER">🇾🇪 YER - Yemeni Rial</option>
                    <option value="LYD">🇱🇾 LYD - Libyan Dinar</option>
                    <option value="TND">🇹🇳 TND - Tunisian Dinar</option>
                    <option value="DZD">🇩🇿 DZD - Algerian Dinar</option>
                    <option value="MAD">🇲🇦 MAD - Moroccan Dirham</option>
                    <option value="STD">🇸🇹 STD - São Tomé and Príncipe Dobra</option>
                    <option value="CVE">🇨🇻 CVE - Cape Verdean Escudo</option>
                    <option value="GNF">🇬🇳 GNF - Guinean Franc</option>
                    <option value="XOF">🇨🇮 XOF - West African CFA Franc</option>
                    <option value="XAF">🇨🇲 XAF - Central African CFA Franc</option>
                    <option value="CDF">🇨🇩 CDF - Congolese Franc</option>
                    <option value="DJF">🇩🇯 DJF - Djiboutian Franc</option>
                    <option value="KMF">🇰🇲 KMF - Comorian Franc</option>
                    <option value="RWF">🇷🇼 RWF - Rwandan Franc</option>
                    <option value="BIF">🇧🇮 BIF - Burundian Franc</option>
                    <option value="MGA">🇲🇬 MGA - Malagasy Ariary</option>
                    <option value="MUR">🇲🇺 MUR - Mauritian Rupee</option>
                    <option value="SCR">🇸🇨 SCR - Seychellois Rupee</option>
                    <option value="MVR">🇲🇻 MVR - Maldivian Rufiyaa</option>
                    <option value="LKR">🇱🇰 LKR - Sri Lankan Rupee</option>
                    <option value="NPR">🇳🇵 NPR - Nepalese Rupee</option>
                    <option value="PKR">🇵🇰 PKR - Pakistani Rupee</option>
                    <option value="BDT">🇧🇩 BDT - Bangladeshi Taka</option>
                    <option value="BTN">🇧🇹 BTN - Bhutanese Ngultrum</option>
                    <option value="MMK">🇲🇲 MMK - Myanmar Kyat</option>
                    <option value="KHR">🇰🇭 KHR - Cambodian Riel</option>
                    <option value="LAK">🇱🇦 LAK - Lao Kip</option>
                    <option value="VND">🇻🇳 VND - Vietnamese Đồng</option>
                    <option value="KPW">🇰🇵 KPW - North Korean Won</option>
                    <option value="TWD">🇹🇼 TWD - New Taiwan Dollar</option>
                    <option value="MNT">🇲🇳 MNT - Mongolian Tögrög</option>
                    <option value="MOP">🇲🇴 MOP - Macanese Pataca</option>
                    <option value="BND">🇧🇳 BND - Brunei Dollar</option>
                    <option value="FJD">🇫🇯 FJD - Fijian Dollar</option>
                    <option value="PGK">🇵🇬 PGK - Papua New Guinean Kina</option>
                    <option value="SBD">🇸🇧 SBD - Solomon Islands Dollar</option>
                    <option value="TOP">🇹🇴 TOP - Tongan Pa&apos;anga</option>
                    <option value="VUV">🇻🇺 VUV - Vanuatu Vatu</option>
                    <option value="WST">🇼🇸 WST - Samoan Tala</option>
                    <option value="KID">🇰🇮 KID - Kiribati Dollar</option>
                    <option value="TVD">🇹🇻 TVD - Tuvaluan Dollar</option>
                    <option value="ETB">🇪🇹 ETB - Ethiopian Birr</option>
                    <option value="SOS">🇸🇴 SOS - Somali Shilling</option>
                    <option value="KES">🇰🇪 KES - Kenyan Shilling</option>
                    <option value="TZS">🇹🇿 TZS - Tanzanian Shilling</option>
                    <option value="UGX">🇺🇬 UGX - Ugandan Shilling</option>
                    <option value="SZL">🇸🇿 SZL - Swazi Lilangeni</option>
                    <option value="LSL">🇱🇸 LSL - Lesotho Loti</option>
                    <option value="NAD">🇳🇦 NAD - Namibian Dollar</option>
                    <option value="MWK">🇲🇼 MWK - Malawian Kwacha</option>
                    <option value="ZMW">🇿🇲 ZMW - Zambian Kwacha</option>
                    <option value="MZN">🇲🇿 MZN - Mozambican Metical</option>
                    <option value="AOA">🇦🇴 AOA - Angolan Kwanza</option>
                    <option value="GMD">🇬🇲 GMD - Gambian Dalasi</option>
                    <option value="SLL">🇸🇱 SLL - Sierra Leonean Leone</option>
                    <option value="LRD">🇱🇷 LRD - Liberian Dollar</option>
                    <option value="GHS">🇬🇭 GHS - Ghanaian Cedi</option>
                    <option value="NGN">🇳🇬 NGN - Nigerian Naira</option>
                    <option value="ERN">🇪🇷 ERN - Eritrean Nakfa</option>
                    <option value="SSP">🇸🇸 SSP - South Sudanese Pound</option>
                    <option value="SDG">🇸🇩 SDG - Sudanese Pound</option>
                    <option value="TMT">🇹🇲 TMT - Turkmenistani Manat</option>
                    <option value="TJS">🇹🇯 TJS - Tajikistani Somoni</option>
                    <option value="GEL">🇬🇪 GEL - Georgian Lari</option>
                    <option value="AMD">🇦🇲 AMD - Armenian Dram</option>
                    <option value="AZN">🇦🇿 AZN - Azerbaijani Manat</option>
                    <option value="BYN">🇧🇾 BYN - Belarusian Ruble</option>
                    <option value="MDL">🇲🇩 MDL - Moldovan Leu</option>
                    <option value="RON">🇷🇴 RON - Romanian Leu</option>
                    <option value="BGN">🇧🇬 BGN - Bulgarian Lev</option>
                    <option value="MKD">🇲🇰 MKD - Macedonian Denar</option>
                    <option value="ALL">🇦🇱 ALL - Albanian Lek</option>
                    <option value="RSD">🇷🇸 RSD - Serbian Dinar</option>
                    <option value="BAM">🇧🇦 BAM - Bosnia and Herzegovina Convertible Mark</option>
                    <option value="HRK">🇭🇷 HRK - Croatian Kuna</option>
                  </select>
                </div>
                </div>
                </div>
              )}

              {/* Step 4: Plan & Terms */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white border-b border-powerbi-gray-200 dark:border-powerbi-gray-600 pb-2">Plan & Terms</h3>
                <div>
                  <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Choose Your Plan</label>
                  <select
                    name="subscription_plan"
                    value={formData.subscription_plan}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic - $9.99/mo</option>
                    <option value="premium">Premium - $29.99/mo</option>
                  </select>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-powerbi-blue-50 dark:bg-powerbi-gray-700/50 rounded-lg border border-powerbi-blue-200 dark:border-powerbi-gray-600">
                  <input
                    type="checkbox"
                    name="accept_terms"
                    checked={formData.accept_terms}
                    onChange={handleChange}
                    required
                    className="mt-1 h-4 w-4 text-powerbi-primary focus:ring-powerbi-primary border-powerbi-gray-300 rounded"
                  />
                  <label className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300 leading-relaxed">
                    I accept the{' '}
                    <a href="#" className="text-powerbi-primary hover:text-powerbi-secondary font-medium underline">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-powerbi-primary hover:text-powerbi-secondary font-medium underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-powerbi-error/10 border border-powerbi-error/20 rounded-lg">
                  <p className="text-powerbi-error font-medium">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-700 dark:text-powerbi-gray-300 rounded-lg hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700 transition-all duration-200 w-full sm:w-auto shrink-0"
                  >
                    Back
                  </button>
                )}
                {currentStep < 4 && (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-gradient-to-r from-powerbi-primary to-powerbi-secondary hover:from-powerbi-secondary hover:to-powerbi-primary text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:ring-offset-2 shadow-lg hover:shadow-xl border-0 ml-auto w-full sm:w-auto shrink-0"
                  >
                    Next
                  </button>
                )}
                {currentStep === 4 && (
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-powerbi-primary to-powerbi-secondary hover:from-powerbi-secondary hover:to-powerbi-primary text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:ring-offset-2 shadow-lg hover:shadow-xl border-0 ml-auto w-full sm:w-auto shrink-0"
                  >
                    Start Free
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400">
                Already have an account?{' '}
                <a href="/login" className="text-powerbi-primary hover:text-powerbi-secondary font-semibold">
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}