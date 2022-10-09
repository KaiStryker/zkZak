import { BigNumber, utils, Signer } from 'ethers';
import { apolloClient } from '../src/apollo-client';
import { login } from '../src/authentication/login';
import { signedTypeData, splitSignature } from './ethers.service';
import { CreateMirrorRequest, CreateMirrorTypedDataDocument } from '../src/graphql/generated';
import { pollUntilIndexed } from '../src/indexer/has-transaction-been-indexed';
import { lensHub } from '../src/lens-hub';

export const createMirrorTypedData = async (request: CreateMirrorRequest) => {
  const result = await apolloClient.mutate({
    mutation: CreateMirrorTypedDataDocument,
    variables: {
      request,
    },
  });

  return result.data!.createMirrorTypedData;
};

export const signCreateMirrorTypedData = async (request: CreateMirrorRequest, signer: Signer) => {
  const result = await createMirrorTypedData(request);
  console.log('create mirror: createMirrorTypedData', result);

  const typedData = result.typedData;
  console.log('create mirror: typedData', typedData);

  const signature = await signedTypeData(typedData.domain, typedData.types, typedData.value, signer);
  console.log('create mirror: signature', signature);

  return { result, signature };
};

export const createMirror = async (profileId: string, pubId: string, signer: Signer) => {

  const address = signer.getAddress();
  console.log('create mirror: address', address);

  await login(address);

  // hard coded to make the code example clear
  const createMirrorRequest = {
    profileId,
    // remember it has to be indexed and follow metadata standards to be traceable!
    publicationId: pubId,
    referenceModule: {
      followerOnlyReferenceModule: true,
    },
  };

  const signedResult = await signCreateMirrorTypedData(createMirrorRequest, signer);
  console.log('create mirror: signedResult', signedResult);

  const typedData = signedResult.result.typedData;

  const { v, r, s } = splitSignature(signedResult.signature);

  const tx = await lensHub(signer).mirrorWithSig({
    profileId: typedData.value.profileId,
    profileIdPointed: typedData.value.profileIdPointed,
    pubIdPointed: typedData.value.pubIdPointed,
    referenceModuleData: typedData.value.referenceModuleData,
    referenceModule: typedData.value.referenceModule,
    referenceModuleInitData: typedData.value.referenceModuleInitData,
    sig: {
      v,
      r,
      s,
      deadline: typedData.value.deadline,
    },
  });
  console.log('create mirror: tx hash', tx.hash);

  console.log('create mirror: poll until indexed');
  const indexedResult = await pollUntilIndexed({ txHash: tx.hash });

  console.log('create mirror: profile has been indexed');

  const logs = indexedResult.txReceipt!.logs;

  console.log('create mirror: logs', logs);

  const topicId = utils.id(
    'MirrorCreated(uint256,uint256,uint256,uint256,bytes,address,bytes,uint256)'
  );
  console.log('topicid we care about', topicId);

  const profileCreatedLog = logs.find((l: any) => l.topics[0] === topicId);
  console.log('create mirror: created log', profileCreatedLog);

  let profileCreatedEventLog = profileCreatedLog!.topics;
  console.log('create mirror: created event logs', profileCreatedEventLog);

  const publicationId = utils.defaultAbiCoder.decode(['uint256'], profileCreatedEventLog[2])[0];

  console.log(
    'create mirror: contract publication id',
    BigNumber.from(publicationId).toHexString()
  );
  console.log(
    'create mirror: internal publication id',
    profileId + '-' + BigNumber.from(publicationId).toHexString()
  );
};

// (async () => {
//   if (argsBespokeInit()) {
//     await createMirror();
//   }
// })();
