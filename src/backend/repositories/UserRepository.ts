import { findLoginUser } from '../services/loginEmails';
import { getPrisma } from '../config/db';
import { Prisma } from '@prisma/client';
import { reserveGeneratedProfileCode } from '../services/profileIdentifiers';

/**
 * UserRepository
 * Handles all direct database queries for User models.
 * Isolates Prisma ORM logic from business services.
 */
export class UserRepository {
  async findByEmail(email: string) {
    return findLoginUser(email);
  }

  async findByMobile(mobile: string) {
    return await getPrisma().user.findUnique({
      where: { mobile },
    });
  }

  async findById(id: string) {
    return await getPrisma().user.findUnique({
      where: { id },
    });
  }

  async createUser(data: Omit<Prisma.UserCreateInput, 'profile_code'>) {
    return await getPrisma().$transaction(async (tx) => {
      const code = await reserveGeneratedProfileCode(tx);
      const user = await tx.user.create({ data: { ...data, profile_code: code } });
      await tx.profileIdentifier.update({ where: { code }, data: { user_id: user.id } });
      return user;
    });
  }

  async updateVerificationStatus(id: string, status: string) {
    return await getPrisma().user.update({
      where: { id },
      data: { verification_status: status },
    });
  }

  /**
   * Complex query: Fetch donors constrained by city
   * Future extension: Replace precise string matching with PostGIS / Haversine distance calculations
   */
  async findActiveDonorsByCity(city: string, country?: string) {
    return await getPrisma().user.findMany({
      where: {
        is_active_donor: true,
        location_city: {
          equals: city,
          mode: 'insensitive',
        },
        ...(country && {
          location_country: {
            equals: country,
            mode: 'insensitive',
          },
        }),
      },
      orderBy: {
        verification_status: 'desc', // Prioritize verified users
      },
    });
  }
}
