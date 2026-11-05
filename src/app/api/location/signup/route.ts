import { locationAutocomplete } from '@/src/backend/services/locationAutocomplete';
import { neighborhoodsEnabled } from '@/src/backend/services/neighborhoods';

export const GET = (req: Request) => locationAutocomplete(req, neighborhoodsEnabled());
