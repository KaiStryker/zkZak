import { TypedDataDomain } from '@ethersproject/abstract-signer';
import { ethers, utils, Signer } from 'ethers';
import { MUMBAI_RPC_URL } from '../src/config';
import { omit } from '../src/helpers';

export const ethersProvider = new ethers.providers.JsonRpcProvider(MUMBAI_RPC_URL);


export const signedTypeData = (
  domain: TypedDataDomain,
  types: Record<string, any>,
  value: Record<string, any>, 
  signer: Signer
) => {
  // remove the __typedname from the signature!
  // make sure exact version ethers 5.0.18 is being used
  return signer._signTypedData(
    omit(domain, '__typename'),
    omit(types, '__typename'),
    omit(value, '__typename')
  );
};

export const splitSignature = (signature: string) => {
  return utils.splitSignature(signature);
};

// export const sendTx = (
//   transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>
// ) => {
//   const signer = getSigner();
//   return signer.sendTransaction(transaction);
// };

// export const signText = (text: string) => {
//   return getSigner().signMessage(text);
// };
