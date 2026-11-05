import { locationAutocomplete } from '@/src/backend/services/locationAutocomplete';

export const GET = (req: Request) => locationAutocomplete(req, false);
