/**
 * Represents a MAC address
 * @class AddressMac
 * @param {string} address - A MAC address string
 */
export class AddressMac {
  address: string;

  constructor(address: string) {
    this.address = address;

    if (!this.parse(address)) {
      throw new Error('Invalid MAC address.');
    }
  }

  /**
   * Validates if a string is a valid MAC address
   * @param {string} address - The MAC address string to validate
   * @returns {boolean}
   */
  static isValid(address: string): boolean {
    try {
      new AddressMac(address);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Parses a MAC address string
   * @param {string} address - The MAC address string to parse
   * @returns {boolean}
   */
  private parse(address: string): boolean {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(address);
  }
}
