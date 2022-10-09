import { apolloClient } from '../src/apollo-client';
import { login } from '../src/authentication/login';
import { Signer } from 'ethers';
import { NotificationRequest, NotificationsDocument } from '../src/graphql/generated';

const getNotifications = async (request: NotificationRequest) => {
  const result = await apolloClient.mutate({
    mutation: NotificationsDocument,
    variables: {
      request,
    },
  });

  return result.data!.notifications;
};

export const notifications = async (profileId: string, signer: Signer) => {
  const address = signer.getAddress();
  console.log('notifications: address', address);

  await login(address);

  const result = await getNotifications({ profileId });

  console.log('notifications: result', result);

  return result;
};

// (async () => {
//   await notifications();
// })();
