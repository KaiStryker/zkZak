import { BigNumber, utils, Signer } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { apolloClient } from '../src/apollo-client';
import { login } from '../src/authentication/login';
import { signedTypeData, splitSignature } from './ethers.service';
import { CreatePostTypedDataDocument, CreatePublicPostRequest } from '../src/graphql/generated';
import { pollUntilIndexed } from '../src/indexer/has-transaction-been-indexed';
import { Metadata, PublicationMainFocus } from '../src/interfaces/publication';
import { uploadIpfs } from '../src/ipfs';
import { lensHub } from '../src/lens-hub';

export const createPostTypedData = async (request: CreatePublicPostRequest) => {
  const result = await apolloClient.mutate({
    mutation: CreatePostTypedDataDocument,
    variables: {
      request,
    },
  });

  return result.data!.createPostTypedData;
};

export const signCreatePostTypedData = async (request: CreatePublicPostRequest, signer: Signer) => {
  const result = await createPostTypedData(request);
  console.log('create post: createPostTypedData', result);

  const typedData = result.typedData;
  console.log('create post: typedData', typedData);

  const signature = await signedTypeData(typedData.domain, typedData.types, typedData.value, signer);
  console.log('create post: signature', signature);

  return { result, signature };
};

export const createPost = async (profileId: string, signer: Signer) => {
  const address = signer.getAddress();
  console.log('create post: address', address);

  await login(address);

  const ipfsResult = await uploadIpfs<Metadata>({
    version: '2.0.0',
    mainContentFocus: PublicationMainFocus.TEXT_ONLY,
    metadata_id: uuidv4(),
    description: 'This is a dummy post',
    locale: 'en-US',
    content: 'Content',
    external_url: null,
    image: null,
    imageMimeType: null,
    name: 'Name',
    attributes: [],
    tags: ['using_zik_zak_app'],
    appId: 'zik_zak',
  });
  console.log('create post: ipfs result', ipfsResult);

  // hard coded to make the code example clear
  const createPostRequest = {
    profileId,
    contentURI: 'ipfs://' + ipfsResult.path,
    collectModule: {
      freeCollectModule: { followerOnly: true },
    },
    referenceModule: {
      followerOnlyReferenceModule: false,
    },
  };

  const signedResult = await signCreatePostTypedData(createPostRequest, signer);
  console.log('create post: signedResult', signedResult);

  const typedData = signedResult.result.typedData;

  const { v, r, s } = splitSignature(signedResult.signature);

  const tx = await lensHub(signer).postWithSig({
    profileId: typedData.value.profileId,
    contentURI: typedData.value.contentURI,
    collectModule: typedData.value.collectModule,
    collectModuleInitData: typedData.value.collectModuleInitData,
    referenceModule: typedData.value.referenceModule,
    referenceModuleInitData: typedData.value.referenceModuleInitData,
    sig: {
      v,
      r,
      s,
      deadline: typedData.value.deadline,
    },
  });
  console.log('create post: tx hash', tx.hash);

  console.log('create post: poll until indexed');
  const indexedResult = await pollUntilIndexed({ txHash: tx.hash });

  console.log('create post: profile has been indexed');

  const logs = indexedResult.txReceipt!.logs;

  console.log('create post: logs', logs);

  const topicId = utils.id(
    'PostCreated(uint256,uint256,string,address,bytes,address,bytes,uint256)'
  );
  console.log('topicid we care about', topicId);

  const profileCreatedLog = logs.find((l: any) => l.topics[0] === topicId);
  console.log('create post: created log', profileCreatedLog);

  let profileCreatedEventLog = profileCreatedLog!.topics;
  console.log('create post: created event logs', profileCreatedEventLog);

  const publicationId = utils.defaultAbiCoder.decode(['uint256'], profileCreatedEventLog[2])[0];

  console.log('create post: contract publication id', BigNumber.from(publicationId).toHexString());
  console.log(
    'create post: internal publication id',
    profileId + '-' + BigNumber.from(publicationId).toHexString()
  );
};

// (async () => {
//   if (argsBespokeInit()) {
//     await createPost();
//   }
// })();
