import { apolloClient } from '../src/apollo-client';
import { login } from '../src/authentication/login';
import { ProfileDocument, SingleProfileQueryRequest } from '../src/graphql/generated';
import { Signer } from 'ethers';

const getProfileRequest = async (request: SingleProfileQueryRequest) => {
  const result = await apolloClient.query({
    query: ProfileDocument,
    variables: {
      request,
    },
  });

  return result.data.profile;
};

export const profile = async (profileId: string, signer: Signer, request?: SingleProfileQueryRequest) => {
  const address = signer.getAddress()
  console.log('profiles: address', address);

  await login(address);

  if (!request) {
    request = { profileId: profileId };
  }

  const profile = await getProfileRequest(request);

  console.log('profile: result', profile);

  return profile;
};

// (async () => {
//   if (argsBespokeInit()) {
//     await profile();
//   }
// })();
