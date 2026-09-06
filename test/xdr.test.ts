import test from 'node:test';
import assert from 'node:assert/strict';
import { Account, Asset, Keypair, Memo, MuxedAccount, SorobanDataBuilder, Networks, Operation, TransactionBuilder, xdr } from '@stellar/stellar-sdk';
import { importPaymentXdr } from '../src/xdr.js';
import { fixtureSource as source, fixtureDestination as destination, fixtureIssuer as issuer } from '../examples/scenarios.js';

function transaction(options: {asset?: Asset; memo?: Memo; amount?: string; opSource?: string; destination?: string; count?: number; extended?: boolean} = {}) {
  const builder = new TransactionBuilder(new Account(source, '9007199254740993'), {fee:'123', networkPassphrase:Networks.TESTNET});
  for(let i=0;i<(options.count ?? 1);i++) builder.addOperation(Operation.payment({destination:options.destination ?? destination, asset:options.asset ?? Asset.native(), amount:options.amount ?? '1.0000001', ...(options.opSource ? {source:options.opSource} : {})}));
  if(options.memo) builder.addMemo(options.memo);
  if(options.extended) builder.setLedgerbounds(1, 100);
  return builder.setTimebounds(0, 1900000000).build();
}

test('imports exact payment, fee in XLM, selected network, and unassessed envelope context',()=>{
  const result=importPaymentXdr(transaction().toXdr(), Networks.PUBLIC);
  assert.equal(result.ok,true);
  if(!result.ok) return;
  assert.equal(result.payment.amount,'1.0000001');
  assert.equal(result.payment.feeBudget,'0.0000123');
  assert.equal(result.payment.networkPassphrase,Networks.PUBLIC);
  assert.equal(result.payment.source,source);
  assert.equal(result.context.sequence,'9007199254740994');
  assert.deepEqual(result.context.timeBounds,{minTime:'0',maxTime:'1900000000'});
  assert.match(result.context.limitations.join(' '),/network/i);
});
for(const memo of [Memo.text('नमस्ते'), Memo.text(''), Memo.id('18446744073709551615'), Memo.hash('ab'.repeat(32)), Memo.return('cd'.repeat(32))]) {
  test(`preserves ${memo.type} memo ${String(memo.value).slice(0,10)}`,()=>{
    const result=importPaymentXdr(transaction({memo,asset:new Asset('USD',issuer)}).toXdr(),Networks.TESTNET);
    assert.equal(result.ok,true);
    if(!result.ok) return;
    assert.deepEqual(result.payment.asset,{type:'credit',code:'USD',issuer});
    const expected = memo.value instanceof Uint8Array ? Buffer.from(memo.value).toString('hex') : memo.value;
    assert.deepEqual(result.payment.memo,{type:memo.type,value:expected});
  });
}
test('rejects non-UTF8 text memos instead of changing their bytes',()=>{
  const result=importPaymentXdr(transaction({memo:Memo.text(new Uint8Array([255]))}).toXdr(),Networks.TESTNET);
  assert.equal(result.ok,false);
});
for(const [name,tx] of [
  ['multiple operations',transaction({count:2})],
  ['separate operation source',transaction({opSource:issuer})],
  ['self payment',transaction({destination:source})],
  ['issuer as recipient',transaction({asset:new Asset('USD',destination)})],
  ['extended preconditions',transaction({extended:true})],
] as const) test(`rejects ${name}`,()=>assert.equal(importPaymentXdr(tx.toXdr(),Networks.TESTNET).ok,false));
test('accepts an explicit operation source matching transaction source',()=>{
  assert.equal(importPaymentXdr(transaction({opSource:source}).toXdr(),Networks.TESTNET).ok,true);
});
test('rejects signed envelopes',()=>{
  const tx=transaction(); tx.sign(Keypair.random());
  const result=importPaymentXdr(tx.toXdr(),Networks.TESTNET);
  assert.equal(result.ok,false); if(!result.ok) assert.match(result.message,/unsigned/i);
});
test('rejects fee bumps',()=>{
  const tx=TransactionBuilder.buildFeeBumpTransaction(issuer,'200',transaction(),Networks.TESTNET);
  assert.equal(importPaymentXdr(tx.toXdr(),Networks.TESTNET).ok,false);
});
test('rejects other operations',()=>{
  const tx=new TransactionBuilder(new Account(source,'1'),{fee:'100',networkPassphrase:Networks.TESTNET}).addOperation(Operation.changeTrust({asset:new Asset('USD',issuer)})).setTimeout(0).build();
  assert.equal(importPaymentXdr(tx.toXdr(),Networks.TESTNET).ok,false);
});
test('rejects malformed, oversized, noncanonical and trailing input; allows wrapped base64',()=>{
  const encoded=transaction().toXdr();
  for(const input of ['', 'not xdr', 'a'.repeat(32769), encoded+'AAAA', encoded+'=']) {
    assert.equal(importPaymentXdr(input,Networks.TESTNET).ok,false);
  }
  assert.equal(importPaymentXdr(' \n'+encoded.match(/.{1,40}/g)!.join('\n')+'\n',Networks.TESTNET).ok,true);
  assert.equal(importPaymentXdr(encoded,'').ok,false);
});

test('rejects muxed recipients without stripping their ID',()=>{
  const muxed=new MuxedAccount(new Account(destination,'1'),'123');
  assert.equal(importPaymentXdr(transaction({destination:muxed.accountId()}).toXdr(),Networks.TESTNET).ok,false);
});
test('rejects muxed transaction sources',()=>{
  const tx=new TransactionBuilder(new MuxedAccount(new Account(source,'1'),'123'),{fee:'100',networkPassphrase:Networks.TESTNET}).addOperation(Operation.payment({destination,asset:Asset.native(),amount:'1'})).setTimeout(0).build();
  assert.equal(importPaymentXdr(tx.toXdr(),Networks.TESTNET).ok,false);
});
test('rejects transaction extensions even with a classic payment',()=>{
  const tx=new TransactionBuilder(new Account(source,'1'),{fee:'100',networkPassphrase:Networks.TESTNET}).addOperation(Operation.payment({destination,asset:Asset.native(),amount:'1'})).setSorobanData(new SorobanDataBuilder().build()).setTimeout(0).build();
  const result=importPaymentXdr(tx.toXdr(),Networks.TESTNET);
  assert.equal(result.ok,false); if(!result.ok) assert.match(result.message,/extensions/i);
});
test('rejects zero and negative decoded amounts and zero fee',()=>{
  for(const amount of [0n,-1n]) {
    const envelope=transaction().toEnvelope();
    if(envelope.type!=='envelopeTypeTx') throw new Error('fixture envelope');
    const op=envelope.value.tx.operations[0]!;
    if(op.body.type!=='payment') throw new Error('fixture operation');
    const changed=xdr.TransactionEnvelope.envelopeTypeTx(new xdr.TransactionV1Envelope({
      signatures:[], tx:new xdr.Transaction({...envelope.value.tx, operations:[new xdr.Operation({...op, body:xdr.OperationBody.payment(new xdr.PaymentOp({...op.body.paymentOp,amount}))})]})
    }));
    assert.equal(importPaymentXdr(changed.toXdr('base64'),Networks.TESTNET).ok,false);
  }
  const envelope=transaction().toEnvelope();
  if(envelope.type!=='envelopeTypeTx') throw new Error('fixture envelope');
  const changed=xdr.TransactionEnvelope.envelopeTypeTx(new xdr.TransactionV1Envelope({signatures:[],tx:new xdr.Transaction({...envelope.value.tx,fee:0})}));
  assert.equal(importPaymentXdr(changed.toXdr('base64'),Networks.TESTNET).ok,false);
});
test('preserves a leading UTF-8 BOM in text memos',()=>{
  const result=importPaymentXdr(transaction({memo:Memo.text('\uFEFFhello')}).toXdr(),Networks.TESTNET);
  assert.equal(result.ok,true);
  if(result.ok) assert.equal(result.payment.memo?.value,'\uFEFFhello');
});
test('rejects legacy V0 envelopes',()=>{
  const current=transaction().toEnvelope();
  if(current.type!=='envelopeTypeTx') throw new Error('fixture envelope');
  const raw=current.value.tx;
  const legacy=xdr.TransactionEnvelope.envelopeTypeTxV0(new xdr.TransactionV0Envelope({signatures:[],tx:new xdr.TransactionV0({
    sourceAccountEd25519:Keypair.fromPublicKey(source).rawPublicKey(), fee:raw.fee,seqNum:raw.seqNum,
    timeBounds:raw.cond.type==='precondTime' ? raw.cond.timeBounds : null,
    memo:raw.memo,operations:raw.operations,ext:xdr.TransactionV0Ext.v0(),
  })}));
  const result=importPaymentXdr(legacy.toXdr('base64'),Networks.TESTNET);
  assert.equal(result.ok,false); if(!result.ok) assert.match(result.message,/V1/);
});
