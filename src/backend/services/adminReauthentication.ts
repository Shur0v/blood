import bcrypt from 'bcryptjs';
import {requireActiveAdmin} from '../utils/activeAdmin';
import {securityRateLimit} from '../utils/security';
import {getPrisma} from '../config/db';
import {MedicalError} from '../utils/medicalPrivacy';
export async function reauthenticateAdmin(req:Request,password:unknown){const session=await requireActiveAdmin(req);if(session.role!=='ADMIN')throw new MedicalError('Administrator access required.',403);await securityRateLimit('recovery-reauth',session.user_id,20,15*60_000);if(typeof password!=='string'||password.length>1024)throw new MedicalError('Enter your current administrator password.',400);const admin=await getPrisma().adminUser.findUnique({where:{id:session.user_id}});if(!admin||!admin.password.startsWith('$2')||!await bcrypt.compare(password,admin.password))throw new MedicalError('Administrator password could not be confirmed. Sign in again if required.',401);return session;}
