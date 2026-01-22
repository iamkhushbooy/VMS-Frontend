import { Zap, Users, Briefcase } from "lucide-react"

export default function Services() {
  const services = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimize your business with rapid deployment",
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Access world-class consulting professionals",
    },
    {
      icon: Briefcase,
      title: "Business Ready",
      description: "Solutions tailored to your needs",
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-purple-900/10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex justify-center mb-16">
          <div className="glass bg-white/5 border border-white/10 px-6 py-3 rounded-full flex items-center gap-2">
            <Zap size={18} className="text-cyan-400" />
            <span className="text-white font-semibold">Our Services</span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-balance mb-16">
          What We Can <span className="text-pink-400">Do</span> <span className="text-cyan-400">For You</span>
        </h2>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon
            const colors = [
              "from-cyan-500/10 to-blue-500/5 border-cyan-400/30",
              "from-pink-500/10 to-purple-500/5 border-pink-400/30",
              "from-green-500/10 to-teal-500/5 border-green-400/30",
            ]

            return (
              <div
                key={index}
                className={`glass bg-gradient-to-br ${colors[index]} border rounded-2xl p-8 hover:shadow-xl transition-all hover:scale-105 group`}
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-white/70 leading-relaxed">{service.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
