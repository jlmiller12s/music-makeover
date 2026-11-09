const Stripe = require('stripe');
const {workbookAttachments} = require('../lib/peacePromiseAttachments');
function makeHandler(deps = {}) {
  return async (req,res) => {
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Content-Type-Options','nosniff');
    const reply=(status,message)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message}));};
    if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(405,'Method not allowed');}
    try {
      let raw=''; for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>2048)return reply(413,'Request too large');}
      const body=JSON.parse(raw);
      if(typeof body.sessionId!=='string'||!/^cs_(test_|live_)?[a-zA-Z0-9]{10,250}$/.test(body.sessionId))return reply(400,'Open the confirmation link from your Stripe checkout to access your workbooks.');
      if(body.format && !['pdf','word'].includes(body.format))return reply(400,'Unknown workbook format');
      const env=deps.env||process.env;
      if(!env.STRIPE_SECRET_KEY||!env.PEACE_STRIPE_PAYMENT_LINK_ID||!env.PEACE_STRIPE_PRICE_ID)return reply(503,'Workbook access is being connected. Please keep your purchase confirmation.');
      const stripe=deps.stripe||new Stripe(env.STRIPE_SECRET_KEY);
      let session;
      try {session=await stripe.checkout.sessions.retrieve(body.sessionId,{expand:['line_items']});}
      catch(error){if(error.statusCode===404||error.type==='StripeInvalidRequestError')return reply(403,'Unable to verify this purchase.');throw error;}
      if(session.livemode!==(env.PEACE_STRIPE_LIVE==='true')||session.payment_link!==env.PEACE_STRIPE_PAYMENT_LINK_ID||session.mode!=='payment'||!session.line_items?.data.some(item=>item.price?.id===env.PEACE_STRIPE_PRICE_ID))return reply(403,'Unable to verify this purchase.');
      if(session.payment_status!=='paid')return reply(409,'Your payment is still processing. Please try again once it is confirmed.');
      if(!body.format)return reply(200,'Payment confirmed. Your workbooks are ready.');
      const files=await(deps.attachments||workbookAttachments)(env);
      const file=files[body.format==='pdf'?1:0];
      const data=Buffer.from(file.content,'base64');
      res.statusCode=200;res.setHeader('Content-Type',file.content_type);res.setHeader('Content-Disposition',`attachment; filename="${file.filename}"`);res.setHeader('Content-Length',data.length);res.end(data);
    } catch(error){return reply(error instanceof SyntaxError?400:503,error instanceof SyntaxError?'Invalid request':'We could not retrieve your workbook. Please try again shortly.');}
  };
}
module.exports=makeHandler();module.exports.makeHandler=makeHandler;module.exports.config={api:{bodyParser:false}};
