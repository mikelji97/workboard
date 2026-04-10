import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle, Sun, Moon } from 'lucide-react'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const { dark, toggle } = useTheme()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (isRegister) {
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); setLoading(false); return }
        const { error } = await signUp(email, password, name)
        if (error) {
          setError(error.message.includes('already registered') ? 'Este email ya está registrado.' : error.message)
        } else {
          setSuccess('¡Cuenta creada! Inicia sesión.')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) setError(error.message.includes('Invalid login') ? 'Email o contraseña incorrectos' : error.message)
      }
    } catch { setError('Error de conexión.') }
    setLoading(false)
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${dark ? 'bg-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 to-violet-50'}`}>
      {/* theme toggle */}
      <button onClick={toggle} className={`absolute top-6 right-6 p-2.5 rounded-xl transition-colors ${dark ? 'bg-white/10 text-white/60 hover:text-white' : 'bg-black/5 text-gray-500 hover:text-gray-800'}`}>
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* ambient */}
      <div className={`absolute -top-[40%] -left-[20%] w-[70vw] h-[70vw] rounded-full pointer-events-none ${dark ? 'opacity-[0.06]' : 'opacity-[0.15]'}`}
        style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }} />
      <div className={`absolute -bottom-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full pointer-events-none ${dark ? 'opacity-[0.05]' : 'opacity-[0.1]'}`}
        style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #6ee7b7 100%)' }}>
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Workboard</h1>
          <p className={`text-sm mt-2 ${dark ? 'text-white/40' : 'text-gray-500'}`}>
            {isRegister ? 'Crea tu cuenta para empezar' : 'Inicia sesión en tu workspace'}
          </p>
        </div>

        <div className={`rounded-2xl border p-8 backdrop-blur-xl shadow-xl ${dark ? 'border-white/[0.08] bg-white/[0.04]' : 'border-gray-200/60 bg-white/80'}`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className={`block text-[12px] font-medium mb-2 uppercase tracking-wider ${dark ? 'text-white/50' : 'text-gray-500'}`}>Nombre</label>
                <div className="relative">
                  <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-gray-400'}`} />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-[14px] transition-colors ${dark ? 'bg-white/[0.03] border-white/[0.08] text-white/90 placeholder:text-white/25 focus:border-violet-500/40' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20'} border`} />
                </div>
              </div>
            )}
            <div>
              <label className={`block text-[12px] font-medium mb-2 uppercase tracking-wider ${dark ? 'text-white/50' : 'text-gray-500'}`}>Email</label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-gray-400'}`} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-[14px] transition-colors ${dark ? 'bg-white/[0.03] border-white/[0.08] text-white/90 placeholder:text-white/25 focus:border-violet-500/40' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20'} border`} />
              </div>
            </div>
            <div>
              <label className={`block text-[12px] font-medium mb-2 uppercase tracking-wider ${dark ? 'text-white/50' : 'text-gray-500'}`}>Contraseña</label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dark ? 'text-white/30' : 'text-gray-400'}`} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-[14px] transition-colors ${dark ? 'bg-white/[0.03] border-white/[0.08] text-white/90 placeholder:text-white/25 focus:border-violet-500/40' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400/20'} border`} />
              </div>
            </div>

            {error && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"><AlertCircle size={16} className="text-red-400 shrink-0" /><p className="text-[13px] text-red-400">{error}</p></div>}
            {success && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20"><p className="text-[13px] text-green-500">{success}</p></div>}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
              style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' }}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}<ArrowRight size={16} /></>}
            </button>
          </form>

          <div className={`mt-6 pt-5 border-t text-center ${dark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
            <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
              className={`text-[13px] transition-colors ${dark ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'}`}>
              {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <span className="text-violet-500 font-medium">{isRegister ? 'Inicia sesión' : 'Regístrate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
