import './index.css'
import Nav from './components/Nav'
import LiveDemo from './components/LiveDemo'
import Results from './components/Results'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <LiveDemo />
        <Results />
      </main>
    </>
  )
}
