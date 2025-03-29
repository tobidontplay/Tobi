import { supabase } from './supabase';
import { ShippingAddress } from '../components/ShippingAddressForm';

// Type for the shipping address with id from the database
export interface ShippingAddressWithId extends ShippingAddress {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Save a shipping address to the database
export async function saveShippingAddress(address: ShippingAddress, userId: string): Promise<ShippingAddressWithId | null> {
  try {
    // If this is set as default, first unset any existing default
    if (address.isDefault) {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    // Insert the new address
    const { data, error } = await supabase
      .from('shipping_addresses')
      .insert([
        {
          user_id: userId,
          full_name: address.fullName,
          address_line1: address.addressLine1,
          address_line2: address.addressLine2,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          country: address.country,
          phone: address.phone,
          is_default: address.isDefault
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as ShippingAddressWithId;
  } catch (error) {
    console.error('Error saving shipping address:', error);
    return null;
  }
}

// Get all shipping addresses for a user
export async function getShippingAddresses(userId: string): Promise<ShippingAddressWithId[]> {
  try {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ShippingAddressWithId[];
  } catch (error) {
    console.error('Error fetching shipping addresses:', error);
    return [];
  }
}

// Get a specific shipping address by ID
export async function getShippingAddressById(addressId: string): Promise<ShippingAddressWithId | null> {
  try {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (error) throw error;
    return data as ShippingAddressWithId;
  } catch (error) {
    console.error('Error fetching shipping address:', error);
    return null;
  }
}

// Get the default shipping address for a user
export async function getDefaultShippingAddress(userId: string): Promise<ShippingAddressWithId | null> {
  try {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      // If no default address is found, get the most recent one
      const { data: recentData, error: recentError } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (recentError) return null;
      return recentData as ShippingAddressWithId;
    }
    
    return data as ShippingAddressWithId;
  } catch (error) {
    console.error('Error fetching default shipping address:', error);
    return null;
  }
}

// Update a shipping address
export async function updateShippingAddress(addressId: string, address: Partial<ShippingAddress>): Promise<ShippingAddressWithId | null> {
  try {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .update({
        full_name: address.fullName,
        address_line1: address.addressLine1,
        address_line2: address.addressLine2,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country,
        phone: address.phone,
        is_default: address.isDefault,
        updated_at: new Date().toISOString()
      })
      .eq('id', addressId)
      .select()
      .single();

    if (error) throw error;
    return data as ShippingAddressWithId;
  } catch (error) {
    console.error('Error updating shipping address:', error);
    return null;
  }
}

// Delete a shipping address
export async function deleteShippingAddress(addressId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('id', addressId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting shipping address:', error);
    return false;
  }
}

// Validate an address (in a real app, this would call an address validation API)
export async function validateAddress(address: ShippingAddress): Promise<{ valid: boolean; suggestions?: ShippingAddress[] }> {
  // This is a mock implementation
  // In a production app, you would integrate with a service like:
  // - Google Places API
  // - SmartyStreets
  // - USPS Address Validation
  // - Shippo Address Validation

  // For now, we'll do basic validation
  const requiredFields = [
    'fullName',
    'addressLine1',
    'city',
    'state',
    'postalCode',
    'country',
    'phone'
  ];
  
  const missingFields = requiredFields.filter(field => 
    !address[field as keyof ShippingAddress] || 
    address[field as keyof ShippingAddress].toString().trim() === ''
  );
  
  if (missingFields.length > 0) {
    return { valid: false };
  }
  
  // Simple postal code format validation
  const postalCodeValid = address.country === 'United States' 
    ? /^\d{5}(-\d{4})?$/.test(address.postalCode) // US ZIP code
    : address.postalCode.length > 3; // Simple check for other countries
  
  if (!postalCodeValid) {
    return { 
      valid: false,
      suggestions: [{
        ...address,
        postalCode: address.country === 'United States' ? '12345' : address.postalCode
      }]
    };
  }
  
  // Mock a successful validation
  return { valid: true };
}
