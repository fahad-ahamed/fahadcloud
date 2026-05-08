// bKash Payment Verification System
// Real bKash Merchant API integration with fallback validation

interface BkashVerificationResult {
  valid: boolean;
  amount?: number;
  sender?: string;
  time?: string;
  trxId?: string;
  status?: string;
  error?: string;
  fraudFlags?: string[];
}

export function validateTrxIdFormat(trxId: string): { valid: boolean; error?: string } {
  if (!trxId || typeof trxId !== 'string') {
    return { valid: false, error: 'Transaction ID is required' };
  }
  const cleaned = trxId.trim().toUpperCase();
  if (cleaned.length < 8 || cleaned.length > 15) {
    return { valid: false, error: 'Invalid TRX ID format: must be 8-15 characters' };
  }
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, error: 'Invalid TRX ID format: only letters and numbers allowed' };
  }
  const fakePatterns = [
    /^(.)\1{7,}$/,
    /^(0|1|123|ABC|TEST)/,
    /^(AAA|BBB|CCC|DDD|EEE|FFF|GGG|HHH|III|JJJ|KKK|LLL|MMM|NNN|OOO|PPP|QQQ|RRR|SSS|TTT|UUU|VVV|WWW|XXX|YYY|ZZZ)/,
    /^TEST/i,
    /^FAKE/i,
    /^NULL/i,
    /^NONE/i,
    /^00000000/,
  ];
  for (const pattern of fakePatterns) {
    if (pattern.test(cleaned)) {
      return { valid: false, error: 'Invalid TRX ID: appears to be fake or invalid' };
    }
  }
  return { valid: true };
}

export function validateBkashNumber(number: string): { valid: boolean; error?: string; formatted?: string } {
  if (!number || typeof number !== 'string') {
    return { valid: false, error: 'bKash number is required' };
  }
  let cleaned = number.replace(/[\s\-]/g, '');
  if (cleaned.startsWith('+880')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3);
  }
  if (!/^01[3-9]\d{8}$/.test(cleaned)) {
    return { valid: false, error: 'Invalid bKash number. Use format: 01XXXXXXXXX' };
  }
  return { valid: true, formatted: cleaned };
}

// Real bKash API verification
export async function verifyBkashPayment(
  trxId: string,
  expectedAmount: number,
  senderNumber?: string
): Promise<BkashVerificationResult> {
  const fraudFlags: string[] = [];

  // Step 1: Validate TRX ID format
  const formatCheck = validateTrxIdFormat(trxId);
  if (!formatCheck.valid) {
    return { valid: false, error: formatCheck.error, fraudFlags: ['invalid_trx_format'] };
  }

  // Step 2: Validate sender number if provided
  if (senderNumber) {
    const numberCheck = validateBkashNumber(senderNumber);
    if (!numberCheck.valid) {
      fraudFlags.push('invalid_sender_number');
    }
  }

  const cleanedTrxId = trxId.trim().toUpperCase();

  try {
    // If bKash Merchant API is configured, use real verification
    const bkashApiKey = process.env.BKASH_API_KEY;
    const bkashApiSecret = process.env.BKASH_API_SECRET;
    const bkashMerchantNumber = process.env.BKASH_MERCHANT_NUMBER;
    const bkashBaseUrl = process.env.BKASH_API_URL || 'https://checkout.pay.bka.sh/v1.2.0-beta';

    if (bkashApiKey && bkashApiSecret && bkashMerchantNumber) {
      // Real bKash API Integration
      // Step 1: Get auth token
      const authResponse = await fetch(`${bkashBaseUrl}/tokenized/checkout/token/grant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          username: bkashApiKey,
          password: bkashApiSecret,
        },
        body: JSON.stringify({
          app_key: bkashApiKey,
          app_secret: bkashApiSecret,
        }),
      });

      if (!authResponse.ok) {
        console.error('bKash auth failed:', authResponse.status);
        // Fall back to manual verification
        return {
          valid: false,
          error: 'bKash API authentication failed. Payment will be verified manually by admin.',
          fraudFlags,
          trxId: cleanedTrxId,
        };
      }

      const authData = await authResponse.json();
      const token = authData.id_token;

      if (!token) {
        return {
          valid: false,
          error: 'bKash API token not received. Payment will be verified manually.',
          fraudFlags,
          trxId: cleanedTrxId,
        };
      }

      // Step 2: Search transaction by TRX ID
      const searchResponse = await fetch(`${bkashBaseUrl}/tokenized/checkout/general/searchTransaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: token,
          'x-app-key': bkashApiKey,
        },
        body: JSON.stringify({
          trxID: cleanedTrxId,
        }),
      });

      if (!searchResponse.ok) {
        return {
          valid: false,
          error: 'Transaction not found in bKash system. Please verify your TRX ID.',
          fraudFlags: ['trx_not_found'],
          trxId: cleanedTrxId,
        };
      }

      const searchData = await searchResponse.json();

      if (searchData.transactionStatus !== 'Completed') {
        return {
          valid: false,
          error: `Transaction status is "${searchData.transactionStatus}", not "Completed".`,
          fraudFlags: ['incomplete_transaction'],
          trxId: cleanedTrxId,
          status: searchData.transactionStatus,
        };
      }

      // Step 3: Verify amount matches
      const paidAmount = parseFloat(searchData.amount || '0');
      if (Math.abs(paidAmount - expectedAmount) > 1) {
        fraudFlags.push('amount_mismatch');
        return {
          valid: false,
          error: `Amount mismatch. Expected ৳${expectedAmount}, got ৳${paidAmount}.`,
          amount: paidAmount,
          fraudFlags,
          trxId: cleanedTrxId,
        };
      }

      // Step 4: Verify receiver (should be our merchant number)
      if (searchData.receiverMsisdn !== bkashMerchantNumber) {
        fraudFlags.push('wrong_receiver');
        return {
          valid: false,
          error: 'Payment was sent to wrong number.',
          fraudFlags,
          trxId: cleanedTrxId,
        };
      }

      // Step 5: Verify sender if provided
      if (senderNumber) {
        const numberCheck = validateBkashNumber(senderNumber);
        if (numberCheck.valid && searchData.senderMsisdn !== numberCheck.formatted) {
          fraudFlags.push('sender_mismatch');
        }
      }

      return {
        valid: true,
        amount: paidAmount,
        sender: searchData.senderMsisdn,
        time: searchData.completedTime || searchData.createdAt,
        trxId: cleanedTrxId,
        status: searchData.transactionStatus,
        fraudFlags,
      };
    }

    // Without real bKash API: Return needs_manual_verification
    // Admin must manually verify and approve
    return {
      valid: false,
      error: 'bKash API not configured. Payment requires manual admin verification.',
      fraudFlags,
      trxId: cleanedTrxId,
    };

  } catch (error: any) {
    console.error('bKash verification error:', error);
    return {
      valid: false,
      error: 'Verification service unavailable. Payment will be verified manually.',
      fraudFlags: [...fraudFlags, 'api_error'],
      trxId: cleanedTrxId,
    };
  }
}

// Calculate BDT amount from USD
export function usdToBdt(usd: number): number {
  const rate = parseFloat(process.env.USD_TO_BDT || '110');
  return Math.round(usd * rate * 100) / 100;
}
