import { QRType, ParsedQRDetails } from '../types/qr';

export function detectQRType(rawText: string): QRType {
  const text = (rawText || '').trim();

  // Wi-Fi detection: WIFI:S:... or similar
  if (/^WIFI:/i.test(text)) {
    return 'wifi';
  }

  // vCard / MeCard detection
  if (/^BEGIN:VCARD/i.test(text) || /^MECARD:/i.test(text)) {
    return 'contact';
  }

  // Geo location detection: geo:lat,long or geo:lat,long?q=...
  if (/^geo:/i.test(text)) {
    return 'location';
  }

  // Phone detection: tel: or clean international phone numbers
  if (/^tel:/i.test(text)) {
    return 'phone';
  }

  // SMS detection: smsto: or sms:
  if (/^smsto:/i.test(text) || /^sms:/i.test(text)) {
    return 'sms';
  }

  // Email detection: mailto: or plain email address
  if (/^mailto:/i.test(text) || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(text)) {
    return 'email';
  }

  // Photo QR detection (Supabase storage, cloud CDN, or direct image link)
  if (
    /iili\.io/i.test(text) ||
    /\/storage\/v1\/object\/public\/.*\/photos\//i.test(text) ||
    /\/files\/(view\/|download\/)?P-[a-zA-Z0-9_-]+/i.test(text) ||
    /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(text)
  ) {
    return 'photo';
  }

  // File / PDF QR detection (Supabase storage, tmpfiles cloud CDN, or direct document link)
  if (
    /tmpfiles\.org/i.test(text) ||
    /\/storage\/v1\/object\/public\/.*\/pdfs\//i.test(text) ||
    /\/files\/(view\/|download\/)?F-[a-zA-Z0-9_-]+/i.test(text) ||
    /\.(pdf|docx?|xlsx?|txt|csv|zip)(\?.*)?$/i.test(text)
  ) {
    return 'file';
  }

  // Dangerous / Web URI schemes (intercepted by URL Safety Engine)
  if (/^(javascript|data|file|content|intent|vbscript|blob):/i.test(text)) {
    return 'url';
  }

  // URL detection
  if (/^(https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(text)) {
    return 'url';
  }

  // Check if it's a domain name without protocol (e.g. google.com, example.org/page)
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i.test(text)) {
    return 'url';
  }

  // Standalone phone number test e.g. +1234567890 or 9876543210
  if (/^\+?[0-9]{7,15}$/.test(text.replace(/[\s-()]/g, ''))) {
    return 'phone';
  }

  return 'text';
}

export function parseQRData(rawData: string): ParsedQRDetails {
  const raw = (rawData || '').trim();
  const type = detectQRType(raw);

  switch (type) {
    case 'photo': {
      let photoUrl = raw;
      if (!/^https?:\/\//i.test(photoUrl)) photoUrl = `https://${photoUrl}`;
      return {
        type: 'photo',
        raw: photoUrl,
        title: 'Photo QR Image',
        subtitle: 'Secure Photo Cloud Link',
        fields: [
          { label: 'File Type', value: 'Image / Photo' },
          { label: 'Photo URL', value: photoUrl },
          { label: 'Access', value: 'Instant Browser Preview & Download' },
        ],
        primaryAction: {
          label: 'Preview Photo',
          icon: 'image-outline',
          actionType: 'open_url',
        },
      };
    }

    case 'file': {
      let fileUrl = raw;
      if (!/^https?:\/\//i.test(fileUrl)) fileUrl = `https://${fileUrl}`;
      return {
        type: 'file',
        raw: fileUrl,
        title: 'Document / PDF QR',
        subtitle: 'Secure Document Cloud Link',
        fields: [
          { label: 'File Type', value: 'Document / PDF File' },
          { label: 'Document URL', value: fileUrl },
          { label: 'Access', value: 'Download & View Document' },
        ],
        primaryAction: {
          label: 'Open Document',
          icon: 'document-text-outline',
          actionType: 'open_url',
        },
      };
    }

    case 'url': {
      let normalizedUrl = raw;
      if (!/^https?:\/\//i.test(normalizedUrl) && !/^ftp:\/\//i.test(normalizedUrl)) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      let domain = normalizedUrl;
      try {
        const urlObj = new URL(normalizedUrl);
        domain = urlObj.hostname;
      } catch (e) {
        domain = normalizedUrl.replace(/^https?:\/\//, '').split('/')[0];
      }

      return {
        type: 'url',
        raw: normalizedUrl,
        title: domain || 'Website URL',
        subtitle: 'Web Link',
        fields: [
          { label: 'URL Destination', value: normalizedUrl },
          { label: 'Domain Host', value: domain },
          { label: 'Protocol', value: normalizedUrl.startsWith('https') ? 'HTTPS (Secure)' : 'HTTP' },
        ],
        primaryAction: {
          label: 'Open Website',
          icon: 'open-outline',
          actionType: 'open_url',
        },
      };
    }

    case 'wifi': {
      // Parse WIFI:T:WPA;S:MySSID;P:MyPassword;H:true;;
      const ssidMatch = raw.match(/S:([^;]+)/i);
      const passMatch = raw.match(/P:([^;]+)/i);
      const typeMatch = raw.match(/T:([^;]+)/i);
      const hiddenMatch = raw.match(/H:([^;]+)/i);

      const ssid = ssidMatch ? ssidMatch[1] : 'Unknown Network';
      const password = passMatch ? passMatch[1] : '';
      const authType = typeMatch ? typeMatch[1] : 'WPA/WPA2';
      const isHidden = hiddenMatch ? hiddenMatch[1].toLowerCase() === 'true' : false;

      return {
        type: 'wifi',
        raw,
        title: ssid,
        subtitle: `Wi-Fi Network (${authType})`,
        fields: [
          { label: 'Network Name (SSID)', value: ssid },
          { label: 'Security Type', value: authType || 'None' },
          { label: 'Password', value: password ? password : '(Open Network - No Password)', isSensitive: Boolean(password) },
          { label: 'Hidden Network', value: isHidden ? 'Yes' : 'No' },
        ],
        primaryAction: {
          label: password ? 'Copy Wi-Fi Password' : 'Copy Network Name',
          icon: 'copy-outline',
          actionType: 'copy',
        },
      };
    }

    case 'phone': {
      let cleanNumber = raw.replace(/^tel:/i, '').trim();
      return {
        type: 'phone',
        raw: cleanNumber,
        title: cleanNumber,
        subtitle: 'Phone Number',
        fields: [
          { label: 'Number', value: cleanNumber },
        ],
        primaryAction: {
          label: 'Call Number',
          icon: 'call-outline',
          actionType: 'call',
        },
      };
    }

    case 'email': {
      let emailAddress = raw.replace(/^mailto:/i, '');
      let subject = '';
      let body = '';

      if (emailAddress.includes('?')) {
        const [addr, query] = emailAddress.split('?');
        emailAddress = addr;
        const params = new URLSearchParams(query);
        subject = params.get('subject') || '';
        body = params.get('body') || '';
      }

      return {
        type: 'email',
        raw: raw.startsWith('mailto:') ? raw : `mailto:${raw}`,
        title: emailAddress,
        subtitle: 'Email Address',
        fields: [
          { label: 'Recipient', value: emailAddress },
          ...(subject ? [{ label: 'Subject', value: subject }] : []),
          ...(body ? [{ label: 'Message Body', value: body }] : []),
        ],
        primaryAction: {
          label: 'Send Email',
          icon: 'mail-outline',
          actionType: 'email',
        },
      };
    }

    case 'sms': {
      let target = raw.replace(/^(smsto:|sms:)/i, '');
      let phone = target;
      let message = '';

      if (target.includes(':')) {
        const parts = target.split(':');
        phone = parts[0];
        message = parts.slice(1).join(':');
      } else if (target.includes('?body=')) {
        const parts = target.split('?body=');
        phone = parts[0];
        message = decodeURIComponent(parts[1] || '');
      }

      return {
        type: 'sms',
        raw,
        title: phone || 'SMS Message',
        subtitle: 'Text Message',
        fields: [
          { label: 'Recipient Phone', value: phone },
          ...(message ? [{ label: 'Message Text', value: message }] : []),
        ],
        primaryAction: {
          label: 'Send SMS',
          icon: 'chatbubble-outline',
          actionType: 'sms',
        },
      };
    }

    case 'location': {
      // geo:37.7749,-122.4194 or geo:37.7749,-122.4194?q=...
      const cleanGeo = raw.replace(/^geo:/i, '');
      const [coords, query] = cleanGeo.split('?');
      const [lat, lng] = coords.split(',');

      return {
        type: 'location',
        raw,
        title: `${lat || '0.0'}, ${lng || '0.0'}`,
        subtitle: 'Geographic Location',
        fields: [
          { label: 'Latitude', value: lat || '0.0' },
          { label: 'Longitude', value: lng || '0.0' },
          ...(query ? [{ label: 'Query / Label', value: query }] : []),
        ],
        primaryAction: {
          label: 'Open in Maps',
          icon: 'map-outline',
          actionType: 'map',
        },
      };
    }

    case 'contact': {
      // Parse vCard fields
      const fnMatch = raw.match(/FN:(.*?)(\r?\n|$)/i);
      const telMatch = raw.match(/TEL.*?:(.*?)(\r?\n|$)/i);
      const emailMatch = raw.match(/EMAIL.*?:(.*?)(\r?\n|$)/i);
      const orgMatch = raw.match(/ORG:(.*?)(\r?\n|$)/i);
      const urlMatch = raw.match(/URL:(.*?)(\r?\n|$)/i);
      const adrMatch = raw.match(/ADR.*?:(.*?)(\r?\n|$)/i);

      const name = fnMatch ? fnMatch[1].trim() : 'Contact Card';
      const phone = telMatch ? telMatch[1].trim() : '';
      const email = emailMatch ? emailMatch[1].trim() : '';
      const company = orgMatch ? orgMatch[1].trim() : '';
      const url = urlMatch ? urlMatch[1].trim() : '';
      const address = adrMatch ? adrMatch[1].replace(/;/g, ' ').trim() : '';

      return {
        type: 'contact',
        raw,
        title: name,
        subtitle: company || 'Contact Card',
        fields: [
          { label: 'Full Name', value: name },
          ...(phone ? [{ label: 'Phone', value: phone }] : []),
          ...(email ? [{ label: 'Email', value: email }] : []),
          ...(company ? [{ label: 'Company/Org', value: company }] : []),
          ...(url ? [{ label: 'Website', value: url }] : []),
          ...(address ? [{ label: 'Address', value: address }] : []),
        ],
        primaryAction: {
          label: phone ? 'Call Contact' : 'Copy Details',
          icon: phone ? 'call-outline' : 'copy-outline',
          actionType: phone ? 'call' : 'copy',
        },
      };
    }

    case 'text':
    default: {
      const isShort = raw.length < 40;
      return {
        type: 'text',
        raw,
        title: isShort ? raw : `${raw.substring(0, 35)}...`,
        subtitle: 'Plain Text Data',
        fields: [
          { label: 'Text Content', value: raw },
          { label: 'Character Count', value: `${raw.length} characters` },
        ],
        primaryAction: {
          label: 'Copy Text',
          icon: 'copy-outline',
          actionType: 'copy',
        },
      };
    }
  }
}
