ALTER TABLE "AdminNotification" ADD COLUMN "target" JSONB;
CREATE OR REPLACE FUNCTION bloodnet_admin_event() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE n jsonb:=to_jsonb(NEW); o jsonb:='{}'; fields text[]:=string_to_array(TG_ARGV[3],','); watched text; changed boolean:=false; region text; town text; kind text:=TG_ARGV[0]; event_id text; key text; target jsonb; batch text;
BEGIN
 IF TG_OP='DELETE' THEN n:=to_jsonb(OLD);o:=n; END IF;
 IF TG_OP='UPDATE' THEN o:=to_jsonb(OLD); FOREACH watched IN ARRAY fields LOOP IF (n->watched) IS DISTINCT FROM (o->watched) THEN changed:=true; END IF; END LOOP; IF NOT changed THEN RETURN NEW; END IF; END IF;
 IF TG_TABLE_NAME IN ('HomepageContent','PublicPageContent','ServiceAvailability') AND TG_OP<>'DELETE' AND NULLIF(n->'live','null'::jsonb) IS NOT DISTINCT FROM NULLIF(o->'live','null'::jsonb) THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='RegionalPageContent' AND NOT COALESCE((n->>'published')::boolean,false) AND NOT COALESCE((o->>'published')::boolean,false) THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='Blog' AND TG_OP='UPDATE' AND COALESCE(n->>'status','')<>'PUBLISHED' AND (n->>'status') IS NOT DISTINCT FROM (o->>'status') THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='AuthRiskEvent' AND COALESCE(n->>'event_type','') NOT IN ('ADMIN_USER_RESTRICTED','USER_RESTRICTED','RESTRICTED_IDENTITY','ADMIN_LOGIN_EMAIL_CHANGED') THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='Prescription' AND TG_OP='UPDATE' THEN
 IF n->>'email_status'='RETRY' THEN kind:='prescription.email.retry';
 ELSIF n->>'email_status'='SENT' AND EXISTS(SELECT 1 FROM public."AdminNotification" WHERE dedupe_key='prescription:'||(n->>'id')||':prescription.email.retry') THEN kind:='prescription.email.recovered';
 ELSE RETURN NEW; END IF;
 END IF;
 IF TG_TABLE_NAME='HomepageSlider' AND COALESCE(n->>'status','')<>'ACTIVE' AND COALESCE(o->>'status','')<>'ACTIVE' THEN RETURN NEW; END IF;
 region:=COALESCE(NULLIF(n->>'location_country',''),NULLIF(n->>'country',''));town:=COALESCE(NULLIF(n->>'location_city',''),NULLIF(n->>'city',''));
 IF TG_TABLE_NAME='Blog' AND n->>'author_type'='USER' THEN SELECT location_country,location_city INTO region,town FROM public."User" WHERE id=n->>'author_id'; END IF;
 IF region IS NULL AND n->>'user_id' IS NOT NULL THEN SELECT location_country,location_city INTO region,town FROM public."User" WHERE id=n->>'user_id'; END IF;
 IF kind NOT LIKE 'prescription.email.%' THEN kind:=kind||CASE WHEN TG_OP='INSERT' THEN '.created' WHEN TG_OP='DELETE' THEN '.removed' ELSE '.updated' END; END IF;
 target:=jsonb_strip_nulls(jsonb_build_object('kind',TG_TABLE_NAME,'id',COALESCE(n->>'id',n->>'key'),'country',region,'city',town,'fields',(SELECT COALESCE(jsonb_agg(field),'[]'::jsonb) FROM unnest(fields) field WHERE TG_OP<>'UPDATE' OR (n->field) IS DISTINCT FROM (o->field))));
 batch:=NULLIF(current_setting('bloodnet.notification_batch',true),'');
 key:='db:'||COALESCE(NULLIF(current_setting('bloodnet.notification_batch',true),''),transaction_timestamp()::text||':'||txid_current())||':'||TG_TABLE_NAME||':'||kind||':'||COALESCE(region,'global');
 IF batch IS NULL THEN key:=key||':'||COALESCE(n->>'id',n->>'key'); ELSE target:=NULL; END IF;
 IF kind LIKE 'prescription.email.%' THEN key:='prescription:'||(n->>'id')||':'||kind; IF EXISTS(SELECT 1 FROM public."AdminNotification" WHERE dedupe_key=key) THEN RETURN NEW; END IF; END IF;
 INSERT INTO public."AdminNotification"(id,type,family,title,detail,country,city,href,dedupe_key,target) VALUES(gen_random_uuid()::text,kind,TG_ARGV[1],TG_ARGV[2],CASE WHEN TG_OP='INSERT' THEN '1 record added. Open the workspace to review.' WHEN TG_OP='DELETE' THEN '1 record removed. The original destination may no longer exist.' ELSE '1 record changed. Open the workspace to review.' END,region,town,'/private/console-0be5626d4305f192e37e/workspace'||TG_ARGV[4],key,target) ON CONFLICT(dedupe_key) DO UPDATE SET quantity=CASE WHEN EXCLUDED.target IS NOT NULL THEN 1 ELSE "AdminNotification".quantity+1 END,detail=CASE WHEN EXCLUDED.target IS NOT NULL THEN 'Record changed. Open the workspace to review.' ELSE ("AdminNotification".quantity+1)::text||' records changed in one operation. Open the workspace to review.' END,city=CASE WHEN EXCLUDED.target IS NOT NULL THEN EXCLUDED.city ELSE NULL END,target=EXCLUDED.target;
 RETURN NEW;
END $$;

-- Backfill only references explicitly retained in deduplication keys.
UPDATE "AdminNotification" SET target=jsonb_build_object('kind',split_part(dedupe_key,':',2),'id',split_part(dedupe_key,':',3)) WHERE reminder AND dedupe_key ~ '^initial:(Report|VerificationDocument|OrganRequest|MedicalAidRequest|Blog):[0-9a-f-]{36}$';
UPDATE "AdminNotification" SET target=jsonb_build_object('kind','Prescription','id',split_part(dedupe_key,':',2)) WHERE dedupe_key ~ '^prescription:[0-9a-f-]{36}:prescription.email.(retry|recovered)$';
