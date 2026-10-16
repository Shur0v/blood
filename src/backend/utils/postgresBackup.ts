// pg_dump needs separate libpq variables: a URI in PGDATABASE is treated as
// a database name and does not reliably supply its host/user/password.
export function postgresBackupEnvironment(value:string, inherited:NodeJS.ProcessEnv=process.env):NodeJS.ProcessEnv {
  const url=new URL(value);
  if(!['postgres:','postgresql:'].includes(url.protocol))throw new Error('Backup requires a PostgreSQL connection URL.');
  const decode=(value:string)=>decodeURIComponent(value);
  const user=url.searchParams.get('user')||decode(url.username)||inherited.PGUSER;
  const database=url.searchParams.get('dbname')||decode(url.pathname.slice(1))||inherited.PGDATABASE||user;
  const environment:NodeJS.ProcessEnv={...inherited,
    PGHOST:url.searchParams.get('host')||decode(url.hostname).replace(/^\[|\]$/g,'')||inherited.PGHOST||'localhost',
    PGPORT:url.searchParams.get('port')||url.port||inherited.PGPORT||'5432',
    PGDATABASE:database,PGUSER:user,
    PGPASSWORD:url.searchParams.get('password')??(url.password?decode(url.password):inherited.PGPASSWORD),
    PGCONNECT_TIMEOUT:'15',
  };
  // Preserve libpq connection options without passing Prisma-only options.
  const options:Record<string,string>={sslmode:'PGSSLMODE',sslrootcert:'PGSSLROOTCERT',sslcert:'PGSSLCERT',sslkey:'PGSSLKEY',sslcrl:'PGSSLCRL',sslcrldir:'PGSSLCRLDIR',application_name:'PGAPPNAME',connect_timeout:'PGCONNECT_TIMEOUT',options:'PGOPTIONS',channel_binding:'PGCHANNELBINDING',target_session_attrs:'PGTARGETSESSIONATTRS'};
  for(const [parameter,variable] of Object.entries(options))if(url.searchParams.has(parameter))environment[variable]=url.searchParams.get(parameter)!;
  return environment;
}

export function safeBackupError(message:string,value:string):string {
  const url=new URL(value);
  for(const secret of [value,url.username,url.password,url.hostname,url.pathname.slice(1),url.searchParams.get('user'),url.searchParams.get('password')]) {
    if(!secret)continue;
    message=message.replaceAll(secret,'[redacted]');
    try {message=message.replaceAll(decodeURIComponent(secret),'[redacted]');} catch { /* Already-decoded query values may contain literal percent signs. */ }
  }
  return message.replace(/[\x00-\x08\x0b-\x1f]/g,'').slice(0,2000);
}
