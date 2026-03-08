import { SlotMachine } from './components/SlotMachine';
import { Package } from 'lucide-react';
import './index.css';

function App() {
  return (
    <div className="min-h-screen relative font-sans text-zinc-100 overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black -z-50" />
      <div className="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

      <main className="container mx-auto px-4 py-8 md:py-16 flex flex-col items-center">
        {/* Header */}
        <header className="mb-12 text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
            Lucky Slot
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 tracking-wider font-light">
            回して当てよう！特別クーポン
          </p>
        </header>

        {/* Main Slot Area */}
        <SlotMachine />

        {/* Footer Link */}
        <div className="mt-20">
          <a
            href="https://mitama987.github.io/xtp2n_free_lp/upgrade_lp_v2.html"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-6 py-4 rounded-2xl transition-all hover:bg-zinc-800/80"
          >
            <div className="bg-zinc-800 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5 text-zinc-300" />
            </div>
            <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
              XToolsPro3の詳細はこちら
            </span>
            <span className="text-zinc-500 group-hover:text-zinc-300 ml-2 group-hover:translate-x-1 transition-all">
              →
            </span>
          </a>
        </div>
      </main>
    </div>
  );
}

export default App;
