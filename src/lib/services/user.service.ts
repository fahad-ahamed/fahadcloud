import { db } from '@/lib/db';
import { userRepository } from '@/lib/repositories';
import bcrypt from 'bcryptjs';

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findByIdWithDetails(userId);
    if (!user) return null;
    return { ...user, domainCount: user._count.domains, orderCount: user._count.orders };
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; company?: string; address?: string; city?: string; country?: string; currentPassword?: string; newPassword?: string }) {
    // If changing password
    if (data.currentPassword && data.newPassword) {
      const user = await userRepository.findById(userId);
      if (!user) return { error: 'User not found', status: 404 };
      const valid = await bcrypt.compare(data.currentPassword, user.password);
      if (!valid) return { error: 'Current password is incorrect', status: 400 };
      if (data.newPassword.length < 6) return { error: 'Password must be at least 6 characters', status: 400 };
      const hashedPassword = await bcrypt.hash(data.newPassword, 12);
      await userRepository.updatePassword(userId, hashedPassword);
      return { message: 'Password updated successfully' };
    }

    // Regular profile update
    const { currentPassword, newPassword, ...profileData } = data;
    const updated = await userRepository.updateProfile(userId, profileData);
    return { message: 'Profile updated successfully', user: updated };
  }

  async deleteAccount(userId: string) {
    await userRepository.deleteWithCascade(userId);
    return { message: 'Account deleted successfully' };
  }
}

export const userService = new UserService();
