import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

/**
 * UserRepository
 * Handles all direct database queries for User models.
 * Isolates Prisma ORM logic from business services.
 */
export class UserRepository {
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findByMobile(mobile: string) {
    return await prisma.user.findUnique({
      where: { mobile },
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return await prisma.user.create({
      data,
    });
  }

  async updateVerificationStatus(id: string, status: string) {
    return await prisma.user.update({
      where: { id },
      data: { verification_status: status },
    });
  }

  /**
   * Complex query: Fetch donors constrained by city
   * Future extension: Replace precise string matching with PostGIS / Haversine distance calculations
   */
  async findActiveDonorsByCity(city: string, country?: string) {
    return await prisma.user.findMany({
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
