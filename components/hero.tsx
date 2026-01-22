import { Zap } from "lucide-react"

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance">
              <span className="text-cyan-400">OCTA</span>
              <br />
              <span className="text-white">VISION</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-md">
              Empowering businesses with innovative <span className="text-pink-400">ERP solutions</span> and expert
              consulting services. Transform your business with cutting-edge technology.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="glow px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2">
              <Zap size={20} />
              Get Started
            </button>
            <button className="px-8 py-4 rounded-full border border-white/30 text-white font-semibold hover:border-white/60 hover:bg-white/5 transition-all">
              About More
            </button>
          </div>
        </div>

        {/* Right Content - Service Cards */}
        <div className="space-y-6">
          {/* ERP Solutions Card */}
          <div className="glass bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-400/30 rounded-2xl p-6 hover:border-cyan-400/60 transition">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">ERP Solutions</h3>
                <p className="text-sm text-white/70 mt-1">Frappe & ERPNext Implementation</p>
              </div>
            </div>
          </div>

          {/* Custom Apps Card */}
          <div className="glass bg-gradient-to-br from-pink-500/10 to-purple-500/5 border border-pink-400/30 rounded-2xl p-6 hover:border-pink-400/60 transition">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Custom Apps</h3>
                <p className="text-sm text-white/70 mt-1">Tailored business solutions</p>
              </div>
            </div>
          </div>

          {/* Consulting Card */}
          <div className="glass bg-gradient-to-br from-green-500/10 to-teal-500/5 border border-green-400/30 rounded-2xl p-6 hover:border-green-400/60 transition">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Consulting</h3>
                <p className="text-sm text-white/70 mt-1">Expert business guidance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
