import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';

export function useAndroidDevice() {
  return Boolean(useRouteLoaderData<RootLoader>('root')?.isAndroid);
}
