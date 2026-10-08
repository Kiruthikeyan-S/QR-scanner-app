import {
  WifiFormData,
  ContactFormData,
  LocationFormData,
  PhoneFormData,
  EmailFormData,
  SMSFormData,
  TextFormData,
  URLFormData,
  OrderFormData,
  JSONFormData,
} from '../types/qr';

export const QRFormatter = {
  formatURL(data: URLFormData): string {
    let url = data.url.trim();
    if (!url) return '';
    if (!/^https?:\/\//i.test(url) && !/^ftp:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    return url;
  },

  formatText(data: TextFormData): string {
    return data.text.trim();
  },

  formatWifi(data: WifiFormData): string {
    const ssid = (data.ssid || '').replace(/([\\;,:])/g, '\\$1');
    const password = (data.password || '').replace(/([\\;,:])/g, '\\$1');
    const security = data.security || 'WPA';
    const hidden = data.hidden ? 'true' : 'false';

    if (security === 'nopass') {
      return `WIFI:T:nopass;S:${ssid};;`;
    }
    return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden};;`;
  },

  formatPhone(data: PhoneFormData): string {
    const code = (data.countryCode || '').trim();
    const phone = (data.phoneNumber || '').trim().replace(/[^0-9]/g, '');
    const full = code ? (code.startsWith('+') ? `${code}${phone}` : `+${code}${phone}`) : phone;
    return `tel:${full}`;
  },

  formatEmail(data: EmailFormData): string {
    const email = data.email.trim();
    const params: string[] = [];
    if (data.subject?.trim()) {
      params.push(`subject=${encodeURIComponent(data.subject.trim())}`);
    }
    if (data.body?.trim()) {
      params.push(`body=${encodeURIComponent(data.body.trim())}`);
    }
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return `mailto:${email}${query}`;
  },

  formatSMS(data: SMSFormData): string {
    const phone = (data.phoneNumber || '').trim();
    const message = (data.message || '').trim();
    if (!message) {
      return `smsto:${phone}`;
    }
    return `smsto:${phone}:${message}`;
  },

  formatContact(data: ContactFormData): string {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${data.fullName.trim()}`,
      `N:;${data.fullName.trim()};;;`,
    ];

    if (data.phone?.trim()) {
      lines.push(`TEL;TYPE=CELL:${data.phone.trim()}`);
    }
    if (data.email?.trim()) {
      lines.push(`EMAIL;TYPE=INTERNET:${data.email.trim()}`);
    }
    if (data.company?.trim()) {
      lines.push(`ORG:${data.company.trim()}`);
    }
    if (data.website?.trim()) {
      lines.push(`URL:${data.website.trim()}`);
    }
    if (data.address?.trim()) {
      lines.push(`ADR:;;${data.address.trim()};;;;`);
    }

    lines.push('END:VCARD');
    return lines.join('\n');
  },

  formatLocation(data: LocationFormData): string {
    const lat = data.latitude.trim();
    const lng = data.longitude.trim();
    if (data.label?.trim()) {
      return `geo:${lat},${lng}?q=${encodeURIComponent(data.label.trim())}`;
    }
    return `geo:${lat},${lng}`;
  },

  formatOrderId(data: OrderFormData): string {
    const orderId = data.orderId.trim();
    const hasExtras = Boolean(
      (data.customerName && data.customerName.trim()) ||
      (data.reference && data.reference.trim()) ||
      (data.note && data.note.trim())
    );

    if (hasExtras) {
      const payload: Record<string, string> = {
        type: 'order_id',
        order_id: orderId,
      };
      if (data.customerName?.trim()) payload.customer = data.customerName.trim();
      if (data.reference?.trim()) payload.reference = data.reference.trim();
      if (data.note?.trim()) payload.note = data.note.trim();
      return JSON.stringify(payload, null, 2);
    }

    return orderId;
  },

  formatJSON(data: JSONFormData): string {
    const trimmed = data.jsonString.trim();
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return trimmed;
    }
  },
};
