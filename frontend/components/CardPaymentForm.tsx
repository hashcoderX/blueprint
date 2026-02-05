"use client";

import { useEffect, useMemo, useState } from 'react';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'diners' | 'unionpay' | 'maestro' | 'unknown';

export interface CardPaymentValue {
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  billing_address: string;
  postal_code: string;
}

export default function CardPaymentForm({
  country,
  value,
  onChange,
  onValidityChange
}: {
  country: string;
  value: CardPaymentValue;
  onChange: (v: Partial<CardPaymentValue>) => void;
  onValidityChange?: (valid: boolean, info: { brand: CardBrand }) => void;
}) {
  const [cvv, setCvv] = useState('');

  const digitsOnly = (s: string) => s.replace(/[^0-9]/g, '');

  const detectBrand = (num: string): CardBrand => {
    const n = digitsOnly(num);
    if (/^4\d{12}(\d{3})?$/.test(n)) return 'visa';
    if (/^(5[1-5]\d{14}|2(2[2-9]|[3-6]\d|7[01])\d{12})$/.test(n)) return 'mastercard';
    if (/^3[47]\d{13}$/.test(n)) return 'amex';
    if (/^6(011\d{12}|5\d{14}|4[4-9]\d{13}|22(1|2)\d{12})$/.test(n) || /^(6011|622[1-9]\d{2}|64[4-9]|65)/.test(n)) return 'discover';
    if (/^(2131|1800)\d{11}|35\d{14}$/.test(n)) return 'jcb';
    if (/^3(?:0[0-5]|[68]\d)\d{11}$/.test(n)) return 'diners';
    if (/^62\d{14,17}$/.test(n)) return 'unionpay';
    if (/^(5[06789]\d\d|6\d{3})\d{8,15}$/.test(n)) return 'maestro';
    return 'unknown';
  };

  const luhnCheck = (num: string) => {
    const n = digitsOnly(num);
    let sum = 0; let dbl = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let d = parseInt(n[i], 10);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return n.length >= 12 && sum % 10 === 0;
  };

  const brand: CardBrand = useMemo(() => detectBrand(value.card_number), [value.card_number]);

  const isValidCVV = useMemo(() => {
    const cvvDigits = digitsOnly(cvv);
    switch (brand) {
      case 'amex': return /^\d{4}$/.test(cvvDigits);
      case 'visa':
      case 'mastercard':
      case 'discover':
      case 'jcb':
      case 'diners':
      case 'unionpay':
      case 'maestro':
        return /^\d{3}$/.test(cvvDigits);
      default:
        return /^\d{3,4}$/.test(cvvDigits);
    }
  }, [cvv, brand]);

  const isValidExpiry = useMemo(() => {
    const m = parseInt(value.expiry_month || '0', 10);
    const y = parseInt(value.expiry_year || '0', 10);
    if (!(m >= 1 && m <= 12)) return false;
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    if (!(y >= curY && y < curY + 30)) return false;
    if (y === curY && m < curM) return false;
    return true;
  }, [value.expiry_month, value.expiry_year]);

  const isValidPostal = useMemo(() => {
    const p = (value.postal_code || '').trim();
    if (!p) return false;
    // Country-specific quick checks
    const cc = (country || '').toLowerCase();
    if (cc === 'united states' || cc === 'usa' || cc === 'us') {
      return /^\d{5}(-\d{4})?$/.test(p);
    }
    if (cc === 'canada') {
      return /^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$/.test(p);
    }
    if (cc === 'united kingdom' || cc === 'uk') {
      return /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/i.test(p);
    }
    // Generic fallback: 3-10 alphanumeric
    return /^[A-Za-z0-9\- ]{3,10}$/.test(p);
  }, [value.postal_code, country]);

  const isValidNumber = useMemo(() => luhnCheck(value.card_number), [value.card_number]);

  useEffect(() => {
    const valid = isValidNumber && isValidExpiry && isValidCVV && isValidPostal && (value.billing_address || '').trim().length >= 3;
    onValidityChange && onValidityChange(valid, { brand });
  }, [isValidNumber, isValidExpiry, isValidCVV, isValidPostal, value.billing_address, brand, onValidityChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Card Number</label>
          <input
            type="text"
            value={value.card_number}
            onChange={(e) => {
              const v = digitsOnly(e.target.value).slice(0, 19);
              const grouped = v.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
              onChange({ card_number: grouped });
            }}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
          />
          <div className="mt-1 text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">Brand: {brand}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Expiry Month (MM)</label>
          <input
            type="number"
            min={1}
            max={12}
            value={value.expiry_month}
            onChange={(e) => onChange({ expiry_month: e.target.value })}
            className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Expiry Year (YYYY)</label>
          <input
            type="number"
            min={new Date().getFullYear()}
            max={new Date().getFullYear() + 30}
            value={value.expiry_year}
            onChange={(e) => onChange({ expiry_year: e.target.value })}
            className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">CVV</label>
          <input
            type="password"
            value={cvv}
            onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, 4))}
            placeholder={brand === 'amex' ? '4 digits' : '3 digits'}
            className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white"
          />
          <div className={`mt-1 text-xs ${isValidCVV ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{isValidCVV ? 'CVV looks good' : 'Invalid CVV'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Postal Code</label>
          <input
            type="text"
            value={value.postal_code}
            onChange={(e) => onChange({ postal_code: e.target.value })}
            className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Billing Address</label>
          <input
            type="text"
            value={value.billing_address}
            onChange={(e) => onChange({ billing_address: e.target.value })}
            className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white"
          />
        </div>
      </div>
      <p className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">We validate card locally and encrypt server-side. CVV is not stored or transmitted.</p>
    </div>
  );
}
