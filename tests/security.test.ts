import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../src/backend/utils/jwt';
import { getSessionFromRequest } from '../src/backend/utils/session';
import { isAllowedWriteRequest } from '../src/lib/requestSecurity';
import { sanitizeBlogHtml } from '../src/lib/blogContent';
import { SafeAssetUrl } from '../src/lib/safeAssetUrl';
import { securityJson } from '../src/backend/utils/security';

process.env.JWT_SECRET=randomBytes(32).toString('hex');

test('JWTs reject alternate algorithms, non-session claims and expired privileged sessions',()=>{
  assert.deepEqual(verifyToken(signToken({user_id:'patient',role:'USER'})),{user_id:'patient',role:'USER'});
  const secret=process.env.JWT_SECRET!;
  for(const token of [
    jwt.sign({city:'Dhaka'},secret,{expiresIn:'1h'}),
    jwt.sign({user_id:'admin',role:'ADMIN'},secret,{algorithm:'HS384',expiresIn:'1h'}),
    jwt.sign({user_id:'admin',role:'ADMIN',iat:Math.floor(Date.now()/1000)-9*3600},secret,{expiresIn:'365d'}),
    jwt.sign({user_id:'patient',role:'SUPERADMIN'},secret,{expiresIn:'1h'}),
  ])assert.equal(verifyToken(token),null);
  const payload=jwt.decode(signToken({user_id:'admin',role:'ADMIN'})) as jwt.JwtPayload;
  assert.equal(payload.exp!-payload.iat!,8*3600);
  assert.equal(getSessionFromRequest(new Request('https://example.invalid',{headers:{cookie:'bloodnet_session=%xx'}})),null);
});

test('cross-site writes fail while public-origin proxy writes and server integrations remain valid',()=>{
  const request=(headers:Record<string,string>,path='/api/users/me/health')=>new Request('http://localhost:3000'+path,{method:'POST',headers});
  assert.equal(isAllowedWriteRequest(request({origin:'https://evil.invalid'}),'https://bloodnet.live'),false);
  assert.equal(isAllowedWriteRequest(request({'sec-fetch-site':'cross-site'}),'https://bloodnet.live'),false);
  assert.equal(isAllowedWriteRequest(request({referer:'https://evil.invalid/a'}),'https://bloodnet.live'),false);
  assert.equal(isAllowedWriteRequest(request({origin:'https://bloodnet.live'}),'https://bloodnet.live'),true);
  assert.equal(isAllowedWriteRequest(request({authorization:'Bearer external'},'/api/integrations/prescriptions'),'https://bloodnet.live'),true);
  assert.equal(isAllowedWriteRequest(new Request('https://bloodnet.live/api/public/donors')),true);
});

test('HTML sanitizing preserves articles and tables while removing executable markup',()=>{
  const output=sanitizeBlogHtml('<h2>Results</h2><table><tr><td>Safe</td></tr></table><script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(2)"><a href="jav&#97;script:alert(3)">Unsafe</a><iframe src="https://evil.invalid"></iframe><span style="background-image:url(javascript:alert(4));color:#123456">Text</span>');
  assert.match(output,/<h2>Results<\/h2>/);
  assert.match(output,/bn-table-wrap/);
  assert.match(output,/color:#123456/);
  assert.doesNotMatch(output,/script|onerror|iframe|background-image|alert\(/i);
});

test('attachment URLs reject executable schemes and credentials',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,test','https://user:pass@example.invalid/a','/uploads/../secret'])assert.equal(SafeAssetUrl.safeParse(url).success,false);
  for(const url of ['https://example.invalid/report.webp','/uploads/medical_aid/test.webp'])assert.equal(SafeAssetUrl.safeParse(url).success,true);
});

test('JSON readers reject oversized bodies and malformed JSON',async()=>{
  await assert.rejects(securityJson(new Request('https://example.invalid',{method:'POST',body:'x'.repeat(100)}),20),{status:413});
  await assert.rejects(securityJson(new Request('https://example.invalid',{method:'POST',body:'{'})),{status:400});
  assert.deepEqual(await securityJson(new Request('https://example.invalid',{method:'POST',body:'{"ok":true}'})),{ok:true});
});
