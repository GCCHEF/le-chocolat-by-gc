import ShaderSection from './ShaderSection';

export default function ShaderEntry() {
  return (
    <section className="shader-entry" aria-label="Black liquid glass study">
      <div className="shader-entry-gradient" aria-hidden="true" />
      <div className="shader-live">
        <ShaderSection />
      </div>
    </section>
  );
}
