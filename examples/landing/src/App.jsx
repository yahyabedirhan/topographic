import { Topography } from 'topographic-react';

const features = [
  { title: 'Ground truth', text: 'Drone and total-station surveys, checked on foot, accurate to two centimetres.' },
  { title: 'Living maps', text: 'Contour maps that update the day the land changes, not the year after.' },
  { title: 'Plain answers', text: 'One page per site: what is there, what it will cost, what could go wrong.' },
];

export default function App() {
  return (
    <>
      <Topography
        location="everest"
        mode="3d"
        extent="endless"
        camera={{ motion: 'orbit' }}
        theme={{ mode: 'dark' }}
        style={{ position: 'fixed', inset: 0, zIndex: -1 }}
      />
      <header className="nav">
        <strong>Northwind</strong>
        <nav>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <main>
        <section className="hero">
          <p className="eyebrow">Land surveying, reimagined</p>
          <h1>Know the ground before you break it.</h1>
          <p className="lede">Northwind Surveyors maps terrain for builders, farmers and cities that want fewer surprises.</p>
          <a className="button" href="#contact">Book a survey</a>
        </section>
        <section id="services" className="cards">
          {features.map((f) => (
            <article key={f.title}>
              <h2>{f.title}</h2>
              <p>{f.text}</p>
            </article>
          ))}
        </section>
        <section id="contact" className="cta">
          <h2>Start with a free site visit.</h2>
          <a className="button" href="mailto:hello@northwind.example">hello@northwind.example</a>
        </section>
      </main>
      <footer>© 2026 Northwind Surveyors, an imaginary company.</footer>
    </>
  );
}
