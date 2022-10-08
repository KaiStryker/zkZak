import { apolloClient } from '../src/apollo-client';
import { login } from '../src/authentication/login';
import { signedTypeData, splitSignature } from './ethers.service';
import { CreateFollowTypedDataDocument, FollowRequest } from '../src/graphql/generated';
import { lensHub } from '../src/lens-hub';
import { Signer } from 'ethers';

export const createFollowTypedData = async (request: FollowRequest) => {
  const result = await apolloClient.mutate({
    mutation: CreateFollowTypedDataDocument,
    variables: {
      request,
    },
  });

  return result.data!.createFollowTypedData;
};

export const follow = async (profileId: string, signer: Signer ) => {
  const address = await signer.getAddress();
  console.log('follow: address', address);

  await login(address);

  const result = await createFollowTypedData({
    follow: [
      {
        profile: profileId,
      },
    ],
  });
  console.log('follow: result', result);

  const typedData = result.typedData;
  console.log('follow: typedData', typedData);

  const signature = await signedTypeData(typedData.domain, typedData.types, typedData.value, signer);
  console.log('follow: signature', signature);

  const { v, r, s } = splitSignature(signature);

  const tx = await lensHub(signer).followWithSig({
    follower: address,
    profileIds: typedData.value.profileIds,
    datas: typedData.value.datas,
    sig: {
      v,
      r,
      s,
      deadline: typedData.value.deadline,
    },
  });
  console.log('follow: tx hash', tx.hash);
  return tx.hash;
};

// (async () => {
//   if (argsBespokeInit()) {
//     await follow();
//   }
// })();
