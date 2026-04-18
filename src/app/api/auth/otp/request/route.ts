import { AuthController } from '@/src/backend/controllers/AuthController';

export async function POST(req: Request) {
  return await AuthController.requestOtp(req);
}
