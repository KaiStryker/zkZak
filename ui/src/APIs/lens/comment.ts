import { BigNumber, utils, Signer } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { apolloClient } from './src/apollo-client';
import { login } from './src/authentication/login';
import { signedTypeData, splitSignature } from './ethers.service';
import { CreateCommentTypedDataDocument, CreatePublicCommentRequest } from './src/graphql/generated';
import { pollUntilIndexed } from './src/indexer/has-transaction-been-indexed';
import { Metadata, PublicationMainFocus } from './src/interfaces/publication';
import { uploadIpfs } from './src/ipfs';
import { lensHub } from './src/lens-hub';

export const createCommentTypedData = async (request: CreatePublicCommentRequest) => {
  const result = await apolloClient.mutate({
    mutation: CreateCommentTypedDataDocument,
    variables: {
      request,
    },
  });

  return result.data!.createCommentTypedData;
};

export const signCreateCommentTypedData = async (request: CreatePublicCommentRequest, signer: Signer) => {
  const result = await createCommentTypedData(request);
  console.log('create comment: createCommentTypedData', result);

  const typedData = result.typedData;
  console.log('create comment: typedData', typedData);

  const signature = await signedTypeData(typedData.domain, typedData.types, typedData.value, signer);
  console.log('create comment: signature', signature);

  return { result, signature };
};

export const createComment = async (profileId: string, pubId: string, signer: Signer) => {
  const address = signer.getAddress();
  console.log('create comment: address', address);

  await login(address);

  const ipfsResult = await uploadIpfs<Metadata>({
    version: '2.0.0',
    mainContentFocus: PublicationMainFocus.TEXT_ONLY,
    metadata_id: uuidv4(),
    description: 'This is a dummy comment',
    locale: 'en-US',
    content: 'Content',
    external_url: null,
    image: null,
    imageMimeType: null,
    name: 'Name',
    attributes: [],
    tags: ['using_api_examples'],
    appId: 'api_examples_github',
  });
  console.log('create comment: ipfs result', ipfsResult);

  // hard coded to make the code example clear
  const createCommentRequest = {
    profileId,
    // remember it has to be indexed and follow metadata standards to be traceable!
    publicationId: pubId,
    contentURI: 'ipfs://' + ipfsResult.path,
    collectModule: {
      revertCollectModule: false,
    },
    referenceModule: {
      followerOnlyReferenceModule: false,
    },
  };

  const signedResult = await signCreateCommentTypedData(createCommentRequest, signer);
  console.log('create comment: signedResult', signedResult);

  const typedData = signedResult.result.typedData;

  const { v, r, s } = splitSignature(signedResult.signature);

  const tx = await lensHub(signer).commentWithSig(
    {
      profileId: typedData.value.profileId,
      contentURI: typedData.value.contentURI,
      profileIdPointed: typedData.value.profileIdPointed,
      pubIdPointed: typedData.value.pubIdPointed,
      collectModule: typedData.value.collectModule,
      collectModuleInitData: typedData.value.collectModuleInitData,
      referenceModule: typedData.value.referenceModule,
      referenceModuleInitData: typedData.value.referenceModuleInitData,
      referenceModuleData: typedData.value.referenceModuleData,
      sig: {
        v,
        r,
        s,
        deadline: typedData.value.deadline,
      },
    },
    { gasLimit: 500000 }
  );
  console.log('create comment: tx hash', tx.hash);

  console.log('create comment: poll until indexed');
  const indexedResult = await pollUntilIndexed(tx.hash);

  console.log('create comment: profile has been indexed');

  const logs = indexedResult.txReceipt!.logs;

  console.log('create comment: logs', logs);

  const topicId = utils.id(
    'CommentCreated(uint256,uint256,string,uint256,uint256,bytes,address,bytes,address,bytes,uint256)'
  );
  console.log('topicid we care about', topicId);

  const profileCreatedLog = logs.find((l: any) => l.topics[0] === topicId);
  console.log('create comment: created log', profileCreatedLog);

  let profileCreatedEventLog = profileCreatedLog!.topics;
  console.log('create comment: created event logs', profileCreatedEventLog);

  const publicationId = utils.defaultAbiCoder.decode(['uint256'], profileCreatedEventLog[2])[0];

  console.log(
    'create comment: contract publication id',
    BigNumber.from(publicationId).toHexString()
  );
  console.log(
    'create comment: internal publication id',
    profileId + '-' + BigNumber.from(publicationId).toHexString()
  );
};

// (async () => {
//   if (argsBespokeInit()) {
//     await createComment();
//   }
// })();
