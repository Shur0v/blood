import {readJob,verifyProgressToken} from './recoveryStore';
export function recoveryProgress(id:string,token:string|null){if(!token||!verifyProgressToken(token,id))return null;const job=readJob(id);return {id:job.id,kind:job.kind,status:job.status,stage:job.stage,...(job.error?{error:'The operation stopped. Review the protected recovery journal.'}:{})};}
