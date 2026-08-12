import {lazy, Suspense} from 'react';
import {useAndroidDevice} from '~/lib/use-android-device';

const ShaderSection = lazy(() => import('./ShaderSection'));

export default function ShaderEntry() {
  const isAndroid = useAndroidDevice();

  return (
    <section className="shader-entry" aria-label="Black liquid glass study">
      <div className="shader-entry-gradient" aria-hidden="true" />
      <div className="shader-live">
        {isAndroid ? (
          <div
            className="shader-section shader-section--android-static"
            aria-hidden="true"
          />
        ) : (
          <Suspense
            fallback={<div className="shader-section" aria-hidden="true" />}
          >
            <ShaderSection />
          </Suspense>
        )}
      </div>
    </section>
  );
}
