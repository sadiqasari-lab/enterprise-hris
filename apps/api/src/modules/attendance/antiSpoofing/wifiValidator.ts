/**
 * WiFi Validator
 * Validates WiFi SSID for attendance check-in
 */

export interface WiFiValidationResult {
  isValid: boolean;
  flags: string[];
  message?: string;
}

export class WiFiValidator {
  /**
   * Validate WiFi SSID against allowed list
   */
  async validate(
    wifiSSID: string | null,
    allowedSSIDs: string[]
  ): Promise<WiFiValidationResult> {
    const flags: string[] = [];

    // If WiFi validation is required but no SSID provided
    if (!wifiSSID) {
      flags.push('WIFI_NOT_CONNECTED');
      return {
        isValid: false,
        flags,
        message: 'Not connected to any WiFi network',
      };
    }

    // Check if SSID is in allowed list
    const isAllowed = allowedSSIDs.some(
      (allowed) => allowed.toLowerCase() === wifiSSID.toLowerCase()
    );

    if (!isAllowed) {
      flags.push('WIFI_SSID_NOT_ALLOWED');
      return {
        isValid: false,
        flags,
        message: `WiFi network "${wifiSSID}" is not allowed`,
      };
    }

    // Validate SSID format (basic check)
    if (!this.isValidSSIDFormat(wifiSSID)) {
      flags.push('WIFI_INVALID_FORMAT');
      return {
        isValid: false,
        flags,
        message: 'WiFi SSID format is invalid',
      };
    }

    return {
      isValid: true,
      flags: [],
    };
  }

  /**
   * Validate SSID format
   */
  private isValidSSIDFormat(ssid: string): boolean {
    // SSID should be 1-32 characters
    if (ssid.length < 1 || ssid.length > 32) {
      return false;
    }

    // SSID should not be empty or just whitespace
    if (ssid.trim().length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Check if WiFi is enabled (based on SSID presence)
   */
  isWiFiEnabled(wifiSSID: string | null): boolean {
    return wifiSSID !== null && wifiSSID.trim().length > 0;
  }

  /**
   * Add SSID to allowed list
   */
  addAllowedSSID(currentList: string[], newSSID: string): string[] {
    if (!currentList.includes(newSSID)) {
      return [...currentList, newSSID];
    }
    return currentList;
  }

  /**
   * Remove SSID from allowed list
   */
  removeAllowedSSID(currentList: string[], ssidToRemove: string): string[] {
    return currentList.filter((ssid) => ssid !== ssidToRemove);
  }
}
