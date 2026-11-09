const test = require('node:test');
const assert = require('node:assert/strict');
const {Readable} = require('node:stream');
const {subscribe,confirm} = require('../lib/rootedLetter');
const {makeHandler} = require('../api/rooted-letter');
const env={ROOTED_RESEND_API_KEY:'test',ROOTED_SEGMENT_ID:'rooted-segment',ROOTED_SITE_URL:'https://example.com'};
const token='a'.repeat(64);
function fixture(row={email:'reader@example.com',first_name:'Reader',expires_at:new Date(Date.now()+10000)}) {
  const queries=[],requests=[];
  const client={query:async(sql,args)=>{queries.push({sql,args});return {rows:sql.startsWith('SELECT')?[row]:[{count:1}]};},release(){}};
  return {queries,requests,db:{...client,connect:async()=>client},fetch:async(url,options)=>{requests.push({url,...options});return {ok:true,status:200,json:async()=> url.includes('/contacts/') && options.method==='GET' ? {id:'existing',unsubscribed:false}:{id:'created'}};}};
}
test('signup sends confirmation only, stores hashed token and does not create contact',async()=>{
  const f=fixture();await subscribe({email:'Reader@Example.com',firstName:'Reader',consent:true},'test',env,f);
  assert.equal(f.requests.length,1);assert.match(f.requests[0].url,/\/emails$/);
  const email=JSON.parse(f.requests[0].body);assert.deepEqual(email.to,['reader@example.com']);
  assert.match(email.text,/rooted-letter-confirm#[a-f0-9]{64}/);
  const saved=f.queries.find(q=>q.sql.startsWith('INSERT INTO rooted_letter.signups'));
  assert.ok(!email.text.includes(saved.args[0]));
});
test('missing consent, invalid fields and honeypot never send',async()=>{
  for(const fields of [{email:'invalid',firstName:'Reader',consent:true},{email:'r@example.com',firstName:'Reader',consent:false}]) {
    const f=fixture();await assert.rejects(subscribe(fields,'ip',env,f),{status:400});assert.equal(f.requests.length,0);
  }
  const f=fixture();await subscribe({website:'bot'},'ip',env,f);assert.equal(f.requests.length,0);
});
test('durable rate limit prevents confirmation email abuse',async()=>{
  const f=fixture();f.db.query=async()=>({rows:[{count:11}]});
  await assert.rejects(subscribe({email:'r@example.com',firstName:'Reader',consent:true},'ip',env,f),{status:429});assert.equal(f.requests.length,0);
});
test('confirmation adds existing subscribed reader to the correct segment',async()=>{
  const f=fixture();await confirm(token,env,f);
  assert.match(f.requests[1].url,/contacts\/reader%40example.com\/segments\/rooted-segment$/);
  assert.ok(f.queries.some(q=>q.sql.startsWith('UPDATE rooted_letter.signups')));
});
test('new confirmed contact is added to Rooted Letter',async()=>{
  const f=fixture();f.fetch=async(url,options)=>{f.requests.push({url,...options});return options.method==='GET'?{ok:false,status:404}:{ok:true,status:200,json:async()=>({id:'new'})};};
  await confirm(token,env,f);const body=JSON.parse(f.requests[1].body);assert.deepEqual(body.segments,[{id:'rooted-segment'}]);assert.equal(body.unsubscribed,false);
});
test('expired and consumed links cannot add contacts again',async()=>{
  let f=fixture({expires_at:new Date(0)});await assert.rejects(confirm(token,env,f),{status:400});assert.equal(f.requests.length,0);
  f=fixture({confirmed_at:new Date()});await confirm(token,env,f);assert.equal(f.requests.length,0);
});
test('global unsubscribes are preserved; provider failure rolls back for retry',async()=>{
  const f=fixture();f.fetch=async()=>({ok:true,status:200,json:async()=>({unsubscribed:true})});
  await assert.rejects(confirm(token,env,f),{status:409});assert.equal(f.queries.at(-1).sql,'ROLLBACK');
  f.fetch=async()=>({ok:false,status:500});await assert.rejects(confirm(token,env,f));assert.equal(f.queries.at(-1).sql,'ROLLBACK');
});
test('endpoint enforces POST and origin, returns safe provider failures',async()=>{
  async function run(method,origin,body,fail=false){const req=Readable.from([JSON.stringify(body)]);req.method=method;req.headers={origin};const res={setHeader(){},end(value){this.body=value}};await makeHandler({env,subscribe:async()=>{if(fail)throw Error('secret');}})(req,res);return res;}
  assert.equal((await run('GET','https://example.com',{})).statusCode,405);
  assert.equal((await run('POST','https://other.com',{})).statusCode,403);
  const failure=await run('POST','https://example.com',{},true);assert.equal(failure.statusCode,503);assert.ok(!failure.body.includes('secret'));
  assert.equal((await run('POST','https://example.com',{})).statusCode,200);
});
