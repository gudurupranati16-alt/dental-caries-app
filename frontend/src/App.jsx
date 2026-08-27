import './index.css'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Problem from './components/Problem'
import Pipeline from './components/Pipeline'
import LiveDemo from './components/LiveDemo'
import Results from './components/Results'
import Architecture from './components/Architecture'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Pipeline />
        <LiveDemo />
        <Results />
        <Architecture />
      </main>
      <Footer />
    </>
  )
}
