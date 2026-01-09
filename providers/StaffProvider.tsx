import { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StaffMember } from '@/types/staff';
import { mockStaff } from '@/mocks/staff';

export const [StaffProvider, useStaff] = createContextHook(() => {
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const stored = await AsyncStorage.getItem('staff');
      if (stored) {
        setStaff(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStaff = async (newStaff: StaffMember[]) => {
    try {
      await AsyncStorage.setItem('staff', JSON.stringify(newStaff));
      setStaff(newStaff);
    } catch (error) {
      console.error('Error saving staff:', error);
    }
  };

  const addStaffMember = (member: StaffMember) => {
    const updated = [...staff, member];
    saveStaff(updated);
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    const updated = staff.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    saveStaff(updated);
  };

  const deleteStaffMember = (id: string) => {
    const updated = staff.filter(s => s.id !== id);
    saveStaff(updated);
  };

  /**
   * Update a staff member's role. This will persist the change to AsyncStorage
   * so it remains across sessions and CSV imports (unless overwritten explicitly).
   */
  const updateStaffRole = (id: string, role: string) => {
    updateStaffMember(id, { role });
  };

  /**
   * Update a staff member's certifications array. Provide the full array of
   * certifications to set. This persists the change.
   */
  const updateStaffCertifications = (id: string, certifications: string[]) => {
    updateStaffMember(id, { certifications });
  };

  return {
    staff,
    isLoading,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    updateStaffRole,
    updateStaffCertifications,
  };
});