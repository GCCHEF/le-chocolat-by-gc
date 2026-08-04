import {lazy, Suspense} from 'react';

const ShaderSection = lazy(() => import('./ShaderSection'));

export default function ShaderEntry() {
  return (
    <section className="shader-entry" aria-label="Black liquid glass study">
      <div className="shader-entry-gradient" aria-hidden="true" />
      <div className="shader-live">
        <Suspense
          fallback={<div className="shader-section" aria-hidden="true" />}
        >
          <ShaderSection />
        </Suspense>
      </div>
    </section>
  );
}
