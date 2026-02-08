"use client";

import { useState } from 'react';
import CardPaymentForm, { CardPaymentValue } from '../../components/CardPaymentForm';

export default function PaymentTestPage() {
  const [country, setCountry] = useState<string>('United States');
  const [value, setValue] = useState<CardPaymentValue>({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    billing_address: '',
    postal_code: '',
  });
  const [valid, setValid] = useState(false);
  const [brand, setBrand] = useState<string>('unknown');

  return (
    <div className="min-h-screen bg-gradient-to-br from-powerbi-blue-50 via-white to-powerbi-blue-100 dark:from-powerbi-gray-900 dark:via-powerbi-gray-800 dark:to-powerbi-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-2xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6 md:p-10">
        <h1 className="text-2xl font-bold text-powerbi-gray-900 dark:text-white mb-2">Payment Test Harness</h1>
        <p className="text-powerbi-gray-600 dark:text-powerbi-gray-300 mb-6">Use this page to exercise card brand detection, CVV rules, and postal validation. No data is sent to the server.</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
          >
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Australia">Australia</option>
            <option value="India">India</option>
          </select>
        </div>

        <CardPaymentForm
          country={country}
          value={value}
          onChange={(v) => setValue({ ...value, ...v })}
          onValidityChange={(isValid, info) => { setValid(isValid); setBrand(info.brand); }}
        />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
            <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">Detected Brand</div>
            <div className="text-lg font-semibold text-powerbi-gray-900 dark:text-white capitalize">{brand}</div>
          </div>
          <div className="p-4 rounded-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
            <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">Form Valid</div>
            <div className={`text-lg font-semibold ${valid ? 'text-green-600' : 'text-red-600'}`}>{valid ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="mt-6 text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400">
          This harness does not store or transmit CVV; it's only used for client-side validation rules.
        </div>
      </div>
    </div>
  );
}
