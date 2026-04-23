import { AuthController } from '@/src/backend/controllers/AuthController';

export async function POST() {
  return AuthController.logout();
}
